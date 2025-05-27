import {
  FabfilterProQ2,
  ProQ2Band,
  ProQ2Shape,
  ProQ2Slope,
  ProQ2StereoPlacement,
} from "../preset/FabfilterProQ2";
import { FabfilterProQBase } from "../preset/FabfilterProQBase";
import { REWEQBand, REWEQFilters, REWEQFilterType } from "../preset/REWEQ";
import { MultiFormatConverter } from "./MultiFormatConverter";

const REWToFabfilterProQ2: MultiFormatConverter<REWEQFilters, FabfilterProQ2> =
  {
    from: "REWEQFilters",
    to: "FabfilterProQ2",
    displayName: "FabFilter Pro-Q 2",

    convertBase(filters: REWEQFilters) {
      const preset = new FabfilterProQ2();
      preset.Bands = [];

      filters.EqBands.forEach((filter: REWEQBand) => {
        const band = new ProQ2Band();
        band.Frequency = filter.FilterFreq;
        band.Gain = filter.FilterGain;
        band.Q = filter.FilterQ;
        band.Enabled = filter.Enabled;

        // Map REWEQ filter types to Fabfilter ProQ shapes
        switch (filter.FilterType) {
          case REWEQFilterType.PK:
            band.Shape = ProQ2Shape.Bell;
            break;
          case REWEQFilterType.LP:
            band.Shape = ProQ2Shape.HighCut;
            break;
          case REWEQFilterType.HP:
            band.Shape = ProQ2Shape.LowCut;
            break;
          case REWEQFilterType.LS:
            band.Shape = ProQ2Shape.LowShelf;
            break;
          case REWEQFilterType.HS:
            band.Shape = ProQ2Shape.HighShelf;
            break;
          default:
            band.Shape = ProQ2Shape.Bell;
            break;
        }
        band.Slope = ProQ2Slope.Slope24dB_oct;
        band.StereoPlacement = ProQ2StereoPlacement.Stereo;

        preset.Bands.push(band);
      });

      // Fill with empty bands up to a maximum of 24 bands
      for (let i = preset.Bands.length; i < 24; i++) {
        const band = new ProQ2Band();
        band.Frequency = FabfilterProQBase.freqConvert(1000);
        band.Gain = 0;
        band.Q = FabfilterProQBase.qConvert(1);
        band.Enabled = false;
        band.Shape = ProQ2Shape.Bell;
        band.Slope = ProQ2Slope.Slope24dB_oct;
        band.StereoPlacement = ProQ2StereoPlacement.Stereo;

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
          const result = REWToFabfilterProQ2.convertBase(preset);
          return result.writeFFP();
        },
      },
      {
        formatId: "vstpreset",
        extension: ".vstpreset",
        displayName: "Steinberg VSTPreset",
        convert(preset: REWEQFilters) {
          const result = REWToFabfilterProQ2.convertBase(preset);
          return result.write();
        },
      },
    ],
  };

export default REWToFabfilterProQ2;
