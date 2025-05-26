import { GenericEQPreset } from "../GenericEQPreset";
import { SteinbergFrequency } from "../SteinbergFrequency";
import { isHighCut, isLowCut, setBand } from "./GenericEQToSteinbergHelpers";
import { MultiFormatConverter } from "./MultiFormatConverter";

export const GenericEQToSteinbergFrequency: MultiFormatConverter<
  GenericEQPreset,
  SteinbergFrequency
> = {
  from: "GenericEQPreset",
  to: "SteinbergFrequency",
  displayName: "Steinberg Frequency",

  convertBase(preset: GenericEQPreset) {
    const frequency = new SteinbergFrequency();

    const hasLowCutBand = preset.Bands.some(band => isLowCut(band.Shape));
    const hasHighCutBand = preset.Bands.some(band => isHighCut(band.Shape));

    const band2To7 = preset.Bands.filter(
      band => !isLowCut(band.Shape) && !isHighCut(band.Shape)
    ).sort((a, b) => a.Frequency - b.Frequency);

    if (hasLowCutBand) {
      const lowCutBand = preset.Bands.filter(band => isLowCut(band.Shape)).sort(
        (a, b) => a.Frequency - b.Frequency
      )[0];
      if (lowCutBand) setBand(lowCutBand, 1, frequency);
    }

    if (hasHighCutBand) {
      const highCutBand = preset.Bands.filter(band =>
        isHighCut(band.Shape)
      ).sort((a, b) => b.Frequency - a.Frequency)[0];
      if (highCutBand) setBand(highCutBand, 8, frequency);
    }

    const startIndex = hasLowCutBand ? 2 : 1;
    const endIndex = hasHighCutBand ? 7 : 8;

    for (
      let bandNumber = startIndex, index = 0;
      bandNumber <= endIndex && index < band2To7.length;
      bandNumber++, index++
    ) {
      const band = band2To7[index];
      if (band) setBand(band, bandNumber, frequency);
    }

    return frequency;
  },

  outputFormats: [
    {
      formatId: "vstpreset",
      extension: ".vstpreset",
      displayName: "Steinberg VSTPreset",
      convert(preset: GenericEQPreset) {
        const result = GenericEQToSteinbergFrequency.convertBase(preset);
        return result.write();
      },
    },
  ],
};
