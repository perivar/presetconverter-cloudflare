import { Dispatch, SetStateAction } from "react";
import { downloadBlob } from "~/utils/downloadBlob";
import { useTranslation } from "react-i18next";

import { Button } from "~/components/ui/button";

interface ButtonDownloadProps {
  data: any;
  fileName: string;
  mimeType: string;
  processData: (data: any) => Promise<BlobPart>; // Function to process data into a format suitable for Blob
  isLoading: boolean;
  setIsLoading: Dispatch<SetStateAction<boolean>>;
  setError: Dispatch<SetStateAction<string | null>>;
}

export function ButtonDownload({
  data,
  fileName,
  mimeType,
  processData,
  isLoading,
  setIsLoading,
  setError,
}: ButtonDownloadProps) {
  const { t } = useTranslation();

  const handleDownload = async () => {
    if (!data || !fileName) return;

    try {
      setIsLoading(true);
      setError(null);

      const processedData = await processData(data);

      if (!processedData) {
        setError(t("error.conversionFailed"));
        return;
      }

      const blob = new Blob([processedData], { type: mimeType });
      downloadBlob(blob, fileName);
    } catch (err) {
      console.error("Download error:", err);
      const message = err instanceof Error ? err.message : String(err);
      setError(t("error.conversionError", { message }));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handleDownload}
      disabled={isLoading}
      size="sm"
      variant="secondary">
      {fileName}
    </Button>
  );
}
