import { GenericCompressorLimiter } from "../preset/GenericCompressorLimiter";
import {
  AttackType,
  FadeType,
  RatioType,
  ReleaseType,
  WavesSSLComp,
} from "../preset/WavesSSLComp";
import { MultiFormatConverter } from "./MultiFormatConverter";

export const WavesSSLCompToGenericCompressorLimiter: MultiFormatConverter<
  WavesSSLComp,
  GenericCompressorLimiter
> = {
  from: "WavesSSLComp",
  to: "GenericCompressorLimiter",
  displayName: "Generic Compressor/Limiter",

  convertBase(preset: WavesSSLComp): GenericCompressorLimiter {
    let attackMs = 0;
    switch (preset.Attack) {
      case AttackType.Attack_0_1:
        attackMs = 0.1;
        break;
      case AttackType.Attack_0_3:
        attackMs = 0.3;
        break;
      case AttackType.Attack_1:
        attackMs = 1.0;
        break;
      case AttackType.Attack_3:
        attackMs = 3.0;
        break;
      case AttackType.Attack_10:
        attackMs = 10.0;
        break;
      case AttackType.Attack_30:
        attackMs = 30.0;
        break;
    }

    let releaseS = 0;
    if (preset.Release === ReleaseType.Release_Auto) {
      // Auto release can be represented as 0 or a specific large number,
      // depending on how GenericCompressorLimiter handles it.
      // For now, let's use 0 and assume the generic compressor handles 'auto' if 0.
      releaseS = 0;
    } else {
      switch (preset.Release) {
        case ReleaseType.Release_0_1:
          releaseS = 0.1;
          break;
        case ReleaseType.Release_0_3:
          releaseS = 0.3;
          break;
        case ReleaseType.Release_0_6:
          releaseS = 0.6;
          break;
        case ReleaseType.Release_1_2:
          releaseS = 1.2;
          break;
      }
    }

    let ratioValue = 0;
    switch (preset.Ratio) {
      case RatioType.Ratio_2_1:
        ratioValue = 2;
        break;
      case RatioType.Ratio_4_1:
        ratioValue = 4;
        break;
      case RatioType.Ratio_10_1:
        ratioValue = 10;
        break;
    }

    let fadeValue = 0;
    switch (preset.Fade) {
      case FadeType.In:
        fadeValue = 1; // Assuming 1 for In, -1 for Out, 0 for Off
        break;
      case FadeType.Out:
        fadeValue = -1;
        break;
      case FadeType.Off:
      default:
        fadeValue = 0;
        break;
    }

    return new GenericCompressorLimiter(
      preset.PresetName || "Waves SSLComp Preset",
      preset.Threshold,
      ratioValue,
      preset.MakeupGain,
      attackMs,
      releaseS,
      6, // Waves SSLComp doesn't have a direct 'knee' parameter, default to 6 = Moderate soft knee (common)
      fadeValue,
      preset.RateS,
      preset.In,
      preset.Analog
    );
  },

  outputFormats: [
    {
      formatId: "text",
      extension: ".txt",
      displayName: "Text",
      convert(preset: WavesSSLComp) {
        const result =
          WavesSSLCompToGenericCompressorLimiter.convertBase(preset);
        return result.toString();
      },
    },
  ],
};
