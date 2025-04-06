// app/routes/frontpage.tsx

import { useCallback, useState } from "react";
import type { LoaderFunctionArgs, MetaFunction } from "@remix-run/cloudflare";
import { json } from "@remix-run/react";
import i18next from "~/i18n/i18n.server";
import { FabfilterProQ } from "~/utils/FabfilterProQ";
import { FabfilterProQ2 } from "~/utils/FabfilterProQ2";
import { FabfilterProQ3 } from "~/utils/FabfilterProQ3";
import {
  FabfilterProQBand,
  FabfilterProQBase,
} from "~/utils/FabfilterProQBase";
import { toSteinbergFrequency } from "~/utils/FabfilterToSteinbergAdapter";
import { FxChunkSet, FXP, FxProgramSet } from "~/utils/FXP";
import { VstPresetFactory } from "~/utils/VstPresetFactory";
import { useDropzone } from "react-dropzone";
import { useTranslation } from "react-i18next";

import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { EqualizerBandTable } from "~/components/EqualizerBandTable";
import { EqualizerChart } from "~/components/EqualizerChart";

type TargetFormat = "steinberg-frequency";

export type EQPreset = FabfilterProQBase;
export type EQBand = FabfilterProQBand;

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

interface FxpData {
  fxId: string | null;
  chunkData: Uint8Array | null;
  preset: FabfilterProQBase | null;
}

const readFxpChunk = (data: Uint8Array): FxpData => {
  const fxp = new FXP();
  fxp.readFile(data);

  let preset: FabfilterProQBase | null = null;
  let fxId: string | null = null;
  let chunkData: Uint8Array | null = null;

  // First try to parse as a Pro-Q preset using VstPresetFactory
  if (fxp.content?.FxID) {
    preset = VstPresetFactory.getFabFilterProQPresetFromFXP(data);
    fxId = fxp.content.FxID;
  }

  // If not a Pro-Q preset or parsing failed, get the raw chunk data
  if (
    !preset &&
    fxp.content &&
    (fxp.content instanceof FxProgramSet || fxp.content instanceof FxChunkSet)
  ) {
    fxId = fxp.content.FxID ?? null;
    chunkData = fxp.content.ChunkData ?? null;
  }

  return { fxId, chunkData, preset };
};

const downloadBlob = (blob: Blob, fileName: string) => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

export default function Index() {
  const { t } = useTranslation();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [droppedFile, setDroppedFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<EQPreset | null>(null);
  const [sourceFormat, setSourceFormat] = useState<string | null>(null);
  const [targetFormat, setTargetFormat] = useState<TargetFormat | null>(null);
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
                fxId,
                chunkData: fxpChunkData,
                preset,
              } = readFxpChunk(data);
              if (preset) {
                // Successfully parsed a Pro-Q preset
                setParsedData(preset);
                if (fxId === "FPQr") {
                  setSourceFormat(t("formats.fabfilterProQ1"));
                } else if (fxId === "FQ2p") {
                  setSourceFormat(t("formats.fabfilterProQ2"));
                } else if (fxId === "FQ3p") {
                  setSourceFormat(t("formats.fabfilterProQ3"));
                }
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
              setParsedData(proQ3);
              setSourceFormat(t("formats.fabfilterProQ3"));
            } else {
              const proQ2 = new FabfilterProQ2();
              if (proQ2.readFFP(chunkData)) {
                setParsedData(proQ2);
                setSourceFormat(t("formats.fabfilterProQ2"));
              } else {
                const proQ1 = new FabfilterProQ();
                if (proQ1.readFFP(chunkData)) {
                  setParsedData(proQ1);
                  setSourceFormat(t("formats.fabfilterProQ1"));
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
              if (vstPreset) {
                setParsedData(vstPreset as EQPreset);
                setSourceFormat(t(`${vstPreset.constructor.name}`));
              }
            } catch (err) {
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

  const handleConvert = useCallback(async () => {
    if (!parsedData || !targetFormat || !droppedFile) return;

    try {
      setIsLoading(true);
      const extension = ".vstpreset";
      const mimeType = "application/octet-stream";

      let convertedData: Uint8Array | undefined;
      if (targetFormat === "steinberg-frequency") {
        const steinbergPreset = toSteinbergFrequency(parsedData);
        convertedData = await steinbergPreset.write();
      }

      if (!convertedData) {
        setError(t("error.conversionFailed"));
        return;
      }

      const blob = new Blob([convertedData], { type: mimeType });
      const originalName = droppedFile.name.replace(/\.[^/.]+$/, "");
      const fileName = `${originalName}${extension}`;

      downloadBlob(blob, fileName);
    } catch (err) {
      console.error("Conversion error:", err);
      const message = err instanceof Error ? err.message : String(err);
      setError(t("error.conversionError", { message }));
    } finally {
      setIsLoading(false);
    }
  }, [parsedData, targetFormat, droppedFile, t]);

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
                {parsedData.Bands.filter((b: EQBand) => b.Enabled).length}{" "}
                enabled
              </p>
            )}
            {parsedData && parsedData.Bands.length > 0 && (
              <div>
                <div className="mt-4">
                  {/* EQ Graph */}
                  <EqualizerChart
                    bands={parsedData.Bands}
                    onFrequencyHover={setHoveredFrequency}
                  />
                </div>
                <div className="mt-4">
                  <strong>{t("fileInfo.bandDetails")}:</strong>
                  <EqualizerBandTable
                    bands={parsedData.Bands}
                    hoveredFrequency={hoveredFrequency}
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {parsedData && (
        <Card>
          <CardHeader>
            <CardTitle>{t("conversion.title")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex flex-col space-y-2">
                <label htmlFor="targetFormat" className="text-sm font-medium">
                  {t("conversion.selectTarget")}
                </label>
                <Select
                  value={targetFormat ?? undefined}
                  onValueChange={value =>
                    setTargetFormat(value as TargetFormat)
                  }>
                  <SelectTrigger id="targetFormat">
                    <SelectValue
                      placeholder={t("conversion.selectTargetPlaceholder")}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="steinberg-frequency">
                      Steinberg Frequency
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button
                onClick={handleConvert}
                disabled={!targetFormat || isLoading}
                className="w-full">
                {isLoading
                  ? t("conversion.converting")
                  : t("conversion.convertButton")}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
