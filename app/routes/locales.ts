import { i18nextResources } from "~/i18n/i18n-config";
import { cacheHeader } from "pretty-cache-header";
import { data } from "react-router";
import { z } from "zod";

import type { Route } from "./+types/locales";

const resources = i18nextResources;

export async function loader({ params }: Route.LoaderArgs) {
  // Validate language using a Zod enum built from resource keys
  const languageKeys = Object.keys(resources) as [string, ...string[]];
  const languageSchema = z.enum(languageKeys);
  const lngResult = languageSchema.safeParse(params.lng);

  if (!lngResult.success) {
    return data({ error: lngResult.error }, { status: 400 });
  }

  const lang = lngResult.data;

  // Validate namespace for the given language
  const namespaceKeys = Object.keys(resources[lang]);

  // Fallback: return 500 if no namespaces exist for this language
  if (namespaceKeys.length === 0) {
    return data(
      { error: "No namespaces found for this language" },
      { status: 500 }
    );
  }

  const namespaceSchema = z.enum(namespaceKeys as [string, ...string[]]);
  const nsResult = namespaceSchema.safeParse(params.ns);

  if (!nsResult.success) {
    return data({ error: nsResult.error }, { status: 400 });
  }

  const namespace = nsResult.data;

  // Create response headers
  const headers = new Headers();

  const isProduction = process.env.NODE_ENV === "production";

  // On production, we want to add cache headers to the response
  if (isProduction) {
    headers.set(
      "Cache-Control",
      cacheHeader({
        maxAge: "5m", // Cache in the browser for 5 minutes
        sMaxage: "1d", // Cache in the CDN for 1 day
        staleWhileRevalidate: "7d", // Serve stale content while revalidating for 7 days
        staleIfError: "7d", // Serve stale content if there's an error for 7 days
      })
    );
  }

  // Return the actual translation namespace as JSON
  return data(resources[lang][namespace], { headers });
}
