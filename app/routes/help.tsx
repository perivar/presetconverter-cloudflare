// app/routes/help.tsx
import { useTranslation } from "react-i18next";

export default function Help() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <h1 className="mb-4 text-center text-3xl font-bold">
          {t("help.title")}
        </h1>
        <div className="mb-8 rounded-lg border border-border p-6 shadow-lg"></div>
      </div>
    </div>
  );
}
