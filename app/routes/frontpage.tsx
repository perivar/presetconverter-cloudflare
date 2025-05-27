// app/routes/frontpage.tsx

import { useCallback, useState } from "react";
import type { LoaderFunctionArgs, MetaFunction } from "@remix-run/cloudflare";
import { json } from "@remix-run/react";
import i18next from "~/i18n/i18n.server";
import { FabFilterToGenericEQ } from "~/utils/converters/FabFilterToGenericEQ";
import { SteinbergFrequencyToGenericEQ } from "~/utils/converters/SteinbergFrequencyToGenericEQ";
import { FabfilterProQ } from "~/utils/preset/FabfilterProQ";
import { FabfilterProQ2 } from "~/utils/preset/FabfilterProQ2";
import { FabfilterProQ3 } from "~/utils/preset/FabfilterProQ3";
import { FabfilterProQBase } from "~/utils/preset/FabfilterProQBase";
import { FxChunkSet, FXP, FxProgramSet } from "~/utils/preset/FXP";
import { GenericEQBand, GenericEQPreset } from "~/utils/preset/GenericEQPreset";
import { SteinbergFrequency } from "~/utils/preset/SteinbergFrequency";
import { VstPresetFactory } from "~/utils/preset/VstPresetFactory";
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
import { TargetConversion } from "~/components/TargetConversion";

type TargetFormat = "steinberg-frequency";

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
  fabfilterEQPreset: FabfilterProQBase | null;
  fabfilterEQSource: string | null;
}

const readFxpAsFabfilterEQ = (data: Uint8Array): FxpPresetData => {
  const fxp = new FXP();
  fxp.readFile(data);

  let fabfilterEQPreset: FabfilterProQBase | null = null;
  let fabfilterEQSource: string | null = null;
  let fxId: string | null = null;
  let chunkData: Uint8Array | null = null;

  // First try to parse as a Pro-Q preset using VstPresetFactory
  if (fxp.content?.FxID) {
    const { preset, source } =
      VstPresetFactory.getFabFilterProQPresetFromFXP(data);
    fabfilterEQPreset = preset;
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
  const [parsedData, setParsedData] = useState<GenericEQPreset | null>(null);
  const [sourceFormat, setSourceFormat] = useState<string | null>(null);
  const [hoveredFrequency, setHoveredFrequency] = useState<number | null>(null);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      setError(null);
      setParsedData(null);
      setSourceFormat(null);
      setDroppedFile(null);
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
              const {
                chunkData: fxpChunkData,
                fabfilterEQPreset,
                fabfilterEQSource,
              } = readFxpAsFabfilterEQ(data);
              if (fabfilterEQPreset) {
                // Successfully parsed a Pro-Q preset
                setSourceFormat(fabfilterEQSource);

                // convert to common eqpreset format
                const eqPreset =
                  FabFilterToGenericEQ.convertBase(fabfilterEQPreset);
                setParsedData(eqPreset);

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
            const proQ3 = new FabfilterProQ3();
            if (proQ3.readFFP(chunkData)) {
              const eqPreset = FabFilterToGenericEQ.convertBase(proQ3);
              setParsedData(eqPreset);
              setSourceFormat(proQ3.PlugInName);
            } else {
              const proQ2 = new FabfilterProQ2();
              if (proQ2.readFFP(chunkData)) {
                const eqPreset = FabFilterToGenericEQ.convertBase(proQ2);
                setParsedData(eqPreset);
                setSourceFormat(proQ2.PlugInName);
              } else {
                const proQ1 = new FabfilterProQ();
                if (proQ1.readFFP(chunkData)) {
                  const eqPreset = FabFilterToGenericEQ.convertBase(proQ1);
                  setParsedData(eqPreset);
                  setSourceFormat(proQ1.PlugInName);
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
              if (
                vstPreset &&
                (vstPreset instanceof FabfilterProQ ||
                  vstPreset instanceof FabfilterProQ2 ||
                  vstPreset instanceof FabfilterProQ3)
              ) {
                console.log(
                  "FabfilterProQ[1|2|3] preset:",
                  vstPreset.toString()
                );
                const eqPreset = FabFilterToGenericEQ.convertBase(vstPreset);
                setParsedData(eqPreset);
                setSourceFormat(t(`${vstPreset.constructor.name}`));
              } else if (vstPreset && vstPreset instanceof SteinbergFrequency) {
                console.log("SteinbergFrequency preset:", vstPreset.toString());
                const eqPreset =
                  SteinbergFrequencyToGenericEQ.convertBase(vstPreset);
                setParsedData(eqPreset);
                setSourceFormat(t(`${vstPreset.constructor.name}`));
              } else if (vstPreset) {
                // If vstPreset exists but is not a supported type
                setError(
                  `Unsupported Vst3ClassID: ${vstPreset.Vst3ClassID} (${file.name})`
                );
              }
            } catch (_err) {
              setError(t("error.unsupportedFormat", { fileName: file.name }));
            }
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
      <h1 className="mb-8 text-center text-3xl font-bold">{t("title")}</h1>

      <Card className="mb-8">
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
        <Card className="mb-8">
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
            {parsedData && (
              <p>
                <strong>{t("fileInfo.bands")}:</strong>{" "}
                {
                  parsedData.Bands.filter((b: GenericEQBand) => b.Enabled)
                    .length
                }{" "}
                enabled
              </p>
            )}
            {parsedData && parsedData.Bands.length > 0 && (
              <div>
                <div className="mt-4">
                  {/* EQ Graph */}
                  <EqualizerChart
                    preset={parsedData}
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
                        preset={parsedData}
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

      {parsedData && (
        <TargetConversion
          parsedData={parsedData}
          droppedFile={droppedFile}
          sourceFormatId={sourceFormat || "unknown"}
        />
      )}
    </div>
  );
}
