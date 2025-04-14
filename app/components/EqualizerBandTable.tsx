import {
  GenericEQPreset,
  GenericEQShape,
  GenericEQSlope,
} from "~/utils/GenericEQTypes";
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
  preset: GenericEQPreset;
  hoveredFrequency: number | null;
}

// Helper function to get the shape name from a numeric value
const getShapeName = (shape: GenericEQShape): string => {
  return GenericEQShape[shape] || "Unknown";
};

export function EqualizerBandTable({
  preset,
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
            <TableHead>{t("fileInfo.slope")}</TableHead>
            <TableHead className="w-[100px] text-center">
              {t("fileInfo.enabled")}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {preset.Bands.map((band, index) => (
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
              <TableCell>
                {[
                  GenericEQShape.LowCut,
                  GenericEQShape.HighCut,
                  GenericEQShape.LowShelf,
                  GenericEQShape.HighShelf,
                  GenericEQShape.TiltShelf,
                ].includes(band.Shape)
                  ? t(`bandSlopes.${GenericEQSlope[band.Slope]}`)
                  : "-"}
              </TableCell>
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
