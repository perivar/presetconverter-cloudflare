// app/routes/frontpage.tsx

import { useCallback, useState } from "react";
import type { LoaderFunctionArgs, MetaFunction } from "@remix-run/cloudflare";
import { json } from "@remix-run/react";
import i18next from "~/i18n/i18n.server";
import { AbletonDevicePreset } from "~/utils/ableton/AbletonDevicePreset";
import { AbletonHandlers } from "~/utils/ableton/AbletonHandlers";
import {
  AutomationConversionResult,
  convertAutomationToMidi,
  convertToMidi,
} from "~/utils/ableton/Midi";
import { FabFilterProQBaseToGenericEQ } from "~/utils/converters/FabFilterProQBaseToGenericEQ";
import { SSLNativeChannelToGenericEQ } from "~/utils/converters/SSLNativeChannelToGenericEQ";
import { SteinbergFrequencyToGenericEQ } from "~/utils/converters/SteinbergFrequencyToGenericEQ";
import { UADSSLChannelToGenericEQ } from "~/utils/converters/UADSSLChannelToGenericEQ";
import { WavesSSLChannelToGenericEQ } from "~/utils/converters/WavesSSLChannelToGenericEQ";
import { FabFilterProQ } from "~/utils/preset/FabFilterProQ";
import { FabFilterProQ2 } from "~/utils/preset/FabFilterProQ2";
import { FabFilterProQ3 } from "~/utils/preset/FabFilterProQ3";
import { FabFilterProQBase } from "~/utils/preset/FabFilterProQBase";
import { FxChunkSet, FXP, FxProgramSet } from "~/utils/preset/FXP";
import { FXPPresetFactory } from "~/utils/preset/FXPPresetFactory";
import { GenericEQBand, GenericEQPreset } from "~/utils/preset/GenericEQPreset";
import { Preset } from "~/utils/preset/Preset";
import { SSLNativeChannel } from "~/utils/preset/SSLNativeChannel";
import { SteinbergFrequency } from "~/utils/preset/SteinbergFrequency";
import { UADSSLChannel } from "~/utils/preset/UADSSLChannel";
import { VstPresetFactory } from "~/utils/preset/VstPresetFactory";
import { WavesSSLChannel } from "~/utils/preset/WavesSSLChannel";
import { WavesSSLComp } from "~/utils/preset/WavesSSLComp";
import { ChevronDown, ChevronUp } from "lucide-react";
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
import { AbletonAutomationResultDisplay } from "~/components/AbletonAutomationResultDisplay";
import { AbletonDevicePresetsDisplay } from "~/components/AbletonDevicePresetsDisplay";
import { AbletonMidiFileDisplay } from "~/components/AbletonMidiFileDisplay";
import { EqualizerBandTable } from "~/components/EqualizerBandTable";
import { EqualizerChart } from "~/components/EqualizerChart";
import { TargetConversion } from "~/components/TargetConversion";
import { WavesXPSPresetsDisplay } from "~/components/WavesXPSPresetsDisplay";

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
  const [wavesXPSPresets, setWavesXPSPresets] = useState<Preset[] | null>(null);
  const [isBandDetailsOpen, setIsBandDetailsOpen] = useState(false); // State for band details collapsible

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
      setWavesXPSPresets(null); // Clear XPS presets on new drop
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
                  FabFilterProQBaseToGenericEQ.convertBase(fabfilterEQPreset);
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

              const eqPreset = FabFilterProQBaseToGenericEQ.convertBase(proQ3);
              setParsedGenericData(eqPreset);
            } else {
              const proQ2 = new FabFilterProQ2();
              if (proQ2.readFFP(chunkData)) {
                setSourceFormat(proQ2.PlugInName);
                setSourceData(proQ2);

                const eqPreset =
                  FabFilterProQBaseToGenericEQ.convertBase(proQ2);
                setParsedGenericData(eqPreset);
              } else {
                const proQ1 = new FabFilterProQ();
                if (proQ1.readFFP(chunkData)) {
                  setSourceFormat(proQ1.PlugInName);
                  setSourceData(proQ1);

                  const eqPreset =
                    FabFilterProQBaseToGenericEQ.convertBase(proQ1);
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
                  "FabFilterProQ[1|2|3] preset:\n",
                  vstPreset.toString()
                );
                setSourceFormat(vstPreset.PlugInName);
                setSourceData(vstPreset);

                const eqPreset =
                  FabFilterProQBaseToGenericEQ.convertBase(vstPreset);
                setParsedGenericData(eqPreset);
              } else if (vstPreset && vstPreset instanceof SteinbergFrequency) {
                setSourceFormat(`${vstPreset.constructor.name}`);
                setSourceData(vstPreset);

                console.log(
                  "SteinbergFrequency preset:\n",
                  vstPreset.toString()
                );
                const eqPreset =
                  SteinbergFrequencyToGenericEQ.convertBase(vstPreset);
                setParsedGenericData(eqPreset);
              } else if (vstPreset && vstPreset instanceof UADSSLChannel) {
                setSourceFormat(`${vstPreset.constructor.name}`);
                setSourceData(vstPreset);

                console.log("UADSSLChannel preset:\n", vstPreset.toString());
                const eqPreset =
                  UADSSLChannelToGenericEQ.convertBase(vstPreset);
                setParsedGenericData(eqPreset);
              } else if (vstPreset && vstPreset instanceof SSLNativeChannel) {
                setSourceFormat(`${vstPreset.constructor.name}`);
                setSourceData(vstPreset);

                console.log("SSLNativeChannel preset:\n", vstPreset.toString());
                const eqPreset =
                  SSLNativeChannelToGenericEQ.convertBase(vstPreset);
                setParsedGenericData(eqPreset);
              } else if (vstPreset && vstPreset instanceof WavesSSLChannel) {
                setSourceFormat(`${vstPreset.constructor.name}`);
                setSourceData(vstPreset);

                console.log("WavesSSLChannel preset:\n", vstPreset.toString());
                const eqPreset =
                  WavesSSLChannelToGenericEQ.convertBase(vstPreset);
                setParsedGenericData(eqPreset);
              } else if (vstPreset && vstPreset instanceof WavesSSLComp) {
                setSourceFormat(`${vstPreset.constructor.name}`);
                setSourceData(vstPreset);

                console.log("WavesSSLComp preset:\n", vstPreset.toString());
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
          } else if (ext === "xps") {
            try {
              const fileContentXPS = new TextDecoder().decode(data);
              const allXPSPresets: Preset[] = [];

              // Try parsing as WavesSSLChannel XPS
              const wavesSSLChannels = WavesSSLChannel.parseXml(
                fileContentXPS,
                WavesSSLChannel
              );
              allXPSPresets.push(...wavesSSLChannels);

              // Try parsing as WavesSSLComp XPS
              const wavesSSLComps = WavesSSLComp.parseXml(
                fileContentXPS,
                WavesSSLComp
              );
              allXPSPresets.push(...wavesSSLComps);

              if (allXPSPresets.length > 0) {
                setWavesXPSPresets(allXPSPresets);
                setSourceFormat("Waves XPS Collection"); // Indicate it's a collection
                console.log(
                  `Parsed ${allXPSPresets.length} Waves XPS presets.`
                );
              } else {
                setError(t("error.unsupportedFormat", { fileName: file.name }));
              }
            } catch (err) {
              console.error("XPS parsing error:", err);
              const message = err instanceof Error ? err.message : String(err);
              setError(
                t("error.parsingError", { fileName: file.name, message })
              );
            }
          } else if (ext === "als") {
            try {
              const result = await AbletonHandlers.HandleAbletonLiveProject(
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
                const midiData = convertToMidi(
                  result.cvpj,
                  file.name ?? "midi"
                );
                setAbletonMidiFile(midiData);

                // if we have a cvpj, convert automation to midi and plots
                const automationConversionResult = convertAutomationToMidi(
                  result.cvpj,
                  file.name ?? "automation",
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
      "application/octet-stream": [".ffp", ".vstpreset", ".xps"],
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
                  <Collapsible
                    open={isBandDetailsOpen}
                    onOpenChange={setIsBandDetailsOpen}>
                    <CollapsibleTrigger asChild>
                      <div className="flex items-center justify-between">
                        <h4
                          className={`text-sm font-semibold ${isBandDetailsOpen ? "font-bold" : ""}`}>
                          {t("fileInfo.bandDetails")}:
                        </h4>
                        <Button variant="outline" size="sm" className="w-9 p-0">
                          {isBandDetailsOpen ? (
                            <ChevronUp className="size-4" />
                          ) : (
                            <ChevronDown className="size-4" />
                          )}
                          <span className="sr-only">Toggle</span>
                        </Button>
                      </div>
                    </CollapsibleTrigger>
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
      <AbletonDevicePresetsDisplay
        abletonDevicePresets={abletonDevicePresets}
        originalFileName={droppedFile?.name || null}
      />

      {/* Display Ableton MIDI File */}
      <AbletonMidiFileDisplay
        abletonMidiFile={abletonMidiFile}
        originalFileName={droppedFile?.name || null}
      />

      {/* Display Ableton Automation Conversion Result */}
      <AbletonAutomationResultDisplay
        abletonAutomationConversionResult={abletonAutomationConversionResult}
      />

      {/* Display Waves XPS Presets */}
      <WavesXPSPresetsDisplay
        wavesXPSPresets={wavesXPSPresets}
        originalFileName={droppedFile?.name || null}
      />

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
