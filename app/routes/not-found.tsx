// app/routes/not-found.tsx

import { useTranslation } from "react-i18next";
import { data } from "react-router";

export async function loader() {
  return data(null, { status: 404 });
}

export default function Component() {
  const { t } = useTranslation();

  return (
    <div className="container mx-auto flex h-screen flex-col items-center p-4 pt-6 text-center">
      <h1 className="mb-4 text-xl font-bold text-destructive">
        {t("notFound.title")}
      </h1>
      <p>{t("notFound.description")}</p>
    </div>
  );
}
