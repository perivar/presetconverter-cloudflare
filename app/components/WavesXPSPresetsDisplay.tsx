import { WavesSSLToGenericEQ } from "~/utils/converters/WavesSSLToGenericEQ";
import { GenericEQPreset } from "~/utils/preset/GenericEQPreset";
import { Preset } from "~/utils/preset/Preset";
import { WavesPreset } from "~/utils/preset/WavesPreset";
import { WavesSSLChannel } from "~/utils/preset/WavesSSLChannel";
import {
  getWavesSSLCompNumericRatio,
  getWavesSSLCompRatioLabel,
  WavesSSLComp,
} from "~/utils/preset/WavesSSLComp";
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

import { CompressorGraph } from "./CompressorGraph";
import { EqualizerChart } from "./EqualizerChart";

interface WavesXPSPresetsDisplayProps {
  wavesXPSPresets: Preset[] | null;
  originalFileName: string | null;
}

export function WavesXPSPresetsDisplay({
  wavesXPSPresets,
  originalFileName,
}: WavesXPSPresetsDisplayProps) {
  const { t } = useTranslation();

  if (!wavesXPSPresets || wavesXPSPresets.length === 0) {
    return null;
  }

  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle>{t("waves.xpsPresets.title")}</CardTitle>
      </CardHeader>
      <CardContent>
        <Collapsible defaultOpen={false}>
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold">
              {`${t("waves.xpsPresets.description")} (${wavesXPSPresets.length})`}
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
              {wavesXPSPresets.map((preset, index) => {
                const wavesPreset = preset as WavesPreset; // Cast to WavesPreset to access PresetName
                let genericEQPreset: GenericEQPreset | null = null;

                if (preset instanceof WavesSSLChannel) {
                  genericEQPreset = WavesSSLToGenericEQ.convertBase(preset);
                }
                // If WavesSSLComp needs conversion to GenericEQPreset, a new converter would be needed.

                return (
                  <div key={index} className="border-b py-2 last:border-0">
                    <p>
                      <strong>{t("fileInfo.fileName")}:</strong>{" "}
                      {wavesPreset.PresetName || "Unknown Preset"}
                    </p>
                    <p>
                      <strong>{t("fileInfo.detectedFormat")}:</strong>{" "}
                      {`${wavesPreset.constructor.name}`}
                    </p>

                    {genericEQPreset && genericEQPreset.Bands.length > 0 && (
                      <div className="mt-4">
                        {/* EQ Graph */}
                        <EqualizerChart preset={genericEQPreset} />
                      </div>
                    )}

                    {preset instanceof WavesSSLComp && (
                      <div className="my-6">
                        <h3 className="mb-1 text-lg font-medium">
                          {preset.PresetName}
                        </h3>

                        <div className="mb-2 flex items-center justify-between text-sm text-muted-foreground">
                          <span>
                            Ratio: {getWavesSSLCompRatioLabel(preset.Ratio)}
                          </span>
                          <span>Threshold: {preset.Threshold} dB</span>
                        </div>

                        <CompressorGraph
                          threshold={preset.Threshold}
                          ratio={getWavesSSLCompNumericRatio(preset.Ratio)}
                          makeupGain={preset.MakeupGain}
                          knee={0}
                        />
                      </div>
                    )}

                    <TargetConversion
                      sourceData={preset}
                      originalFileName={originalFileName}
                      sourceFormatId={`${wavesPreset.constructor.name}`}
                    />
                  </div>
                );
              })}
            </div>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
}
