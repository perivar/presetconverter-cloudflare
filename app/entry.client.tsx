import { startTransition, StrictMode } from "react";
import { fallbackLanguage } from "~/i18n/i18n-config";
import i18next from "i18next";
import I18nextBrowserLanguageDetector from "i18next-browser-languagedetector";
import Fetch from "i18next-fetch-backend";
import { hydrateRoot } from "react-dom/client";
import { I18nextProvider, initReactI18next } from "react-i18next";
import { HydratedRouter } from "react-router/dom";
import { getInitialNamespaces } from "remix-i18next/client";

async function main() {
  await i18next
    .use(initReactI18next)
    .use(Fetch)
    .use(I18nextBrowserLanguageDetector)
    .init({
      fallbackLng: fallbackLanguage, // Change this to your default language
      ns: getInitialNamespaces(),
      // Here we only want to detect the language from the html tag
      // since the middleware already detected the language server-side
      detection: { order: ["htmlTag"], caches: [] },
      // The path where your locales will be served
      backend: { loadPath: "/api/locales/{{lng}}/{{ns}}" },
    });

  startTransition(() => {
    hydrateRoot(
      document,
      <I18nextProvider i18n={i18next}>
        <StrictMode>
          <HydratedRouter />
        </StrictMode>
      </I18nextProvider>
    );
  });
}

main().catch(error => console.error(error));
