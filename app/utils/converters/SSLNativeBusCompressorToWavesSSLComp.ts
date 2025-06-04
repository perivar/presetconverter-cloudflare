import { SSLNativeBusCompressor } from "../preset/SSLNativeBusCompressor";
import {
  AttackType,
  FadeType,
  RatioType,
  ReleaseType,
  WavesSSLComp,
} from "../preset/WavesSSLComp";
import { MultiFormatConverter } from "./MultiFormatConverter";

export const SSLNativeBusCompressorToWavesSSLComp: MultiFormatConverter<
  SSLNativeBusCompressor,
  WavesSSLComp
> = {
  from: "SSLNativeBusCompressor",
  to: "WavesSSLComp",
  displayName: "Waves SSLComp",

  convertBase(preset: SSLNativeBusCompressor): WavesSSLComp {
    const wavesSSLComp = new WavesSSLComp();

    wavesSSLComp.PresetName =
      preset.PresetName || "SSL Native Bus Compressor Converted";
    wavesSSLComp.Threshold = preset.Threshold;
    wavesSSLComp.MakeupGain = preset.MakeupGain;
    wavesSSLComp.In = !preset.CompBypass; // Invert 'CompBypass' to 'In'

    // Convert Attack number to AttackType enum
    if (preset.Attack <= 0.1) {
      wavesSSLComp.Attack = AttackType.Attack_0_1;
    } else if (preset.Attack <= 0.3) {
      wavesSSLComp.Attack = AttackType.Attack_0_3;
    } else if (preset.Attack <= 1.0) {
      wavesSSLComp.Attack = AttackType.Attack_1;
    } else if (preset.Attack <= 3.0) {
      wavesSSLComp.Attack = AttackType.Attack_3;
    } else if (preset.Attack <= 10.0) {
      wavesSSLComp.Attack = AttackType.Attack_10;
    } else {
      wavesSSLComp.Attack = AttackType.Attack_30;
    }

    // Convert Release number to ReleaseType enum
    if (preset.Release === 0) {
      wavesSSLComp.Release = ReleaseType.Release_Auto;
    } else if (preset.Release <= 0.1) {
      wavesSSLComp.Release = ReleaseType.Release_0_1;
    } else if (preset.Release <= 0.3) {
      wavesSSLComp.Release = ReleaseType.Release_0_3;
    } else if (preset.Release <= 0.6) {
      wavesSSLComp.Release = ReleaseType.Release_0_6;
    } else {
      wavesSSLComp.Release = ReleaseType.Release_1_2;
    }

    // Convert Ratio number to RatioType enum
    if (preset.Ratio <= 2.0) {
      wavesSSLComp.Ratio = RatioType.Ratio_2_1;
    } else if (preset.Ratio <= 4.0) {
      wavesSSLComp.Ratio = RatioType.Ratio_4_1;
    } else {
      wavesSSLComp.Ratio = RatioType.Ratio_10_1;
    }

    // Set default values for parameters not present in SSLNativeBusCompressor
    wavesSSLComp.RateS = 0; // No direct equivalent, default to 0
    wavesSSLComp.Analog = false; // No direct equivalent, default to false
    wavesSSLComp.Fade = FadeType.Off; // No direct equivalent, default to Off

    return wavesSSLComp;
  },

  outputFormats: [
    {
      formatId: "vstpreset",
      extension: ".vstpreset",
      displayName: "VSTPreset",
      convert(preset: SSLNativeBusCompressor) {
        const result = SSLNativeBusCompressorToWavesSSLComp.convertBase(preset);
        return result.write();
      },
    },
    {
      formatId: "text",
      extension: ".txt",
      displayName: "Text",
      convert(preset: SSLNativeBusCompressor) {
        const result = SSLNativeBusCompressorToWavesSSLComp.convertBase(preset);
        return result.toString();
      },
    },
  ],
};
