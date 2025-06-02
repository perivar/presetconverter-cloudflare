import { useState } from "react";
import { WavesSSLChannelToGenericEQ } from "~/utils/converters/WavesSSLChannelToGenericEQ";
import { WavesSSLCompToGenericCompressorLimiter } from "~/utils/converters/WavesSSLCompToGenericCompressorLimiter";
import { GenericCompressorLimiter } from "~/utils/preset/GenericCompressorLimiter";
import { GenericEQPreset } from "~/utils/preset/GenericEQPreset";
import { Preset } from "~/utils/preset/Preset";
import { WavesPreset } from "~/utils/preset/WavesPreset";
import { WavesSSLChannel } from "~/utils/preset/WavesSSLChannel";
import { WavesSSLComp } from "~/utils/preset/WavesSSLComp";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "~/components/ui/collapsible";
import { TargetConversion } from "~/components/TargetConversion";

import { CompressorLimiterGraph } from "./CompressorLimiterGraph";
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
  const [isOpen, setIsOpen] = useState(false); // State for collapsible

  if (!wavesXPSPresets || wavesXPSPresets.length === 0) {
    return null;
  }

  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle>{t("waves.xpsPresets.title")}</CardTitle>
      </CardHeader>
      <CardContent>
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CollapsibleTrigger asChild>
            <div className="flex items-center justify-between">
              <h4
                className={`text-sm font-semibold ${isOpen ? "font-bold" : ""}`}>
                {`${t("waves.xpsPresets.description")} (${wavesXPSPresets.length})`}
              </h4>
              <Button variant="outline" size="sm" className="w-9 p-0">
                {isOpen ? (
                  <ChevronUp className="size-4" />
                ) : (
                  <ChevronDown className="size-4" />
                )}
                <span className="sr-only">Toggle</span>
              </Button>
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div>
              {wavesXPSPresets.map((preset, index) => {
                const wavesPreset = preset as WavesPreset; // Cast to WavesPreset to access PresetName
                let genericEQPreset: GenericEQPreset | null = null;

                if (preset instanceof WavesSSLChannel) {
                  genericEQPreset =
                    WavesSSLChannelToGenericEQ.convertBase(preset);
                }

                let genericCompLimitPreset: GenericCompressorLimiter | null =
                  null;
                if (preset instanceof WavesSSLComp) {
                  genericCompLimitPreset =
                    WavesSSLCompToGenericCompressorLimiter.convertBase(preset);
                }

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

                    {genericCompLimitPreset && (
                      <div className="my-6">
                        <h3 className="mb-1 text-lg font-medium">
                          {genericCompLimitPreset.Name}
                        </h3>

                        <div className="mb-2 flex items-center justify-around text-sm text-muted-foreground">
                          <span>
                            Threshold: {genericCompLimitPreset.Threshold} dB
                          </span>
                          <span>
                            Ratio: {genericCompLimitPreset.getRatioLabel()}
                          </span>
                        </div>

                        {/* Compressor Limiter Graph */}
                        <CompressorLimiterGraph comp={genericCompLimitPreset} />
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
