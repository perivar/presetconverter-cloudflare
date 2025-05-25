import {
  FabfilterProQ3,
  ProQ3Band,
  ProQ3Shape,
  ProQ3Slope,
  ProQ3StereoPlacement,
} from "../FabfilterProQ3";
import { AbletonEq8, BandMode, ChannelMode } from "./AbletonEq8";

export class AbletonToFabFilterAdapter {
  static toFabfilterProQ3(eq: AbletonEq8): FabfilterProQ3 {
    const fabfilterProQ3 = new FabfilterProQ3();
    fabfilterProQ3.Bands = [];

    if (eq.Mode !== ChannelMode.Stereo) {
      throw new Error(
        `Only Stereo conversion is supported. ChannelMode was ${eq.Mode}!`
      );
    }

    for (const band of eq.Bands) {
      if (band.Parameter !== "ParameterA") continue;

      const proQ3Band: ProQ3Band = {
        Enabled: band.IsOn,
        Gain: band.Gain,
        Frequency: band.Freq,
        Q: band.Q,
        DynamicRange: 0, // Added default dynamic range
        DynamicThreshold: 1, // Added default dynamic threshold (1 = auto)
        Slope: ProQ3Slope.Slope24dB_oct, // Default slope
        StereoPlacement: ProQ3StereoPlacement.Stereo,
        Shape: ProQ3Shape.Bell, // Default shape, will be updated in switch
      };

      switch (band.Mode) {
        case BandMode.LowCut48:
          proQ3Band.Shape = ProQ3Shape.LowCut;
          proQ3Band.Slope = ProQ3Slope.Slope48dB_oct;
          break;
        case BandMode.LowCut12:
          proQ3Band.Shape = ProQ3Shape.LowCut;
          proQ3Band.Slope = ProQ3Slope.Slope12dB_oct;
          break;
        case BandMode.LeftShelf:
          proQ3Band.Shape = ProQ3Shape.LowShelf;
          break;
        case BandMode.Bell:
          proQ3Band.Shape = ProQ3Shape.Bell;
          break;
        case BandMode.Notch:
          proQ3Band.Shape = ProQ3Shape.Notch;
          break;
        case BandMode.RightShelf:
          proQ3Band.Shape = ProQ3Shape.HighShelf;
          break;
        case BandMode.HighCut12:
          proQ3Band.Shape = ProQ3Shape.HighCut;
          proQ3Band.Slope = ProQ3Slope.Slope12dB_oct;
          break;
        case BandMode.HighCut48:
          proQ3Band.Shape = ProQ3Shape.HighCut;
          proQ3Band.Slope = ProQ3Slope.Slope48dB_oct;
          break;
        default:
          // Handle unknown band modes if necessary, or throw an error
          console.warn(`Unknown BandMode: ${band.Mode}. Skipping band.`);
          continue; // Skip this band if mode is unknown
      }

      fabfilterProQ3.Bands.push(proQ3Band);
    }

    // Assuming AddDefaultUnknownParameters is not needed or handled differently in TS
    // fabfilterProQ3.AddDefaultUnknownParameters();

    return fabfilterProQ3;
  }
}
