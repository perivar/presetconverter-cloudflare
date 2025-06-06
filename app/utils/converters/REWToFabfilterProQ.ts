import {
  FabFilterProQ,
  ProQBand,
  ProQLPHPSlope,
  ProQShape,
  ProQStereoPlacement,
} from "../preset/FabFilterProQ";
import { FabFilterProQBase } from "../preset/FabFilterProQBase";
import { REWEQBand, REWEQFilters, REWEQFilterType } from "../preset/REWEQ";
import { MultiFormatConverter } from "./MultiFormatConverter";

export const REWToFabFilterProQ: MultiFormatConverter<
  REWEQFilters,
  FabFilterProQ
> = {
  from: "REWEQFilters",
  to: "FabFilterProQ",
  displayName: "FabFilter Pro-Q",

  convertBase(filters: REWEQFilters) {
    const preset = new FabFilterProQ();
    preset.Version = 2;
    preset.Bands = [];

    filters.EqBands.forEach((filter: REWEQBand) => {
      const band = new ProQBand();
      band.Frequency = filter.FilterFreq;
      band.Gain = filter.FilterGain;
      band.Q = filter.FilterQ;
      band.Enabled = filter.Enabled;

      // Map REWEQ filter types to FabFilter ProQ shapes
      switch (filter.FilterType) {
        case REWEQFilterType.PK:
          band.Shape = ProQShape.Bell;
          break;
        case REWEQFilterType.LP:
          band.Shape = ProQShape.HighCut;
          break;
        case REWEQFilterType.HP:
          band.Shape = ProQShape.LowCut;
          break;
        case REWEQFilterType.LS:
          band.Shape = ProQShape.LowShelf;
          break;
        case REWEQFilterType.HS:
          band.Shape = ProQShape.HighShelf;
          break;
        default:
          band.Shape = ProQShape.Bell;
          break;
      }
      band.LPHPSlope = ProQLPHPSlope.Slope24dB_oct;
      band.StereoPlacement = ProQStereoPlacement.Stereo;

      preset.Bands.push(band);
    });

    // Fill with empty bands up to a maximum of 24 bands
    for (let i = preset.Bands.length; i < 24; i++) {
      const band = new ProQBand();
      band.Frequency = FabFilterProQBase.freqConvert(1000);
      band.Gain = 0;
      band.Q = FabFilterProQBase.qConvert(1);
      band.Enabled = false;
      band.Shape = ProQShape.Bell;
      band.LPHPSlope = ProQLPHPSlope.Slope24dB_oct;
      band.StereoPlacement = ProQStereoPlacement.Stereo;

      preset.Bands.push(band);
    }

    // Set additional preset properties
    preset.OutputGain = 0; // -1 to 1 (-Infinity to +36 dB, 0 = 0 dB)
    preset.OutputPan = 0; // -1 to 1 (0 = center)
    preset.DisplayRange = 2; // 0 = 6dB, 1 = 12dB, 2 = 30dB, 3 = 3dB
    preset.ProcessMode = 0; // 0 = zero latency, 1 = lin. phase low to max
    preset.ChannelMode = 0; // 0 = Left/Right, 1 = Mid/Side
    preset.Bypass = 0; // 0 = No bypass
    preset.ReceiveMidi = 0; // 0 = Enabled?
    preset.Analyzer = 3; // 0 = Off, 1 = Pre, 2 = Post, 3 = Pre+Post
    preset.AnalyzerResolution = 1; // 0 - 3 : low, med[x], high, max
    preset.AnalyzerSpeed = 2; // 0 - 3 : very slow, slow, med[x], fast
    preset.SoloBand = -1; // -1 (no band solo)

    return preset;
  },

  outputFormats: [
    {
      formatId: "ffp",
      extension: ".ffp",
      displayName: "FabFilter FFP",
      convert(preset: REWEQFilters) {
        const result = REWToFabFilterProQ.convertBase(preset);
        return result.writeFFP();
      },
    },
    {
      formatId: "vstpreset",
      extension: ".vstpreset",
      displayName: "VSTPreset",
      convert(preset: REWEQFilters) {
        const result = REWToFabFilterProQ.convertBase(preset);
        return result.write();
      },
    },
  ],
};
