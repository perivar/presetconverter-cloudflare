import type { EQBand } from "~/routes/frontpage";
import { ProQShape } from "~/utils/FabfilterProQ";
import { ProQ2Shape } from "~/utils/FabfilterProQ2";
import { ProQ3Shape } from "~/utils/FabfilterProQ3";
import { FabfilterProQShape } from "~/utils/FabfilterProQBase";
import { CheckCircle2, XCircle } from "lucide-react";
import { useTranslation } from "react-i18next";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";

interface EqualizerBandTableProps {
  bands: EQBand[];
  hoveredFrequency: number | null;
}

// Helper function to get the shape name from a numeric value
const getShapeName = (
  shape: FabfilterProQShape | ProQShape | ProQ2Shape | ProQ3Shape
): string => {
  // Try each enum in sequence
  if (shape in FabfilterProQShape) {
    return FabfilterProQShape[shape];
  }
  if (shape in ProQShape) {
    return ProQShape[shape];
  }
  if (shape in ProQ2Shape) {
    return ProQ2Shape[shape];
  }
  if (shape in ProQ3Shape) {
    return ProQ3Shape[shape];
  }
  return "Unknown";
};

export function EqualizerBandTable({
  bands,
  hoveredFrequency,
}: EqualizerBandTableProps) {
  const { t } = useTranslation();

  return (
    <div className="mt-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[50px]">#</TableHead>
            <TableHead>{t("fileInfo.type")}</TableHead>
            <TableHead>{t("fileInfo.frequency")}</TableHead>
            <TableHead>{t("fileInfo.gain")}</TableHead>
            <TableHead>{t("fileInfo.q")}</TableHead>
            <TableHead className="w-[100px] text-center">
              {t("fileInfo.enabled")}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {bands.map((band, index) => (
            <TableRow
              key={index}
              className={
                hoveredFrequency &&
                Math.abs(hoveredFrequency - band.Frequency) < 1
                  ? "bg-primary/20 ring-1 ring-inset ring-primary"
                  : undefined
              }>
              <TableCell>{index + 1}</TableCell>
              <TableCell>
                {t(`bandShapes.${getShapeName(band.Shape)}`)}
              </TableCell>
              <TableCell>{band.Frequency.toFixed(2)} Hz</TableCell>
              <TableCell>{band.Gain.toFixed(2)} dB</TableCell>
              <TableCell>{band.Q.toFixed(2)}</TableCell>
              <TableCell className="text-center">
                {band.Enabled ? (
                  <CheckCircle2 className="mx-auto size-4 text-green-500" />
                ) : (
                  <XCircle className="mx-auto size-4 text-red-500" />
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
