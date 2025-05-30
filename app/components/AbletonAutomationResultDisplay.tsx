import { useState } from "react";
import { AutomationConversionResult } from "~/utils/ableton/Midi";
import { getFileNameWithoutExtension } from "~/utils/StringUtils";
import { MidiData } from "midi-file";
import * as midiFile from "midi-file";
import { useTranslation } from "react-i18next";

import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { ButtonDownload } from "~/components/ButtonDownload";
import PlotlyClientOnly from "~/components/PlotlyClientOnly";

interface AbletonAutomationResultDisplayProps {
  abletonAutomationConversionResult: AutomationConversionResult | null;
}

export function AbletonAutomationResultDisplay({
  abletonAutomationConversionResult,
}: AbletonAutomationResultDisplayProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { t } = useTranslation();

  if (!abletonAutomationConversionResult) {
    return null;
  }

  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle>{t("ableton.automation.title")}</CardTitle>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="mb-4 rounded bg-red-100 p-2 font-medium text-red-600">
            {error}
          </div>
        )}
        {abletonAutomationConversionResult?.midiDataArray &&
        abletonAutomationConversionResult.midiDataArray.length > 0 ? (
          <div className="mb-5">
            <h4 className="text-sm font-semibold">
              {t("ableton.automation.midiFiles")}:
            </h4>
            <div className="mt-1 flex flex-wrap gap-2">
              {abletonAutomationConversionResult.midiDataArray.map(
                (automationMidi, index) => {
                  if (automationMidi) {
                    const suggestedFileName = automationMidi.suggestedFileName;
                    const fileNameNoExtension = getFileNameWithoutExtension(
                      suggestedFileName ?? "ableton-automation"
                    );
                    const midiFileName = `${fileNameNoExtension}.mid`;
                    const midiData = automationMidi.midiData;

                    return (
                      <ButtonDownload
                        key={index}
                        data={midiData}
                        fileName={midiFileName}
                        mimeType="application/octet-stream"
                        processData={async (data: MidiData) => {
                          const midiDataArray = midiFile.writeMidi(data);
                          return new Uint8Array(midiDataArray);
                        }}
                        isLoading={isLoading}
                        setIsLoading={setIsLoading}
                        setError={setError}
                      />
                    );
                  }
                }
              )}
            </div>
          </div>
        ) : (
          <p>{t("ableton.automation.noMidiFiles")}</p>
        )}

        {abletonAutomationConversionResult?.midiLogArray &&
        abletonAutomationConversionResult.midiLogArray.length > 0 ? (
          <div className="mb-5">
            <h4 className="text-sm font-semibold">
              {t("ableton.automation.midiLogs")}:
            </h4>
            <div className="mt-1 flex flex-wrap gap-2">
              {abletonAutomationConversionResult.midiLogArray.map(
                (automationMidiLog, index) => {
                  if (automationMidiLog) {
                    const suggestedFileName =
                      automationMidiLog.suggestedFileName;
                    const fileNameNoExtension = getFileNameWithoutExtension(
                      suggestedFileName ?? "ableton-automation"
                    );
                    const midiLogFileName = `${fileNameNoExtension}_mid.txt`;
                    const midiLogString = automationMidiLog.logString;

                    return (
                      <ButtonDownload
                        key={index}
                        data={midiLogString}
                        fileName={midiLogFileName}
                        mimeType="text/plain"
                        processData={async (data: string) => {
                          return data; // logString is already the final data
                        }}
                        isLoading={isLoading}
                        setIsLoading={setIsLoading}
                        setError={setError}
                      />
                    );
                  }
                }
              )}
            </div>
          </div>
        ) : (
          <p>{t("ableton.automation.noMidiLogs")}</p>
        )}

        {abletonAutomationConversionResult?.automationPlotArray &&
        abletonAutomationConversionResult.automationPlotArray.length > 0 ? (
          <div>
            <h4 className="mb-2 text-sm font-semibold">
              {t("ableton.automation.plots")}:
            </h4>
            {abletonAutomationConversionResult.automationPlotArray.map(
              (automationPlot, index) => {
                if (automationPlot) {
                  const plot = automationPlot.plot;
                  const suggestedFileName = automationPlot.suggestedFileName;
                  const fig = JSON.parse(plot);
                  return (
                    <div key={index}>
                      <h4 className="text-sm font-normal">
                        {suggestedFileName}
                      </h4>
                      <PlotlyClientOnly data={fig.data} layout={fig.layout} />
                    </div>
                  );
                }
              }
            )}
          </div>
        ) : (
          <p>{t("ableton.automation.noPlots")}</p>
        )}
      </CardContent>
    </Card>
  );
}
