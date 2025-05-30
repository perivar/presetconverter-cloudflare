import { useState } from "react";
import { logMidiDataToString } from "~/utils/ableton/Midi";
import { getFileNameWithoutExtension } from "~/utils/StringUtils";
import { MidiData } from "midi-file";
import * as midiFile from "midi-file";
import { useTranslation } from "react-i18next";

import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { ButtonDownload } from "~/components/ButtonDownload";

interface AbletonMidiFileDisplayProps {
  abletonMidiFile: MidiData | null;
  originalFileName: string | null;
}

export function AbletonMidiFileDisplay({
  abletonMidiFile,
  originalFileName,
}: AbletonMidiFileDisplayProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { t } = useTranslation();

  if (!abletonMidiFile) {
    return null;
  }

  const fileNameNoExtension = getFileNameWithoutExtension(
    originalFileName ?? "ableton-midi"
  );
  const midiFileName = `${fileNameNoExtension}.mid`;
  const midiLogFileName = `${fileNameNoExtension}_mid.txt`;

  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle>{t("ableton.midiFile.title")}</CardTitle>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="mb-4 rounded bg-red-100 p-2 font-medium text-red-600">
            {error}
          </div>
        )}
        <div className="mt-1 flex flex-wrap gap-2">
          <ButtonDownload
            data={abletonMidiFile}
            fileName={midiFileName}
            mimeType="application/octet-stream"
            processData={async (midiData: MidiData) => {
              const midiDataArray = midiFile.writeMidi(midiData);
              return new Uint8Array(midiDataArray);
            }}
            isLoading={isLoading}
            setIsLoading={setIsLoading}
            setError={setError}
          />
          <ButtonDownload
            data={abletonMidiFile}
            fileName={midiLogFileName}
            mimeType="text/plain"
            processData={async (midiData: MidiData) => {
              return logMidiDataToString(midiData);
            }}
            isLoading={isLoading}
            setIsLoading={setIsLoading}
            setError={setError}
          />
        </div>
      </CardContent>
    </Card>
  );
}
