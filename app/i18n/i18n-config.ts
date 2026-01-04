import enTranslation from "~/i18n/locales/en/translation.json";
import noTranslation from "~/i18n/locales/no/translation.json";
import type { Resource } from "i18next";

export const translatedLanguages = [
  { code: "no", flagCode: "no", label: "Norsk", translation: noTranslation },
  { code: "en", flagCode: "us", label: "English", translation: enTranslation }, // the fallback language is the last in the list
] as const;

// This is the list of languages your application supports, the last one is your fallback language
// Dynamically extract supported languages from translatedLanguages array
export const supportedLanguages: string[] = translatedLanguages.map(
  lang => lang.code
);

// This is the language you want to use in case the user language is not in the supportedLngs
export const fallbackLanguage =
  translatedLanguages[translatedLanguages.length - 1].code;

// These are the translation files we created, `translation` is the namespace
// we want to use, we'll use this to include the translations in the bundle
// instead of loading them on-demand
// Passing `resources` to the `i18next` configuration, avoids using a backend
// build a map like this dynamically:
// resources: {
//   en: { translation: enTranslation },
//   no: { translation: noTranslation },
// },
export const i18nextResources = Object.fromEntries(
  translatedLanguages.map(lang => [
    lang.code,
    { translation: lang.translation },
  ])
) as Resource;
