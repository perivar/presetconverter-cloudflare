import { ReaEQ, ReaEQBand, ReaEQFilterType } from "../preset/ReaEQ";
import { REWEQFilters, REWEQFilterType } from "../preset/REWEQ";
import { MultiFormatConverter } from "./MultiFormatConverter";

export const REWToReaEQ: MultiFormatConverter<REWEQFilters, ReaEQ> = {
  from: "REWEQFilters",
  to: "ReaEQ",
  displayName: "ReaEQ",

  convertBase(filters: REWEQFilters): ReaEQ {
    const reaEq = new ReaEQ();
    reaEq.Bands = filters.EqBands.map(filter => {
      const band = new ReaEQBand();
      band.FilterFreq = filter.FilterFreq;
      band.FilterGain = filter.FilterGain;
      band.FilterBWOct = filter.FilterBWOct;
      band.Enabled = filter.Enabled;

      switch (filter.FilterType) {
        case REWEQFilterType.PK:
          band.FilterType = ReaEQFilterType.Band;
          break;
        case REWEQFilterType.LP:
          band.FilterType = ReaEQFilterType.LowPass;
          break;
        case REWEQFilterType.HP:
          band.FilterType = ReaEQFilterType.HighPass;
          break;
        case REWEQFilterType.LS:
          band.FilterType = ReaEQFilterType.LowShelf;
          break;
        case REWEQFilterType.HS:
          band.FilterType = ReaEQFilterType.HighShelf;
          break;
        default:
          band.FilterType = ReaEQFilterType.Band;
          break;
      }
      return band;
    });

    return reaEq;
  },

  outputFormats: [
    {
      formatId: "fxp",
      extension: ".fxp",
      displayName: "FXP Format",
      convert(preset: REWEQFilters) {
        const result = REWToReaEQ.convertBase(preset);
        return result.write();
      },
    },
  ],
};
