// app/routes/frontpage.tsx

import { useCallback, useState } from "react";
import type { LoaderFunctionArgs, MetaFunction } from "@remix-run/cloudflare";
import { json } from "@remix-run/react";
import i18next from "~/i18n/i18n.server";
import { AbletonDevicePreset } from "~/utils/ableton/AbletonDevicePreset";
import { unwrapAbletonDevicePreset } from "~/utils/ableton/AbletonDevicePresetUnwrapper"; // Import the unwrapper
import { AbletonHandlers } from "~/utils/ableton/AbletonHandlers";
import {
  AutomationConversionResult,
  convertAutomationToMidi,
  convertToMidi,
  logMidiDataToString,
} from "~/utils/ableton/Midi";
import { FabFilterToGenericEQ } from "~/utils/converters/FabFilterToGenericEQ";
import { SteinbergFrequencyToGenericEQ } from "~/utils/converters/SteinbergFrequencyToGenericEQ";
import { downloadBlob } from "~/utils/downloadBlob";
import { FabFilterProQ } from "~/utils/preset/FabFilterProQ";
import { FabFilterProQ2 } from "~/utils/preset/FabFilterProQ2";
import { FabFilterProQ3 } from "~/utils/preset/FabFilterProQ3";
import { FabFilterProQBase } from "~/utils/preset/FabFilterProQBase";
import { FxChunkSet, FXP, FxProgramSet } from "~/utils/preset/FXP";
import { FXPPresetFactory } from "~/utils/preset/FXPPresetFactory";
import { GenericEQBand, GenericEQPreset } from "~/utils/preset/GenericEQPreset";
import { Preset } from "~/utils/preset/Preset";
import { SteinbergFrequency } from "~/utils/preset/SteinbergFrequency";
import { VstPresetFactory } from "~/utils/preset/VstPresetFactory";
import { getFileNameWithoutExtension } from "~/utils/StringUtils";
import * as midiFile from "midi-file";
import { MidiData } from "midi-file";
import { useDropzone } from "react-dropzone";
import { useTranslation } from "react-i18next";

import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "~/components/ui/collapsible";
import { EqualizerBandTable } from "~/components/EqualizerBandTable";
import { EqualizerChart } from "~/components/EqualizerChart";
import PlotlyClientOnly from "~/components/PlotlyClientOnly";
import { TargetConversion } from "~/components/TargetConversion";

export async function loader({ request }: LoaderFunctionArgs) {
  const t = await i18next.getFixedT(request);

  return json({
    title: t("title"),
    description: t("description"),
  });
}

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  return [
    { title: data?.title },
    { name: "description", content: data?.description },
  ];
};

interface FxpPresetData {
  fxId: string | null;
  chunkData: Uint8Array | null;
  fabfilterEQPreset: FabFilterProQBase | null;
  fabfilterEQSource: string | null;
}

const readFxpAsFabFilterEQ = (data: Uint8Array): FxpPresetData => {
  const fxp = new FXP();
  fxp.readFile(data);

  let fabfilterEQPreset: FabFilterProQBase | null = null;
  let fabfilterEQSource: string | null = null;
  let fxId: string | null = null;
  let chunkData: Uint8Array | null = null;

  // First try to parse as a Pro-Q preset using VstPresetFactory
  if (fxp.content?.FxID) {
    const { preset, source } = FXPPresetFactory.getPresetFromFXP(data);
    fabfilterEQPreset = preset as FabFilterProQBase | null; // Cast back to FabFilterProQBase for existing logic
    fabfilterEQSource = source;
    fxId = fxp.content.FxID;
  }

  // If not a Pro-Q preset or parsing failed, get the raw chunk data
  if (
    !fabfilterEQPreset &&
    fxp.content &&
    (fxp.content instanceof FxProgramSet || fxp.content instanceof FxChunkSet)
  ) {
    fxId = fxp.content.FxID ?? null;
    chunkData = fxp.content.ChunkData ?? null;
  }

  return {
    fxId,
    chunkData,
    fabfilterEQPreset,
    fabfilterEQSource,
  };
};

export default function Index() {
  const { t } = useTranslation();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [droppedFile, setDroppedFile] = useState<File | null>(null);
  const [sourceFormat, setSourceFormat] = useState<string | null>(null);
  const [sourceData, setSourceData] = useState<Preset | null>(null);
  const [parsedGenericData, setParsedGenericData] =
    useState<GenericEQPreset | null>(null);
  const [hoveredFrequency, setHoveredFrequency] = useState<number | null>(null);
  const [abletonDevicePresets, setAbletonDevicePresets] = useState<
    AbletonDevicePreset[] | null
  >(null);
  const [abletonMidiFile, setAbletonMidiFile] = useState<MidiData | null>(null);
  const [
    abletonAutomationConversionResult,
    setAbletonAutomationConversionResult,
  ] = useState<AutomationConversionResult | null>(null);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      setError(null);
      setSourceFormat(null);
      setSourceData(null);
      setParsedGenericData(null);
      setDroppedFile(null);
      setAbletonDevicePresets(null);
      setAbletonMidiFile(null);
      setAbletonAutomationConversionResult(null);
      setIsLoading(true);

      if (acceptedFiles.length === 0) {
        setError(t("error.noFileSelected"));
        setIsLoading(false);
        return;
      }

      const file = acceptedFiles[0];
      setDroppedFile(file);

      const reader = new FileReader();

      reader.onerror = () => {
        setError(t("error.readFileError", { fileName: file.name }));
        setIsLoading(false);
      };

      reader.onload = async () => {
        try {
          const arrayBuffer = reader.result as ArrayBuffer;
          const data = new Uint8Array(arrayBuffer);

          const ext = file.name.toLowerCase().split(".").pop();
          if (ext === "ffp" || ext === "fxp") {
            let chunkData = data;
            if (ext === "fxp") {
              const { chunkData: fxpChunkData, fabfilterEQPreset } =
                readFxpAsFabFilterEQ(data);
              if (fabfilterEQPreset) {
                // Successfully parsed a Pro-Q preset
                setSourceFormat(fabfilterEQPreset.PlugInName);
                setSourceData(fabfilterEQPreset);

                // convert to common eqpreset format
                const eqPreset =
                  FabFilterToGenericEQ.convertBase(fabfilterEQPreset);
                setParsedGenericData(eqPreset);

                setIsLoading(false);
                return;
              }

              // Not a Pro-Q preset but we have chunk data
              if (fxpChunkData) {
                chunkData = fxpChunkData.slice(4, fxpChunkData.length - 4);
              }
            }

            // If we get here, either it's an FFP file or FXP identification failed
            // Try reading with each version in sequence
            const proQ3 = new FabFilterProQ3();
            if (proQ3.readFFP(chunkData)) {
              setSourceFormat(proQ3.PlugInName);
              setSourceData(proQ3);

              const eqPreset = FabFilterToGenericEQ.convertBase(proQ3);
              setParsedGenericData(eqPreset);
            } else {
              const proQ2 = new FabFilterProQ2();
              if (proQ2.readFFP(chunkData)) {
                setSourceFormat(proQ2.PlugInName);
                setSourceData(proQ2);

                const eqPreset = FabFilterToGenericEQ.convertBase(proQ2);
                setParsedGenericData(eqPreset);
              } else {
                const proQ1 = new FabFilterProQ();
                if (proQ1.readFFP(chunkData)) {
                  setSourceFormat(proQ1.PlugInName);
                  setSourceData(proQ1);

                  const eqPreset = FabFilterToGenericEQ.convertBase(proQ1);
                  setParsedGenericData(eqPreset);
                } else {
                  setError(
                    t("error.unsupportedFormat", { fileName: file.name })
                  );
                }
              }
            }
          } else if (ext === "vstpreset") {
            try {
              const vstPreset = VstPresetFactory.getVstPreset(data);

              if (vstPreset && vstPreset instanceof FabFilterProQBase) {
                console.log(
                  "FabFilterProQ[1|2|3] preset:",
                  vstPreset.toString()
                );
                setSourceFormat(vstPreset.PlugInName);
                setSourceData(vstPreset);

                const eqPreset = FabFilterToGenericEQ.convertBase(vstPreset);
                setParsedGenericData(eqPreset);
              } else if (vstPreset && vstPreset instanceof SteinbergFrequency) {
                setSourceFormat(`${vstPreset.constructor.name}`);
                setSourceData(vstPreset);

                console.log("SteinbergFrequency preset:", vstPreset.toString());
                const eqPreset =
                  SteinbergFrequencyToGenericEQ.convertBase(vstPreset);
                setParsedGenericData(eqPreset);
              } else if (vstPreset) {
                setSourceFormat(`${vstPreset.constructor.name}`);
                setSourceData(vstPreset);

                // If vstPreset exists but is not a supported type
                setError(
                  `Unsupported Vst3ClassID: ${vstPreset.Vst3ClassID} (${file.name})`
                );
              }
            } catch (_err) {
              setError(t("error.unsupportedFormat", { fileName: file.name }));
            }
          } else if (ext === "als") {
            try {
              const result = await AbletonHandlers.HandleAbletonLiveProject(
                // Added await
                data,
                file.name,
                false, // doList
                false // doVerbose
              );

              if (result?.devicePresetFiles) {
                setAbletonDevicePresets(result.devicePresetFiles);
                setSourceFormat("Ableton Live Project"); // Or a more specific format if needed
              } else {
                setError(t("error.unsupportedFormat", { fileName: file.name }));
              }

              if (result?.cvpj) {
                // if we have a cvpj, store the midi file in the state
                const midiData = convertToMidi(result.cvpj, "midi");
                setAbletonMidiFile(midiData);

                // if we have a cvpj, convert automation to midi and plots
                const automationConversionResult = convertAutomationToMidi(
                  result.cvpj,
                  "automation",
                  true // add log and plots
                );
                setAbletonAutomationConversionResult(
                  automationConversionResult
                );
              } else {
                setError(t("error.unsupportedFormat", { fileName: file.name }));
              }
            } catch (err) {
              console.error("Ableton parsing error:", err);
              const message = err instanceof Error ? err.message : String(err);
              setError(
                t("error.parsingError", { fileName: file.name, message })
              );
            }
          } else {
            setError(t("error.unsupportedFormat", { fileName: file.name }));
          }
        } catch (err) {
          console.error("Parsing error:", err);
          const message = err instanceof Error ? err.message : String(err);
          setError(t("error.parsingError", { fileName: file.name, message }));
        } finally {
          setIsLoading(false);
        }
      };

      reader.readAsArrayBuffer(file);
    },
    [t]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "audio/fxp": [".fxp"],
      "application/octet-stream": [".ffp", ".vstpreset"],
      "application/x-ableton-live": [".als"],
    },
    multiple: false,
  });

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="rounded-lg border border-border p-6 shadow-lg">
          <h2 className="mb-2 text-xl font-semibold text-red-500">Error</h2>
          <p>{error}</p>
          <Button onClick={() => setError(null)} className="mt-4">
            {t("error.tryAgain")}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto min-h-screen px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="mb-4 text-center text-3xl font-bold">{t("title")}</h1>

      <Card className="mb-4">
        <CardHeader>
          <CardTitle>{t("dropzone.title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div
            {...getRootProps()}
            className={`
              flex cursor-pointer flex-col items-center justify-center
              rounded-md border-2 border-dashed p-12 text-center
              transition-colors
              ${
                isDragActive
                  ? "border-primary bg-primary/10"
                  : "border-border hover:border-primary/50"
              }
            `}>
            <input {...getInputProps()} />
            {isLoading ? (
              <p>{t("dropzone.loading")}</p>
            ) : isDragActive ? (
              <p>{t("dropzone.dropHere")}</p>
            ) : (
              <p>{t("dropzone.prompt")}</p>
            )}
            <p className="mt-2 text-sm text-muted-foreground">
              {t("dropzone.supportedFormats")}
            </p>
          </div>
        </CardContent>
      </Card>

      {droppedFile && (
        <Card className="mb-4">
          <CardHeader>
            <CardTitle>{t("fileInfo.title")}</CardTitle>
          </CardHeader>
          <CardContent>
            <p>
              <strong>{t("fileInfo.fileName")}:</strong> {droppedFile.name}
            </p>
            <p>
              <strong>{t("fileInfo.size")}:</strong> {droppedFile.size} bytes
            </p>
            {sourceFormat && (
              <p>
                <strong>{t("fileInfo.detectedFormat")}:</strong> {sourceFormat}
              </p>
            )}
            {parsedGenericData && (
              <p>
                <strong>{t("fileInfo.bands")}:</strong>{" "}
                {
                  parsedGenericData.Bands.filter(
                    (b: GenericEQBand) => b.Enabled
                  ).length
                }{" "}
                enabled
              </p>
            )}
            {parsedGenericData && parsedGenericData.Bands.length > 0 && (
              <div>
                <div className="mt-4">
                  {/* EQ Graph */}
                  <EqualizerChart
                    preset={parsedGenericData}
                    onFrequencyHover={setHoveredFrequency}
                  />
                </div>
                <div className="mt-4">
                  <Collapsible defaultOpen={false}>
                    <div className="flex items-center justify-between">
                      <strong>{t("fileInfo.bandDetails")}:</strong>
                      <CollapsibleTrigger asChild>
                        <Button variant="ghost" size="sm" className="w-9 p-0">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="size-4">
                            <path d="m6 9 6 6 6-6" />
                          </svg>
                          <span className="sr-only">Toggle</span>
                        </Button>
                      </CollapsibleTrigger>
                    </div>
                    <CollapsibleContent>
                      <EqualizerBandTable
                        preset={parsedGenericData}
                        hoveredFrequency={hoveredFrequency}
                      />
                    </CollapsibleContent>
                  </Collapsible>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Display Ableton Device Preset Files */}
      {abletonDevicePresets && abletonDevicePresets.length > 0 && (
        <Card className="mb-4">
          <CardHeader>
            <CardTitle>{t("ableton.devicePresets.title")}</CardTitle>
          </CardHeader>
          <CardContent>
            <Collapsible defaultOpen={false}>
              <div className="flex items-center justify-between">
                <strong>{t("ableton.devicePresets.description")}</strong>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm" className="w-9 p-0">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="size-4">
                      <path d="m6 9 6 6 6-6" />
                    </svg>
                    <span className="sr-only">Toggle</span>
                  </Button>
                </CollapsibleTrigger>
              </div>
              <CollapsibleContent>
                <div>
                  {abletonDevicePresets.map((presetFile, index) => {
                    const { sourceData: unwrappedSourceData, sourceFormatId } =
                      unwrapAbletonDevicePreset(presetFile);

                    return (
                      <div key={index} className="border-b py-2 last:border-0">
                        <p>
                          <strong>{t("fileInfo.fileName")}:</strong>{" "}
                          {presetFile.filename}
                        </p>
                        <p>
                          <strong>{t("fileInfo.detectedType")}:</strong>{" "}
                          {presetFile.format}{" "}
                        </p>
                        <p>
                          <strong>{t("fileInfo.detectedFormat")}:</strong>{" "}
                          {sourceFormatId}
                        </p>

                        <TargetConversion
                          sourceData={unwrappedSourceData}
                          originalFileName={presetFile?.filename || null}
                          sourceFormatId={sourceFormatId}
                        />
                      </div>
                    );
                  })}
                </div>
              </CollapsibleContent>
            </Collapsible>
          </CardContent>
        </Card>
      )}

      {/* Display Ableton MIDI File */}
      {abletonMidiFile &&
        (() => {
          const fileNameNoExtension = getFileNameWithoutExtension(
            droppedFile?.name ?? "ableton-midi"
          );
          const midiFileName = `${fileNameNoExtension}.mid`;
          const midiLogFileName = `${fileNameNoExtension}.txt`;

          return (
            <Card className="mb-4">
              <CardHeader>
                <CardTitle>{t("ableton.midiFile.title")}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mt-1 flex flex-wrap gap-2">
                  <Button
                    onClick={async () => {
                      if (!midiFileName) return;

                      try {
                        setIsLoading(true);
                        setError(null);

                        const midiDataArray =
                          midiFile.writeMidi(abletonMidiFile);
                        const midiDataUint8Array = new Uint8Array(
                          midiDataArray
                        );
                        if (!midiDataUint8Array) {
                          setError(t("error.conversionFailed"));
                          return;
                        }

                        const mimeType = "application/octet-stream";
                        const blob = new Blob([midiDataUint8Array], {
                          type: mimeType,
                        });

                        downloadBlob(blob, midiFileName);
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
                    {midiFileName}
                  </Button>
                  <Button
                    onClick={async () => {
                      if (!midiLogFileName) return;

                      try {
                        setIsLoading(true);
                        setError(null);

                        const midiLogString =
                          logMidiDataToString(abletonMidiFile);

                        if (!midiLogString) {
                          setError(t("error.conversionFailed"));
                          return;
                        }

                        const mimeType = "text/plain";
                        const blob = new Blob([midiLogString], {
                          type: mimeType,
                        });

                        downloadBlob(blob, midiLogFileName);
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
                    {midiLogFileName}
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })()}

      {/* Display Ableton Automation Conversion Result */}
      {abletonAutomationConversionResult && (
        <Card className="mb-4">
          <CardHeader>
            <CardTitle>{t("ableton.automation.title")}</CardTitle>
          </CardHeader>
          <CardContent>
            {abletonAutomationConversionResult?.midiDataArray &&
            abletonAutomationConversionResult.midiDataArray.length > 0 ? (
              <div className="mb-5">
                <strong>{t("ableton.automation.midiFiles")}:</strong>
                <div className="mt-1 flex flex-wrap gap-2">
                  {abletonAutomationConversionResult.midiDataArray.map(
                    (automationMidi, index) => {
                      if (automationMidi) {
                        const suggestedFileName =
                          automationMidi.suggestedFileName;
                        const fileNameNoExtension = getFileNameWithoutExtension(
                          suggestedFileName ?? "ableton-automation"
                        );
                        const midiFileName = `${fileNameNoExtension}.mid`;
                        const midiData = automationMidi.midiData;

                        return (
                          <Button
                            key={index}
                            onClick={async () => {
                              if (!suggestedFileName) return;

                              try {
                                setIsLoading(true);
                                setError(null);

                                const midiDataArray =
                                  midiFile.writeMidi(midiData);
                                const midiDataUint8Array = new Uint8Array(
                                  midiDataArray
                                );
                                if (!midiDataUint8Array) {
                                  setError(t("error.conversionFailed"));
                                  return;
                                }

                                const mimeType = "application/octet-stream";
                                const blob = new Blob([midiDataUint8Array], {
                                  type: mimeType,
                                });

                                downloadBlob(blob, midiFileName);
                              } catch (err) {
                                console.error("Conversion error:", err);
                                const message =
                                  err instanceof Error
                                    ? err.message
                                    : String(err);
                                setError(
                                  t("error.conversionError", { message })
                                );
                              } finally {
                                setIsLoading(false);
                              }
                            }}
                            disabled={isLoading}
                            size="sm"
                            variant="secondary">
                            {midiFileName}
                          </Button>
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
                <strong>{t("ableton.automation.midiLogs")}:</strong>
                <div className="mt-1 flex flex-wrap gap-2">
                  {abletonAutomationConversionResult.midiLogArray.map(
                    (automationMidiLog, index) => {
                      if (automationMidiLog) {
                        const suggestedFileName =
                          automationMidiLog.suggestedFileName;
                        const fileNameNoExtension = getFileNameWithoutExtension(
                          suggestedFileName ?? "ableton-automation"
                        );
                        const midiLogFileName = `${fileNameNoExtension}.txt`;
                        const midiLogString = automationMidiLog.logString;

                        return (
                          <Button
                            key={index}
                            onClick={async () => {
                              if (!suggestedFileName) return;

                              try {
                                setIsLoading(true);
                                setError(null);

                                if (!midiLogString) {
                                  setError(t("error.conversionFailed"));
                                  return;
                                }

                                const mimeType = "text/plain";
                                const blob = new Blob([midiLogString], {
                                  type: mimeType,
                                });

                                downloadBlob(blob, midiLogFileName);
                              } catch (err) {
                                console.error("Conversion error:", err);
                                const message =
                                  err instanceof Error
                                    ? err.message
                                    : String(err);
                                setError(
                                  t("error.conversionError", { message })
                                );
                              } finally {
                                setIsLoading(false);
                              }
                            }}
                            disabled={isLoading}
                            size="sm"
                            variant="secondary">
                            {midiLogFileName}
                          </Button>
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
                <strong>{t("ableton.automation.plots")}:</strong>
                <ul>
                  {abletonAutomationConversionResult.automationPlotArray.map(
                    (automationPlot, index) => {
                      if (automationPlot) {
                        const plot = automationPlot.plot;
                        const suggestedFileName =
                          automationPlot.suggestedFileName;
                        const fig = JSON.parse(plot);
                        return (
                          <li key={index}>
                            <div>{suggestedFileName}</div>
                            <div>
                              <PlotlyClientOnly
                                data={fig.data}
                                layout={fig.layout}
                              />
                            </div>
                          </li>
                        );
                      }
                    }
                  )}
                </ul>
              </div>
            ) : (
              <p>{t("ableton.automation.noPlots")}</p>
            )}
          </CardContent>
        </Card>
      )}

      {parsedGenericData && (
        <TargetConversion
          title={t("conversion.title")}
          sourceData={sourceData}
          originalFileName={droppedFile?.name || null}
          sourceFormatId={sourceFormat || "unknown"}
        />
      )}
    </div>
  );
}
