import {
  FabFilterProQ3,
  ProQ3Band,
  ProQ3Shape,
  ProQ3Slope,
  ProQ3StereoPlacement,
} from "../preset/FabFilterProQ3";
import { FabFilterProQBase } from "../preset/FabFilterProQBase";
import { REWEQBand, REWEQFilters, REWEQFilterType } from "../preset/REWEQ";
import { MultiFormatConverter } from "./MultiFormatConverter";

export const REWToFabFilterProQ3: MultiFormatConverter<
  REWEQFilters,
  FabFilterProQ3
> = {
  from: "REWEQFilters",
  to: "FabFilterProQ3",
  displayName: "FabFilter Pro-Q 3",

  convertBase(filters: REWEQFilters) {
    const preset = new FabFilterProQ3();
    preset.Bands = [];

    filters.EqBands.forEach((filter: REWEQBand) => {
      const band = new ProQ3Band();
      band.Frequency = filter.FilterFreq;
      band.Gain = filter.FilterGain;
      band.Q = filter.FilterQ;
      band.Enabled = filter.Enabled;

      // Map REWEQ filter types to FabFilter ProQ shapes
      switch (filter.FilterType) {
        case REWEQFilterType.PK:
          band.Shape = ProQ3Shape.Bell;
          break;
        case REWEQFilterType.LP:
          band.Shape = ProQ3Shape.HighCut;
          break;
        case REWEQFilterType.HP:
          band.Shape = ProQ3Shape.LowCut;
          break;
        case REWEQFilterType.LS:
          band.Shape = ProQ3Shape.LowShelf;
          break;
        case REWEQFilterType.HS:
          band.Shape = ProQ3Shape.HighShelf;
          break;
        default:
          band.Shape = ProQ3Shape.Bell;
          break;
      }
      band.Slope = ProQ3Slope.Slope24dB_oct;
      band.StereoPlacement = ProQ3StereoPlacement.Stereo;

      preset.Bands.push(band);
    });

    // Fill with empty bands up to a maximum of 24 bands
    for (let i = preset.Bands.length; i < 24; i++) {
      const band = new ProQ3Band();
      band.Frequency = FabFilterProQBase.freqConvert(1000);
      band.Gain = 0;
      band.Q = FabFilterProQBase.qConvert(1);
      band.Enabled = false;
      band.Shape = ProQ3Shape.Bell;
      band.Slope = ProQ3Slope.Slope24dB_oct;
      band.StereoPlacement = ProQ3StereoPlacement.Stereo;

      preset.Bands.push(band);
    }

    return preset;
  },

  outputFormats: [
    {
      formatId: "ffp",
      extension: ".ffp",
      displayName: "FabFilter FFP",
      convert(preset: REWEQFilters) {
        const result = REWToFabFilterProQ3.convertBase(preset);
        return result.writeFFP();
      },
    },
    {
      formatId: "fxp",
      extension: ".fxp",
      displayName: "FXP Format",
      convert(preset: REWEQFilters) {
        const result = REWToFabFilterProQ3.convertBase(preset);
        return result.writeFXP("REWToFabFilter");
      },
    },
    {
      formatId: "vstpreset",
      extension: ".vstpreset",
      displayName: "VSTPreset",
      convert(preset: REWEQFilters) {
        const result = REWToFabFilterProQ3.convertBase(preset);
        return result.write();
      },
    },
  ],
};
