import { useEffect, useState } from "react";
import { AbletonDevicePreset } from "~/utils/ableton/AbletonDevicePreset";
import { unwrapAbletonDevicePreset } from "~/utils/ableton/AbletonDevicePresetUnwrapper";
import { ChevronsUpDown } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "~/components/ui/collapsible";
import { TargetConversion } from "~/components/TargetConversion";

interface AbletonDevicePresetsDisplayProps {
  abletonDevicePresets: AbletonDevicePreset[] | null;
  originalFileName: string | null;
}

interface UnwrappedPreset {
  sourceData: any;
  sourceFormatId: string;
  filename: string;
  format: string;
}

export function AbletonDevicePresetsDisplay({
  abletonDevicePresets,
  originalFileName,
}: AbletonDevicePresetsDisplayProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unwrappedPresets, setUnwrappedPresets] = useState<UnwrappedPreset[]>(
    []
  );
  const { t } = useTranslation();

  useEffect(() => {
    if (!abletonDevicePresets || abletonDevicePresets.length === 0) {
      setUnwrappedPresets([]);
      return;
    }

    const unwrapData = async () => {
      setIsLoading(true);
      setError(null);
      const results: UnwrappedPreset[] = [];
      for (const presetFile of abletonDevicePresets) {
        try {
          const unwrapped = unwrapAbletonDevicePreset(presetFile);
          results.push({
            sourceData: unwrapped.sourceData,
            sourceFormatId: unwrapped.sourceFormatId,
            filename: presetFile.filename,
            format: presetFile.format,
          });
        } catch (err) {
          console.error("Unwrapping error:", err);
          const message = err instanceof Error ? err.message : String(err);
          setError(t("error.conversionError", { message }));
          // Optionally break or continue depending on desired behavior on error
        }
      }
      setUnwrappedPresets(results);
      setIsLoading(false);
    };

    unwrapData();
  }, [abletonDevicePresets, t]); // Depend on abletonDevicePresets and t

  if (!abletonDevicePresets || abletonDevicePresets.length === 0) {
    return null;
  }

  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle>{t("ableton.devicePresets.title")}</CardTitle>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="mb-4 rounded bg-red-100 p-2 font-medium text-red-600">
            {error}
          </div>
        )}
        <Collapsible defaultOpen={false}>
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold">
              {`${t("ableton.devicePresets.description")} (${unwrappedPresets.length})`}
            </h4>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="w-9 p-0">
                <ChevronsUpDown className="size-4" />
                <span className="sr-only">Toggle</span>
              </Button>
            </CollapsibleTrigger>
          </div>
          <CollapsibleContent>
            <div>
              {unwrappedPresets.map((unwrappedPreset, index) => (
                <div key={index} className="border-b py-2 last:border-0">
                  <p>
                    <strong>{t("fileInfo.fileName")}:</strong>{" "}
                    {unwrappedPreset.filename}
                  </p>
                  <p>
                    <strong>{t("fileInfo.detectedType")}:</strong>{" "}
                    {unwrappedPreset.format}{" "}
                  </p>
                  <p>
                    <strong>{t("fileInfo.detectedFormat")}:</strong>{" "}
                    {unwrappedPreset.sourceFormatId}
                  </p>

                  <TargetConversion
                    sourceData={unwrappedPreset.sourceData}
                    originalFileName={originalFileName}
                    sourceFormatId={unwrappedPreset.sourceFormatId}
                  />
                </div>
              ))}
            </div>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
}
