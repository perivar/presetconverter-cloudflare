import { useEffect } from "react";
import clsx from "clsx";
import { useTranslation } from "react-i18next";
import {
  data,
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useRouteLoaderData,
} from "react-router";
import {
  PreventFlashOnWrongTheme,
  ThemeProvider,
  useTheme,
} from "remix-themes";

import type { Route } from "./+types/root";
import ConfirmProvider from "./components/layout/confirm-provider";
import ResponsiveNavBar from "./components/ResponsiveNavBar";
import { Toaster } from "./components/ui/toaster";
import {
  getLocale,
  i18nextMiddleware,
  localeCookie,
} from "./middleware/i18next";
import tailwindcss from "./tailwind.css?url";
import { themeSessionResolver } from "./theme.sessions.server";
import { allConverters } from "./utils/registry/allConverters";
import { registerAllConverters } from "./utils/registry/converterRegistry";

export const middleware = [i18nextMiddleware];

export const links: Route.LinksFunction = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Montserrat:ital,wght@0,100..900;1,100..900&family=Roboto+Mono:ital,wght@0,100..700;1,100..700&family=Roboto+Slab:wght@100..900&display=swap",
  },
  {
    rel: "stylesheet",
    href: tailwindcss,
  },
];

export async function loader({ request, context }: Route.LoaderArgs) {
  // Get theme from session
  const themeSession = await themeSessionResolver(request);
  const theme = themeSession.getTheme();
  console.log("Theme: " + theme);

  // Get locale from i18next
  const locale = getLocale(context);
  console.log("Locale: " + locale);

  return data(
    {
      theme,
      locale,
    },
    { headers: { "Set-Cookie": await localeCookie.serialize(locale) } }
  );
}

// custom hook to simplify getting access to root loader data
export function useRootLoaderData() {
  return useRouteLoaderData<typeof loader>("root");
}

// It defines the overall page structure (header, footer, etc.) and renders children
export function Layout({ children }: { children: React.ReactNode }) {
  const rootLoaderData = useRootLoaderData();

  return (
    <ThemeProvider
      specifiedTheme={rootLoaderData?.theme ?? null}
      themeAction="/action/set-theme">
      <ConfirmProvider>
        <InnerLayout ssrTheme={Boolean(rootLoaderData?.theme)}>
          {children}
        </InnerLayout>
      </ConfirmProvider>
    </ThemeProvider>
  );
}

// In order to avoid the Error: useTheme must be used within a ThemeProvider
function InnerLayout({
  ssrTheme,
  children,
}: {
  ssrTheme: boolean;
  children: React.ReactNode;
}) {
  const [theme] = useTheme();
  const { i18n } = useTranslation();

  return (
    <html
      lang={i18n.language}
      dir={i18n.dir(i18n.language)}
      className={clsx(theme)}>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <PreventFlashOnWrongTheme ssrTheme={ssrTheme} />
        <Links />
      </head>
      <body>
        <ResponsiveNavBar />
        {/* children will be the root Component, ErrorBoundary, or HydrateFallback */}
        {children}
        <ScrollRestoration />
        <Scripts />
        <Toaster />
      </body>
    </html>
  );
}

export default function App({ loaderData: { locale } }: Route.ComponentProps) {
  const { i18n } = useTranslation();
  useEffect(() => {
    if (i18n.language !== locale) i18n.changeLanguage(locale);
  }, [locale, i18n]);

  useEffect(() => {
    registerAllConverters(allConverters); // Register converters once on the client
  }, []);

  // React Routers’s Outlet renders the matched route’s component, which will be wrapped by Layout.
  return <Outlet />;
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = "Oops!";
  let details = "An unexpected error occurred.";
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "404" : "Error";
    details =
      error.status === 404
        ? "The requested page could not be found."
        : error.statusText || details;
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <main className="container mx-auto p-4 pt-16">
      <h1>{message}</h1>
      <p>{details}</p>
      {stack && (
        <pre className="w-full overflow-x-auto p-4">
          <code>{stack}</code>
        </pre>
      )}
    </main>
  );
}
