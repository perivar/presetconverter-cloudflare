// app/routes/settings._index.tsx

import { useState } from "react";
import Header from "@/components/Header";
import ListItem from "@/components/ListItem";
import { ModeToggle } from "@/components/ModeToggle";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { translatedLanguages } from "~/i18n/i18n-config";
import { getInstance } from "~/middleware/i18next";
import { useRootLoaderData } from "~/root";
import { useTranslation } from "react-i18next";
import { data, useFetcher } from "react-router";
import { Theme, useTheme } from "remix-themes";

import { Route } from "./+types/settings._index";

export async function loader({ context }: Route.LoaderArgs) {
  const i18next = getInstance(context);

  return data({
    title: i18next.t("title"),
    description: i18next.t("description"),
  });
}

export function meta({ loaderData }: Route.MetaArgs) {
  return [
    { title: loaderData?.title },
    { name: "description", content: loaderData?.description },
  ];
}

export default function SettingsView() {
  const { t } = useTranslation();

  // get locale from root loader
  const rootLoaderData = useRootLoaderData();
  const [locale, setLocale] = useState(rootLoaderData?.locale);

  const fetcher = useFetcher();

  const [theme, _setTheme] = useTheme();

  const handleLocaleChange = (newLocale: string) => {
    setLocale(newLocale);
    fetcher.submit(
      { locale: newLocale },
      { method: "post", action: "/action/set-locale" }
    );
  };

  return (
    <div className="mx-auto my-6 min-h-screen px-4 sm:px-6 lg:px-16">
      <Header title={t("settings.title")} />

      <ListItem
        title={t("settings.theme")}
        subtitle={
          theme == Theme.DARK
            ? t("settings.theme_dark")
            : t("settings.theme_light")
        }>
        <ModeToggle
          lightLabel={t("settings.theme_light")}
          darkLabel={t("settings.theme_dark")}
        />
      </ListItem>

      <ListItem
        title={t("settings.language")}
        subtitle={
          translatedLanguages.find(lang => lang.code === locale)?.label
        }>
        <fetcher.Form
          method="post"
          action="/action/set-locale"
          className="flex flex-row gap-5">
          <Select onValueChange={handleLocaleChange} value={locale}>
            <SelectTrigger className="w-fit">
              <SelectValue>
                {translatedLanguages.find(lang => lang.code === locale)?.label}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {translatedLanguages.map(lang => (
                <SelectItem key={`lang-option-${lang.code}`} value={lang.code}>
                  {lang.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </fetcher.Form>
      </ListItem>
    </div>
  );
}
