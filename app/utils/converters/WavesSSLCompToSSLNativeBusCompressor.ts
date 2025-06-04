import { SSLNativeBusCompressor } from "../preset/SSLNativeBusCompressor";
import {
  AttackType,
  RatioType,
  ReleaseType,
  WavesSSLComp,
} from "../preset/WavesSSLComp";
import { MultiFormatConverter } from "./MultiFormatConverter";

export const WavesSSLCompToSSLNativeBusCompressor: MultiFormatConverter<
  WavesSSLComp,
  SSLNativeBusCompressor
> = {
  from: "WavesSSLComp",
  to: "SSLNativeBusCompressor",
  displayName: "SSL Native Bus Compressor",

  convertBase(preset: WavesSSLComp): SSLNativeBusCompressor {
    const sslNativeBusCompressor = new SSLNativeBusCompressor();

    sslNativeBusCompressor.PresetName =
      preset.PresetName || "Waves SSLComp Converted";
    sslNativeBusCompressor.Threshold = preset.Threshold;
    sslNativeBusCompressor.MakeupGain = preset.MakeupGain;
    sslNativeBusCompressor.CompBypass = !preset.In; // Invert 'In' to 'CompBypass'

    // Convert AttackType enum to number
    switch (preset.Attack) {
      case AttackType.Attack_0_1:
        sslNativeBusCompressor.Attack = 0.1;
        break;
      case AttackType.Attack_0_3:
        sslNativeBusCompressor.Attack = 0.3;
        break;
      case AttackType.Attack_1:
        sslNativeBusCompressor.Attack = 1.0;
        break;
      case AttackType.Attack_3:
        sslNativeBusCompressor.Attack = 3.0;
        break;
      case AttackType.Attack_10:
        sslNativeBusCompressor.Attack = 10.0;
        break;
      case AttackType.Attack_30:
        sslNativeBusCompressor.Attack = 30.0;
        break;
    }

    // Convert ReleaseType enum to number
    if (preset.Release === ReleaseType.Release_Auto) {
      sslNativeBusCompressor.Release = 0; // Represent Auto as 0
    } else {
      switch (preset.Release) {
        case ReleaseType.Release_0_1:
          sslNativeBusCompressor.Release = 0.1;
          break;
        case ReleaseType.Release_0_3:
          sslNativeBusCompressor.Release = 0.3;
          break;
        case ReleaseType.Release_0_6:
          sslNativeBusCompressor.Release = 0.6;
          break;
        case ReleaseType.Release_1_2:
          sslNativeBusCompressor.Release = 1.2;
          break;
      }
    }

    // Convert RatioType enum to number
    switch (preset.Ratio) {
      case RatioType.Ratio_2_1:
        sslNativeBusCompressor.Ratio = 2.0;
        break;
      case RatioType.Ratio_4_1:
        sslNativeBusCompressor.Ratio = 4.0;
        break;
      case RatioType.Ratio_10_1:
        sslNativeBusCompressor.Ratio = 10.0;
        break;
    }

    // Set default values for parameters not present in WavesSSLComp
    sslNativeBusCompressor.DryWetMix = 100.0;
    sslNativeBusCompressor.Oversampling = 0.0;
    sslNativeBusCompressor.SidechainHPF = 20.0;
    sslNativeBusCompressor.UseExternalKey = false;
    sslNativeBusCompressor.GroupSense = 0.0;
    sslNativeBusCompressor.GuiSlotIndex = -1.0;
    sslNativeBusCompressor.SessionDataId = 0.0;
    sslNativeBusCompressor.PluginIdent = 0.0;
    sslNativeBusCompressor.UniqueId = 0.0;

    return sslNativeBusCompressor;
  },

  outputFormats: [
    {
      formatId: "vstpreset",
      extension: ".vstpreset",
      displayName: "VSTPreset",
      convert(preset: WavesSSLComp) {
        const result = WavesSSLCompToSSLNativeBusCompressor.convertBase(preset);
        return result.write();
      },
    },
    {
      formatId: "text",
      extension: ".txt",
      displayName: "Text",
      convert(preset: WavesSSLComp) {
        const result = WavesSSLCompToSSLNativeBusCompressor.convertBase(preset);
        return result.toString();
      },
    },
  ],
};
