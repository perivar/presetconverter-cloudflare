import { FabfilterProQBase } from "../preset/FabfilterProQBase";
import { SteinbergFrequency } from "../preset/SteinbergFrequency";
import {
  Band,
  isHighCut,
  isLowCut,
  setBand,
} from "./FabfilterToSteinbergHelpers";
import { MultiFormatConverter } from "./MultiFormatConverter";

export const FabfilterToSteinbergFrequency: MultiFormatConverter<
  FabfilterProQBase,
  SteinbergFrequency
> = {
  from: "FabFilter Pro-Q",
  to: "SteinbergFrequency",
  displayName: "Steinberg Frequency",

  convertBase(eq: FabfilterProQBase) {
    const frequency = new SteinbergFrequency();

    // Frequency only supports lowcut on the 1st band and highcut on the 8th band
    const hasLowCutBand = eq.Bands.some(band => isLowCut((band as Band).Shape));
    const hasHighCutBand = eq.Bands.some(band =>
      isHighCut((band as Band).Shape)
    );

    // get remaining bands that are not lowcut or highcut and sort by frequency
    const band2To7 = eq.Bands.filter(band => {
      const shape = (band as Band).Shape;
      return !isLowCut(shape) && !isHighCut(shape);
    }).sort((a, b) => a.Frequency - b.Frequency);

    if (hasLowCutBand) {
      const lowCutBand = eq.Bands.filter(band =>
        isLowCut((band as Band).Shape)
      ).sort((a, b) => a.Frequency - b.Frequency)[0];

      if (lowCutBand) {
        setBand(lowCutBand as Band, 1, frequency);
      }
    }

    if (hasHighCutBand) {
      const highCutBand = eq.Bands.filter(band =>
        isHighCut((band as Band).Shape)
      ).sort((a, b) => b.Frequency - a.Frequency)[0];

      if (highCutBand) {
        setBand(highCutBand as Band, 8, frequency);
      }
    }

    // rest of the bands (2-7)
    const startIndex = hasLowCutBand ? 2 : 1;
    const endIndex = hasHighCutBand ? 7 : 8;

    for (
      let bandNumber = startIndex, index = 0;
      bandNumber <= endIndex && index < band2To7.length;
      bandNumber++, index++
    ) {
      const band = band2To7[index];
      if (band) {
        setBand(band as Band, bandNumber, frequency);
      }
    }

    return frequency;
  },

  outputFormats: [
    {
      formatId: "vstpreset",
      extension: ".vstpreset",
      displayName: "Steinberg VSTPreset",
      convert(preset: FabfilterProQBase) {
        const result = FabfilterToSteinbergFrequency.convertBase(preset);
        return result.write();
      },
    },
  ],
};
