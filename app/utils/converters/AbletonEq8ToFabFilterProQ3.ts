// converters/AbletonToFabFilterProQ3.ts

import {
  AbletonEq8,
  AbletonEq8BandMode,
  AbletonEq8ChannelMode,
} from "../ableton/AbletonEq8";
import {
  FabFilterProQ3,
  ProQ3Band,
  ProQ3Shape,
  ProQ3Slope,
  ProQ3StereoPlacement,
} from "../preset/FabFilterProQ3";
import { MultiFormatConverter } from "./MultiFormatConverter";

export const AbletonEq8ToFabFilterProQ3: MultiFormatConverter<
  AbletonEq8,
  FabFilterProQ3
> = {
  from: "AbletonEq8",
  to: "FabFilterProQ3",
  displayName: "FabFilter Pro-Q 3",

  convertBase(preset: AbletonEq8) {
    const fabfilterProQ3 = new FabFilterProQ3();
    fabfilterProQ3.Bands = [];

    if (preset.Mode !== AbletonEq8ChannelMode.Stereo) {
      throw new Error(
        `Only Stereo conversion is supported. ChannelMode was ${preset.Mode}!`
      );
    }

    for (const band of preset.Bands) {
      if (band.Parameter !== "ParameterA") continue;

      const proQ3Band: ProQ3Band = {
        Enabled: band.IsOn,
        Gain: band.Gain,
        Frequency: band.Freq,
        Q: band.Q,
        DynamicRange: 0,
        DynamicThreshold: 1,
        Slope: ProQ3Slope.Slope24dB_oct,
        StereoPlacement: ProQ3StereoPlacement.Stereo,
        Shape: ProQ3Shape.Bell,
      };

      switch (band.Mode) {
        case AbletonEq8BandMode.LowCut48:
          proQ3Band.Shape = ProQ3Shape.LowCut;
          proQ3Band.Slope = ProQ3Slope.Slope48dB_oct;
          break;
        case AbletonEq8BandMode.LowCut12:
          proQ3Band.Shape = ProQ3Shape.LowCut;
          proQ3Band.Slope = ProQ3Slope.Slope12dB_oct;
          break;
        case AbletonEq8BandMode.LeftShelf:
          proQ3Band.Shape = ProQ3Shape.LowShelf;
          break;
        case AbletonEq8BandMode.Bell:
          proQ3Band.Shape = ProQ3Shape.Bell;
          break;
        case AbletonEq8BandMode.Notch:
          proQ3Band.Shape = ProQ3Shape.Notch;
          break;
        case AbletonEq8BandMode.RightShelf:
          proQ3Band.Shape = ProQ3Shape.HighShelf;
          break;
        case AbletonEq8BandMode.HighCut12:
          proQ3Band.Shape = ProQ3Shape.HighCut;
          proQ3Band.Slope = ProQ3Slope.Slope12dB_oct;
          break;
        case AbletonEq8BandMode.HighCut48:
          proQ3Band.Shape = ProQ3Shape.HighCut;
          proQ3Band.Slope = ProQ3Slope.Slope48dB_oct;
          break;
        default:
          console.warn(`Unknown BandMode: ${band.Mode}. Skipping band.`);
          continue;
      }

      fabfilterProQ3.Bands.push(proQ3Band);
    }

    fabfilterProQ3.addDefaultUnknownParameters();
    return fabfilterProQ3;
  },

  outputFormats: [
    {
      formatId: "ffp",
      extension: ".ffp",
      displayName: "FabFilter FFP",
      convert(preset: AbletonEq8) {
        const result = AbletonEq8ToFabFilterProQ3.convertBase(preset);
        return result.writeFFP();
      },
    },
    {
      formatId: "fxp",
      extension: ".fxp",
      displayName: "FXP Format",
      convert(preset: AbletonEq8) {
        const result = AbletonEq8ToFabFilterProQ3.convertBase(preset);
        return result.writeFXP("AbletonToFabFilter");
      },
    },
    {
      formatId: "vstpreset",
      extension: ".vstpreset",
      displayName: "VSTPreset",
      convert(preset: AbletonEq8) {
        const result = AbletonEq8ToFabFilterProQ3.convertBase(preset);
        return result.write();
      },
    },
  ],
};
