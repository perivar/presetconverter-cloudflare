// check https://github.com/sergiodxa/react-router-cloudflare-minimal/blob/main/app/entry.worker.ts
// and https://qiita.com/genie-oh/items/8609fd75a375f8041166#react-router%E3%81%AEcontext%E3%81%AE%E3%82%BF%E3%82%A4%E3%83%97%E3%82%92unstable_routercontext%E3%81%AB%E5%A4%89%E6%9B%B4

import type { RequestHandler } from "react-router";
import {
  createContext,
  createRequestHandler,
  RouterContextProvider,
} from "react-router";

// Define the environment variables available in the Cloudflare Worker
export const ServerGlobalContext = createContext<{
  cloudflare: {
    env: Env;
    ctx: ExecutionContext;
  };
}>();

let requestHandler: RequestHandler | null = null;

export default {
  async fetch(request, env, ctx) {
    // Dynamically import React Router server build
    // This helps reduce worker init time
    const build = await import("virtual:react-router/server-build");
    // Only create a request handler if `handler` is still null (first request)
    if (requestHandler === null)
      requestHandler = createRequestHandler(build, import.meta.env.MODE);

    // Create a new router context for each request
    const context = new RouterContextProvider();
    context.set(ServerGlobalContext, {
      cloudflare: { env, ctx },
    });

    // Call the handler with the request and context and return the response
    return await requestHandler(request, context);
  },
} satisfies ExportedHandler<Env>;
