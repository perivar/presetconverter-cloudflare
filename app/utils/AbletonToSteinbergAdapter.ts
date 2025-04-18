import { AbletonEq8, BandMode } from "./AbletonEq8";
import {
  BandMode1And8,
  BandMode2To7,
  SteinbergFrequency,
} from "./SteinbergFrequency";

export class AbletonToSteinbergAdapter {
  static toSteinbergFrequency(eq: AbletonEq8): SteinbergFrequency {
    if (eq.Mode !== 0) {
      throw new Error(
        `Only Stereo conversion is supported. ChannelMode was ${eq.Mode}!`
      );
    }

    const setParamValue = (paramName: string, value: number) => {
      const param = frequency.Parameters.get(paramName);
      if (param) param.Value = value;
    };

    const frequency = new SteinbergFrequency();

    const isBandMode1Or8 = (bandNumber: number) =>
      bandNumber === 1 || bandNumber === 8;

    for (const band of eq.Bands) {
      if (band.Parameter !== "ParameterA") continue;

      const bandNumber = band.Number + 1;

      setParamValue(`equalizerAbandon${bandNumber}`, band.IsOn ? 1.0 : 0.0);
      setParamValue(`equalizerAgain${bandNumber}`, band.Gain);
      setParamValue(`equalizerAfreq${bandNumber}`, band.Freq);
      setParamValue(`equalizerAq${bandNumber}`, band.Q);

      const paramAtypeName = `equalizerAtype${bandNumber}`;
      const paramAtype = frequency.Parameters.get(paramAtypeName);
      if (!paramAtype) {
        throw new Error(`Parameter ${paramAtypeName} not found`);
      }

      switch (band.Mode) {
        case BandMode.LowCut48:
          paramAtype.Value = BandMode1And8.Cut48;
          break;
        case BandMode.LowCut12:
          paramAtype.Value = BandMode1And8.Cut12;
          break;
        case BandMode.LeftShelf:
          paramAtype.Value = isBandMode1Or8(bandNumber)
            ? BandMode1And8.LowShelf
            : BandMode2To7.LowShelf;
          break;
        case BandMode.Bell:
          paramAtype.Value = isBandMode1Or8(bandNumber)
            ? BandMode1And8.Peak
            : BandMode2To7.Peak;
          break;
        case BandMode.Notch:
          paramAtype.Value = isBandMode1Or8(bandNumber)
            ? BandMode1And8.Notch
            : BandMode2To7.Notch;
          break;
        case BandMode.RightShelf:
          paramAtype.Value = isBandMode1Or8(bandNumber)
            ? BandMode1And8.HighShelf
            : BandMode2To7.HighShelf;
          break;
        case BandMode.HighCut12:
          paramAtype.Value = BandMode1And8.Cut12;
          break;
        case BandMode.HighCut48:
          paramAtype.Value = BandMode1And8.Cut48;
          break;
        default:
          throw new Error(`Unknown BandMode: ${band.Mode}`);
      }
    }

    return frequency;
  }
}
