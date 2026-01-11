import {
  AbletonEq8,
  AbletonEq8BandMode,
  AbletonEq8ChannelMode,
} from "../ableton/AbletonEq8";
import {
  FrequencyBandMode1And8,
  FrequencyBandMode2To7,
  SteinbergFrequency,
} from "../preset/SteinbergFrequency";
import { VstPreset } from "../preset/VstPreset";
import { MultiFormatConverter } from "./MultiFormatConverter";

export const AbletonEq8ToSteinbergFrequency: MultiFormatConverter<
  AbletonEq8,
  SteinbergFrequency
> = {
  from: "AbletonEq8",
  to: "SteinbergFrequency",
  displayName: "Steinberg Frequency",

  convertBase(eq: AbletonEq8) {
    if (eq.Mode !== AbletonEq8ChannelMode.Stereo) {
      throw new Error(
        `Only Stereo conversion is supported. ChannelMode was ${eq.Mode}!`
      );
    }

    const frequency = new SteinbergFrequency();

    const setParamValue = (paramName: string, value: number) => {
      const param = frequency.Parameters.get(
        `${VstPreset.CHUNK_COMP}${paramName}`
      );
      if (!param) {
        throw new Error(
          `Parameter ${`${VstPreset.CHUNK_COMP}${paramName}`} not found`
        );
      }
      param.Value = value;
    };

    const isBandMode1Or8 = (bandNumber: number) =>
      bandNumber === 1 || bandNumber === 8;

    for (const band of eq.Bands) {
      if (band.Parameter !== "ParameterA") continue;

      const bandNumber = band.Number + 1;

      setParamValue(`equalizerAbandon${bandNumber}`, band.IsOn ? 1.0 : 0.0);
      setParamValue(`equalizerAgain${bandNumber}`, band.Gain);
      setParamValue(`equalizerAfreq${bandNumber}`, band.Freq);
      setParamValue(`equalizerAq${bandNumber}`, band.Q);

      let paramValueEqType = 0;
      switch (band.Mode) {
        case AbletonEq8BandMode.LowCut48:
          paramValueEqType = FrequencyBandMode1And8.Cut48;
          break;
        case AbletonEq8BandMode.LowCut12:
          paramValueEqType = FrequencyBandMode1And8.Cut12;
          break;
        case AbletonEq8BandMode.LeftShelf:
          paramValueEqType = isBandMode1Or8(bandNumber)
            ? FrequencyBandMode1And8.LowShelf
            : FrequencyBandMode2To7.LowShelf;
          break;
        case AbletonEq8BandMode.Bell:
          paramValueEqType = isBandMode1Or8(bandNumber)
            ? FrequencyBandMode1And8.Peak
            : FrequencyBandMode2To7.Peak;
          break;
        case AbletonEq8BandMode.Notch:
          paramValueEqType = isBandMode1Or8(bandNumber)
            ? FrequencyBandMode1And8.Notch
            : FrequencyBandMode2To7.Notch;
          break;
        case AbletonEq8BandMode.RightShelf:
          paramValueEqType = isBandMode1Or8(bandNumber)
            ? FrequencyBandMode1And8.HighShelf
            : FrequencyBandMode2To7.HighShelf;
          break;
        case AbletonEq8BandMode.HighCut12:
          paramValueEqType = FrequencyBandMode1And8.Cut12;
          break;
        case AbletonEq8BandMode.HighCut48:
          paramValueEqType = FrequencyBandMode1And8.Cut48;
          break;
        default:
          throw new Error(`Unknown BandMode: ${band.Mode}`);
      }
      setParamValue(`equalizerAtype${bandNumber}`, paramValueEqType);
    }

    return frequency;
  },

  outputFormats: [
    {
      formatId: "vstpreset",
      extension: ".vstpreset",
      displayName: "VSTPreset",
      convert(preset: AbletonEq8) {
        const result = AbletonEq8ToSteinbergFrequency.convertBase(preset);
        return result.write();
      },
    },
  ],
};
