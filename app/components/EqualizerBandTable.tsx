import { formatWithMetric } from "~/utils/formatWithMetric";
import {
  GenericEQPreset,
  GenericEQShape,
  GenericEQSlope,
  GenericEQStereoPlacement,
} from "~/utils/preset/GenericEQPreset";
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

// Helper function to get the stereo placement name from a numeric value
const getStereoPlacementName = (
  placement: GenericEQStereoPlacement
): string => {
  return GenericEQStereoPlacement[placement] || "Unknown";
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
            <TableHead>{t("fileInfo.stereoPlacement")}</TableHead>
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
                  ? "bg-primary/20 ring-1 ring-primary ring-inset"
                  : undefined
              }>
              <TableCell>{index + 1}</TableCell>
              <TableCell>{t(`${getShapeName(band.Shape)}`)}</TableCell>
              <TableCell>{formatWithMetric(band.Frequency, "Hz", 1)}</TableCell>
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
                  ? t(`${GenericEQSlope[band.Slope]}`)
                  : "-"}
              </TableCell>
              <TableCell>
                {t(`${getStereoPlacementName(band.StereoPlacement)}`)}
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
