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
import { SupportsPresetFormats } from "~/utils/converters/MultiFormatConverter";
import { SSLNativeBusCompressorToGenericCompressorLimiter } from "~/utils/converters/SSLNativeBusCompressorToGenericCompressorLimiter";
import { SSLNativeChannelToGenericEQ } from "~/utils/converters/SSLNativeChannelToGenericEQ";
import { SteinbergFrequencyToGenericEQ } from "~/utils/converters/SteinbergFrequencyToGenericEQ";
import { UADSSLChannelToGenericEQ } from "~/utils/converters/UADSSLChannelToGenericEQ";
import { WavesSSLChannelToGenericEQ } from "~/utils/converters/WavesSSLChannelToGenericEQ";
import { WavesSSLCompToGenericCompressorLimiter } from "~/utils/converters/WavesSSLCompToGenericCompressorLimiter";
import { FabFilterProQ } from "~/utils/preset/FabFilterProQ";
import { FabFilterProQ2 } from "~/utils/preset/FabFilterProQ2";
import { FabFilterProQ3 } from "~/utils/preset/FabFilterProQ3";
import { FabFilterProQBase } from "~/utils/preset/FabFilterProQBase";
import { FXP } from "~/utils/preset/FXP";
import { FXPPresetFactory } from "~/utils/preset/FXPPresetFactory";
import { GenericCompressorLimiter } from "~/utils/preset/GenericCompressorLimiter";
import { GenericEQBand, GenericEQPreset } from "~/utils/preset/GenericEQPreset";
import { GenericFXP } from "~/utils/preset/GenericFXP";
import { GenericXML } from "~/utils/preset/GenericXML";
import { Preset } from "~/utils/preset/Preset";
import { SSLNativeBusCompressor } from "~/utils/preset/SSLNativeBusCompressor";
import { SSLNativeChannel } from "~/utils/preset/SSLNativeChannel";
import { SteinbergFrequency } from "~/utils/preset/SteinbergFrequency";
import { UADSSLChannel } from "~/utils/preset/UADSSLChannel";
import { VstPresetFactory } from "~/utils/preset/VstPresetFactory";
import { WavesSSLChannel } from "~/utils/preset/WavesSSLChannel";
import { WavesSSLComp } from "~/utils/preset/WavesSSLComp";
import { toHexEditorString } from "~/utils/StringUtils";
import { attemptXmlParse } from "~/utils/XmlUtils";
import { Encoding, NewLineHandling, XmlWriter } from "~/utils/XmlWriter";
import { decompressAfterMarker } from "~/utils/ZipUtils";
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
import { CompressorLimiterGraph } from "~/components/CompressorLimiterGraph";
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

interface SourcePreset {
  format: string | null;
  data: SupportsPresetFormats | null;
}

export default function Index() {
  const { t } = useTranslation();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [droppedFile, setDroppedFile] = useState<File | null>(null);
  const [sourcePresets, setSourcePresets] = useState<SourcePreset[] | null>(
    null
  );

  const [genericEQPreset, setGenericEQPreset] =
    useState<GenericEQPreset | null>(null);
  const [genericCompLimitPreset, setGenericCompLimitPreset] =
    useState<GenericCompressorLimiter | null>(null);

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
      setSourcePresets(null);
      setGenericEQPreset(null);
      setGenericCompLimitPreset(null);
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

          if (ext === "fxp") {
            const { preset, source, fxp } =
              FXPPresetFactory.getPresetFromFXP(data);

            if (preset && preset instanceof FabFilterProQBase) {
              setSourcePresets([{ format: preset.PlugInName, data: preset }]);
              console.log("FabFilterProQ[1|2|3] preset:\n", preset.toString());
              const eqPreset = FabFilterProQBaseToGenericEQ.convertBase(preset);
              setGenericEQPreset(eqPreset);
            } else if (preset && preset instanceof SteinbergFrequency) {
              setSourcePresets([
                { format: `${preset.constructor.name}`, data: preset },
              ]);
              console.log("SteinbergFrequency preset:\n", preset.toString());
              const eqPreset =
                SteinbergFrequencyToGenericEQ.convertBase(preset);
              setGenericEQPreset(eqPreset);
            } else if (preset && preset instanceof UADSSLChannel) {
              setSourcePresets([
                { format: `${preset.constructor.name}`, data: preset },
              ]);
              console.log("UADSSLChannel preset:\n", preset.toString());
              const eqPreset = UADSSLChannelToGenericEQ.convertBase(preset);
              setGenericEQPreset(eqPreset);
            } else if (preset && preset instanceof SSLNativeChannel) {
              setSourcePresets([
                { format: `${preset.constructor.name}`, data: preset },
              ]);
              console.log("SSLNativeChannel preset:\n", preset.toString());
              const eqPreset = SSLNativeChannelToGenericEQ.convertBase(preset);
              setGenericEQPreset(eqPreset);
            } else if (preset && preset instanceof SSLNativeBusCompressor) {
              setSourcePresets([
                { format: `${preset.constructor.name}`, data: preset },
              ]);
              console.log(
                "SSLNativeBusCompressor preset:\n",
                preset.toString()
              );
              const compLimitPreset =
                SSLNativeBusCompressorToGenericCompressorLimiter.convertBase(
                  preset
                );
              setGenericCompLimitPreset(compLimitPreset);
            } else if (preset && preset instanceof WavesSSLChannel) {
              setSourcePresets([
                { format: `${preset.constructor.name}`, data: preset },
              ]);
              console.log("WavesSSLChannel preset:\n", preset.toString());
              const eqPreset = WavesSSLChannelToGenericEQ.convertBase(preset);
              setGenericEQPreset(eqPreset);
            } else if (preset && preset instanceof WavesSSLComp) {
              setSourcePresets([
                { format: `${preset.constructor.name}`, data: preset },
              ]);
              console.log("WavesSSLComp preset:\n", preset.toString());

              const compLimitPreset =
                WavesSSLCompToGenericCompressorLimiter.convertBase(preset);
              setGenericCompLimitPreset(compLimitPreset);
            } else if (preset) {
              setSourcePresets([
                { format: `${preset.constructor.name}`, data: preset },
              ]);

              // If fxp preset exists but is not a supported type
              setError(`Unsupported fxp: ${source}`);
            } else if (fxp) {
              setError(
                `Unsupported FXP FxID: ${fxp?.content?.FxID} (${file.name})` +
                  (data
                    ? `\n\nCompChunkData (hex):\n${toHexEditorString(data, false, Number.MAX_SAFE_INTEGER)}`
                    : "")
              );
            }
          } else if (ext === "ffp") {
            const proQ3 = new FabFilterProQ3();
            if (proQ3.readFFP(data)) {
              setSourcePresets([{ format: proQ3.PlugInName, data: proQ3 }]);
              console.log("FabFilterProQ3 preset:\n", proQ3.toString());

              const eqPreset = FabFilterProQBaseToGenericEQ.convertBase(proQ3);
              setGenericEQPreset(eqPreset);
            } else {
              const proQ2 = new FabFilterProQ2();
              if (proQ2.readFFP(data)) {
                setSourcePresets([{ format: proQ2.PlugInName, data: proQ2 }]);
                console.log("FabFilterProQ2 preset:\n", proQ2.toString());

                const eqPreset =
                  FabFilterProQBaseToGenericEQ.convertBase(proQ2);
                setGenericEQPreset(eqPreset);
              } else {
                const proQ1 = new FabFilterProQ();
                if (proQ1.readFFP(data)) {
                  setSourcePresets([{ format: proQ1.PlugInName, data: proQ1 }]);
                  console.log("FabFilterProQ preset:\n", proQ1.toString());

                  const eqPreset =
                    FabFilterProQBaseToGenericEQ.convertBase(proQ1);
                  setGenericEQPreset(eqPreset);
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
                setSourcePresets([
                  { format: vstPreset.PlugInName, data: vstPreset },
                ]);
                console.log(
                  "FabFilterProQ[1|2|3] preset:\n",
                  vstPreset.toString()
                );
                const eqPreset =
                  FabFilterProQBaseToGenericEQ.convertBase(vstPreset);
                setGenericEQPreset(eqPreset);
              } else if (vstPreset && vstPreset instanceof SteinbergFrequency) {
                setSourcePresets([
                  { format: `${vstPreset.constructor.name}`, data: vstPreset },
                ]);
                console.log(
                  "SteinbergFrequency preset:\n",
                  vstPreset.toString()
                );
                const eqPreset =
                  SteinbergFrequencyToGenericEQ.convertBase(vstPreset);
                setGenericEQPreset(eqPreset);
              } else if (vstPreset && vstPreset instanceof UADSSLChannel) {
                setSourcePresets([
                  { format: `${vstPreset.constructor.name}`, data: vstPreset },
                ]);
                console.log("UADSSLChannel preset:\n", vstPreset.toString());
                const eqPreset =
                  UADSSLChannelToGenericEQ.convertBase(vstPreset);
                setGenericEQPreset(eqPreset);
              } else if (vstPreset && vstPreset instanceof SSLNativeChannel) {
                setSourcePresets([
                  { format: `${vstPreset.constructor.name}`, data: vstPreset },
                ]);
                console.log("SSLNativeChannel preset:\n", vstPreset.toString());
                const eqPreset =
                  SSLNativeChannelToGenericEQ.convertBase(vstPreset);
                setGenericEQPreset(eqPreset);
              } else if (
                vstPreset &&
                vstPreset instanceof SSLNativeBusCompressor
              ) {
                setSourcePresets([
                  { format: `${vstPreset.constructor.name}`, data: vstPreset },
                ]);
                console.log(
                  "SSLNativeBusCompressor preset:\n",
                  vstPreset.toString()
                );
                const compLimitPreset =
                  SSLNativeBusCompressorToGenericCompressorLimiter.convertBase(
                    vstPreset
                  );
                setGenericCompLimitPreset(compLimitPreset);
              } else if (vstPreset && vstPreset instanceof WavesSSLChannel) {
                setSourcePresets([
                  { format: `${vstPreset.constructor.name}`, data: vstPreset },
                ]);
                console.log("WavesSSLChannel preset:\n", vstPreset.toString());
                const eqPreset =
                  WavesSSLChannelToGenericEQ.convertBase(vstPreset);
                setGenericEQPreset(eqPreset);
              } else if (vstPreset && vstPreset instanceof WavesSSLComp) {
                setSourcePresets([
                  { format: `${vstPreset.constructor.name}`, data: vstPreset },
                ]);
                console.log("WavesSSLComp preset:\n", vstPreset.toString());

                const compLimitPreset =
                  WavesSSLCompToGenericCompressorLimiter.convertBase(vstPreset);
                setGenericCompLimitPreset(compLimitPreset);
              } else if (vstPreset) {
                // first check if the vst3preset contains a vst2 FXP
                const fxpData = vstPreset.writeFXP(
                  `${vstPreset.constructor.name}`
                );

                const presetList = [];
                if (fxpData) {
                  // check if the FXP chunk is XML
                  const fxp = new FXP(fxpData);
                  if (fxp.xmlContent) {
                    const xmlString = XmlWriter(fxp.xmlContent, {
                      OmitXmlDeclaration: true,
                      Encoding: Encoding.UTF8,
                      Indent: true,
                      IndentChars: "\t",
                      NewLineChars: "\n",
                      NewLineHandling: NewLineHandling.Replace,
                    });
                    const extractedData = new GenericXML(
                      xmlString,
                      `${vstPreset.constructor.name}`
                    );
                    presetList.push({
                      format: "GenericXML",
                      data: extractedData,
                    });
                  }

                  // always add the fxp content as a fxp object
                  const extractedData = new GenericFXP(
                    fxpData,
                    `${vstPreset.constructor.name}`
                  );
                  presetList.push({
                    format: "GenericFXP",
                    data: extractedData,
                  });

                  setSourcePresets(presetList);
                } else if (vstPreset.CompChunkData) {
                  // then check if the comp chunk data is xml
                  const parsedObject = attemptXmlParse(vstPreset.CompChunkData);

                  if (parsedObject) {
                    // If we get here, we are confident it's valid XML.
                    const xmlString = XmlWriter(parsedObject, {
                      OmitXmlDeclaration: true,
                      Encoding: Encoding.UTF8,
                      Indent: true,
                      IndentChars: "\t",
                      NewLineChars: "\n",
                      NewLineHandling: NewLineHandling.Replace,
                    });
                    const extractedData = new GenericXML(
                      xmlString,
                      `${vstPreset.constructor.name}`
                    );
                    setSourcePresets([
                      { format: "GenericXML", data: extractedData },
                    ]);
                  } else {
                    const {
                      data: uncompressedData,
                      trailingData,
                      wasCompressed,
                    } = await decompressAfterMarker(vstPreset.CompChunkData);

                    if (wasCompressed) {
                      // If vstPreset exists but is not a supported type
                      setError(
                        `Unsupported Vst3ClassID: ${vstPreset.Vst3ClassID} (${file.name})` +
                          (uncompressedData
                            ? `\n\nCompChunkData (hex):\n${toHexEditorString(uncompressedData, false, Number.MAX_SAFE_INTEGER)}`
                            : "")
                      );
                      return;
                    }

                    // The helper function already logged the reason for failure.
                    console.log(
                      "ChunkData is not valid XML or is empty. No data set."
                    );

                    // we do not support this preset file
                    setSourcePresets([
                      {
                        format: `${vstPreset.constructor.name}`,
                        data: vstPreset,
                      },
                    ]);

                    // If vstPreset exists but is not a supported type
                    setError(
                      `Unsupported Vst3ClassID: ${vstPreset.Vst3ClassID} (${file.name})` +
                        (vstPreset.CompChunkData
                          ? `\n\nCompChunkData (hex):\n${toHexEditorString(vstPreset.CompChunkData, false, Number.MAX_SAFE_INTEGER)}`
                          : "")
                    );
                  }
                } else {
                  // otherwise we do not support this preset file
                  setSourcePresets([
                    {
                      format: `${vstPreset.constructor.name}`,
                      data: vstPreset,
                    },
                  ]);

                  // If vstPreset exists but is not a supported type
                  setError(
                    `Unsupported Vst3ClassID: ${vstPreset.Vst3ClassID} (${file.name})` +
                      (vstPreset.CompChunkData
                        ? `\n\nCompChunkData (hex):\n${toHexEditorString(vstPreset.CompChunkData, false, Number.MAX_SAFE_INTEGER)}`
                        : "")
                  );
                }
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

                // Indicate it's a collection
                setSourcePresets([
                  { format: "Waves XPS Collection", data: null },
                ]);

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
          } else if (ext === "als" || ext === "adv") {
            try {
              const result = await AbletonHandlers.HandleAbletonLiveProject(
                data,
                file.name,
                false, // doList
                false // doVerbose
              );

              if (result?.devicePresetFiles) {
                setAbletonDevicePresets(result.devicePresetFiles);

                // Indicate it's a collection
                setSourcePresets([
                  { format: "Ableton Live Project", data: null },
                ]);
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
      "application/x-ableton-live": [".als", ".adv"],
    },
    multiple: false,
  });

  if (error) {
    // Check for hex output marker and split for preformatted rendering
    const hexMarker = "CompChunkData (hex):";
    let errorMsg = error;
    let hexBlock = null;
    if (error.includes(hexMarker)) {
      const [msg, ...rest] = error.split(hexMarker);
      errorMsg = msg.trim();
      hexBlock = rest.join(hexMarker).trim();
    }
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="rounded-lg border border-border p-6 shadow-lg">
          <h2 className="mb-2 text-xl font-semibold text-red-500">Error</h2>
          <p>{errorMsg}</p>
          {hexBlock && (
            <>
              <div className="mt-4 font-mono text-xs">
                <div className="mb-1 font-semibold">{hexMarker}</div>
                <pre className="max-h-[500px] overflow-auto whitespace-pre-wrap rounded border bg-muted p-2">
                  {hexBlock}
                </pre>
              </div>
            </>
          )}
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

            {sourcePresets &&
              sourcePresets.length > 0 &&
              sourcePresets.map((sourcePreset: SourcePreset, index: number) => (
                <p key={index}>
                  <strong>{t("fileInfo.sourceFormat")}:</strong>{" "}
                  {sourcePreset.format || t("fileInfo.unknownFormat")}
                </p>
              ))}

            {genericEQPreset && (
              <p>
                <strong>{t("fileInfo.bands")}:</strong>{" "}
                {
                  genericEQPreset.Bands.filter((b: GenericEQBand) => b.Enabled)
                    .length
                }{" "}
                enabled
              </p>
            )}
            {genericEQPreset && genericEQPreset.Bands.length > 0 && (
              <div>
                <div className="mt-4">
                  {/* EQ Graph */}
                  <EqualizerChart
                    preset={genericEQPreset}
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
                        preset={genericEQPreset}
                        hoveredFrequency={hoveredFrequency}
                      />
                    </CollapsibleContent>
                  </Collapsible>
                </div>
              </div>
            )}
            {genericCompLimitPreset && (
              <div className="my-6">
                <h3 className="mb-1 text-lg font-medium">
                  {genericCompLimitPreset.Name}
                </h3>

                <div className="mb-2 flex items-center justify-around text-sm text-muted-foreground">
                  <span>
                    Threshold: {genericCompLimitPreset.Threshold.toFixed(2)} dB
                  </span>
                  <span>Ratio: {genericCompLimitPreset.getRatioLabel()}</span>
                </div>

                {/* Compressor Limiter Graph */}
                <CompressorLimiterGraph comp={genericCompLimitPreset} />
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

      {/* Display all source presets and the conversions */}
      {sourcePresets && sourcePresets.length > 0 ? (
        <Card className="mx-auto">
          <CardHeader>
            <CardTitle>{t("conversion.title")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mt-1 flex flex-wrap gap-2">
              {sourcePresets.map((sourcePreset, index) => {
                return (
                  <TargetConversion
                    key={index}
                    sourceData={sourcePreset.data}
                    originalFileName={droppedFile?.name || null}
                    sourceFormatId={sourcePreset.format || "unknown"}
                  />
                );
              })}
            </div>
          </CardContent>
        </Card>
      ) : (
        <p>{t("conversion.noSourcePresets")}</p>
      )}
    </div>
  );
}
