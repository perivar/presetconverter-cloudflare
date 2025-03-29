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
import { json, LoaderFunctionArgs, MetaFunction } from "@remix-run/cloudflare";
import { useFetcher, useLoaderData } from "@remix-run/react";
import { translatedLanguages } from "~/i18n/i18n";
import i18next from "~/i18n/i18n.server";
import { useRootLoaderData } from "~/root";
import { useTranslation } from "react-i18next";
import { Theme, useTheme } from "remix-themes";

export async function loader({ request }: LoaderFunctionArgs) {
  const t = await i18next.getFixedT(request);

  return json({
    title: t("title"),
    description: t("description"),
  });
}

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  return [
    { title: data?.title },
    { name: "description", content: data?.description },
  ];
};

export default function SettingsView() {
  const { t } = useTranslation();
  const data = useLoaderData<typeof loader>();

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
    <div className="container mx-auto my-6 px-4 sm:px-6 lg:px-8">
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
