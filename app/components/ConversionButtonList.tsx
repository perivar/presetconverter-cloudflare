import { useTranslation } from "react-i18next";

import { Button } from "~/components/ui/button";

interface ConversionButtonListProps {
  conversions: any[]; // Assuming conversions is an array of objects with convert, extension, and displayName properties
  sourceData: any;
  originalFileName: string | null;
  isLoading: boolean;
  setIsLoading: (isLoading: boolean) => void;
  error: string | null;
  setError: (error: string | null) => void;
}

const downloadBlob = (blob: Blob, fileName: string) => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

export function ConversionButtonList({
  conversions,
  sourceData,
  originalFileName,
  isLoading,
  setIsLoading,
  error,
  setError,
}: ConversionButtonListProps) {
  const { t } = useTranslation();

  return (
    <>
      {error && (
        <div className="mb-4 rounded bg-red-100 p-2 font-medium text-red-600">
          {error}
        </div>
      )}

      <div className="mt-1 flex flex-wrap gap-2">
        {conversions.length === 0 && (
          <span className="italic">
            {t("conversion.noAvailableConversions")}
          </span>
        )}

        {conversions.map(conv => (
          <Button
            key={`${conv.to}-${conv.formatId}`}
            onClick={async () => {
              if (!sourceData || !originalFileName) return;

              try {
                setIsLoading(true);
                setError(null);

                const convertedData = conv.convert(sourceData);

                if (!convertedData) {
                  setError(t("error.conversionFailed"));
                  return;
                }

                const extension = conv.extension.startsWith(".")
                  ? conv.extension
                  : `.${conv.extension}`;
                const mimeType = "application/octet-stream";

                const blob = new Blob([convertedData], { type: mimeType });
                const originalName = originalFileName.replace(/\.[^/.]+$/, "");
                const fileName = `${originalName}${extension}`;

                downloadBlob(blob, fileName);
              } catch (err) {
                console.error("Conversion error:", err);
                const message =
                  err instanceof Error ? err.message : String(err);
                setError(t("error.conversionError", { message }));
              } finally {
                setIsLoading(false);
              }
            }}
            disabled={isLoading}
            size="sm"
            variant="secondary">
            {conv.displayName}
          </Button>
        ))}
      </div>
    </>
  );
}
