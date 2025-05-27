import { useCallback, useState } from "react";
import { useAvailableConversions } from "~/utils/registry/useAvailableConversions";
import { useTranslation } from "react-i18next";

import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";

interface TargetConversionProps {
  sourceData: any; // your parsed source preset data
  droppedFile: File | null;
  sourceFormatId: string; // e.g. "AbletonEq8"
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

export function TargetConversion({
  sourceData,
  droppedFile,
  sourceFormatId,
}: TargetConversionProps) {
  const { t } = useTranslation();
  const conversions = useAvailableConversions(sourceFormatId);

  const [selectedConversionId, setSelectedConversionId] = useState<
    string | null
  >(null);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConvert = useCallback(async () => {
    const selectedConversion = conversions.find(
      conv => `${conv.to}-${conv.formatId}` === selectedConversionId
    );
    if (!sourceData || !selectedConversion || !droppedFile) return;

    try {
      setIsLoading(true);
      setError(null);

      const convertedData = selectedConversion.convert(sourceData);

      if (!convertedData) {
        setError(t("error.conversionFailed"));
        return;
      }

      const extension = selectedConversion.extension.startsWith(".")
        ? selectedConversion.extension
        : `.${selectedConversion.extension}`;
      const mimeType = "application/octet-stream";

      const blob = new Blob([convertedData], { type: mimeType });
      const originalName = droppedFile.name.replace(/\.[^/.]+$/, "");
      const fileName = `${originalName}${extension}`;

      downloadBlob(blob, fileName);
    } catch (err) {
      console.error("Conversion error:", err);
      const message = err instanceof Error ? err.message : String(err);
      setError(t("error.conversionError", { message }));
    } finally {
      setIsLoading(false);
    }
  }, [sourceData, selectedConversionId, droppedFile, t, conversions]);

  if (!sourceData) {
    return <p>{t("conversion.noSourcePreset")}</p>;
  }

  return (
    <Card className="mx-auto max-w-md">
      <CardHeader>
        <CardTitle>{t("conversion.title")}</CardTitle>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="mb-4 rounded bg-red-100 p-2 font-medium text-red-600">
            {error}
          </div>
        )}

        <div className="mb-6 space-y-3">
          {conversions.length === 0 && (
            <p className="text-gray-600">
              {t("conversion.noAvailableConversions")}
            </p>
          )}

          {conversions.map(conv => (
            <Button
              key={`${conv.to}-${conv.formatId}`}
              onClick={() =>
                setSelectedConversionId(`${conv.to}-${conv.formatId}`)
              }
              className="w-full text-left"
              variant={
                selectedConversionId === `${conv.to}-${conv.formatId}`
                  ? "default"
                  : "outline"
              }>
              {conv.displayName}
            </Button>
          ))}
        </div>

        <Button
          onClick={handleConvert}
          disabled={!selectedConversionId || isLoading}
          className="w-full"
          size="lg"
          variant="secondary">
          {isLoading
            ? t("conversion.converting")
            : t("conversion.convertButton")}
        </Button>
      </CardContent>
    </Card>
  );
}
