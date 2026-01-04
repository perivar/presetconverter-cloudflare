// check https://zenn.dev/genie_oh/articles/3507c4d906b6e9
// and https://github.com/genie-oh/rrv7-cf-i18n-starter
// and https://github.com/sergiodxa/react-router-i18next-example/blob/main/app/middleware/i18next.ts

import {
  fallbackLanguage,
  i18nextResources,
  supportedLanguages,
} from "~/i18n/i18n-config";
import { initReactI18next } from "react-i18next";
import { createCookie } from "react-router";
import { createI18nextMiddleware } from "remix-i18next/middleware";

const isProduction = process.env.NODE_ENV === "production";

// This cookie will be used to store the user locale preference
export const localeCookie = createCookie("lng", {
  path: "/",
  sameSite: "lax",
  secure: isProduction,
  httpOnly: true,
  maxAge: 365 * 24 * 60 * 60, // 365 days
});

export const [i18nextMiddleware, getLocale, getInstance] =
  createI18nextMiddleware({
    detection: {
      supportedLanguages,
      fallbackLanguage,
      cookie: localeCookie,
    },
    i18next: {
      resources: i18nextResources,
    },
    plugins: [initReactI18next],
  });

// This comes from the /remix-i18next example project
// https://github.com/sergiodxa/react-router-i18next-example/blob/main/app/middleware/i18next.ts
// However enabling this causes issues with typescript
// Type instantiation is excessively deep and possibly infinite and
// Argument of type is not assignable to parameter of type '[key: number | "charAt" | "charCodeAt" etc.
// This adds type-safety to the `t` function
// declare module "i18next" {
//   interface CustomTypeOptions {
//     defaultNS: "translation";
//     resources: typeof i18nextResources.en; // Use `en` as source of truth for the types
//   }
// }
