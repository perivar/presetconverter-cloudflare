import { useState } from "react";
import { downloadBlob } from "~/utils/downloadBlob";
import { getFileNameWithoutExtension } from "~/utils/StringUtils";
import { Download, EyeIcon } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import { Textarea } from "~/components/ui/textarea";

interface ConversionButtonListProps {
  conversions: any[]; // Assuming conversions is an array of objects with convert, extension, and displayName properties
  sourceData: any;
  originalFileName: string | null;
  isLoading: boolean;
  setIsLoading: (isLoading: boolean) => void;
  error: string | null;
  setError: (error: string | null) => void;
}

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
  const [isViewTextDialogOpen, setIsViewTextDialogOpen] = useState(false);
  const [viewTextContent, setViewTextContent] = useState("");

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
          <div key={`${conv.to}-${conv.formatId}`} className="flex gap-2">
            <Button
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
                  const originalName =
                    getFileNameWithoutExtension(originalFileName);
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
              variant="secondary"
              className="text-xs">
              {conv.displayName} <Download className="ml-1 size-3" />
            </Button>
            {conv.formatId === "txt" && (
              <Dialog
                open={isViewTextDialogOpen}
                onOpenChange={setIsViewTextDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      if (sourceData) {
                        const convertedData = conv.convert(sourceData);
                        if (typeof convertedData === "string") {
                          setViewTextContent(convertedData);
                          setIsViewTextDialogOpen(true);
                        } else {
                          setError(t("error.conversionFailed"));
                        }
                      }
                    }}
                    disabled={isLoading}
                    className="text-xs">
                    {conv.displayName} <EyeIcon className="ml-1 size-3" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="w-[80vw] max-w-[80vw]">
                  <DialogHeader>
                    <DialogTitle>{t("conversion.viewTextContent")}</DialogTitle>
                    <DialogDescription>
                      {t("conversion.viewTextDescription")}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <Textarea
                      value={viewTextContent}
                      readOnly
                      rows={20}
                      className="font-mono"
                    />
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
        ))}
      </div>
    </>
  );
}
