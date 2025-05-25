import {
  WavesSSLComp,
  WavesSSLCompAttackType,
  WavesSSLCompFadeType,
  WavesSSLCompRatioType,
  WavesSSLCompReleaseType,
} from "../WavesSSLComp";
import {
  AbletonGlueCompressor,
  GlueCompressorAttackType,
  GlueCompressorRatioType,
  GlueCompressorReleaseType,
} from "./AbletonGlueCompressor";

export class AbletonToWavesAdapter {
  static toWavesSSLComp(comp: AbletonGlueCompressor): WavesSSLComp {
    const compressor = new WavesSSLComp();

    // invert threshold ?! - Assuming this comment means the value should be negative
    compressor.Threshold = -comp.Threshold;

    let ratio: WavesSSLCompRatioType;
    switch (comp.Ratio) {
      case GlueCompressorRatioType.Ratio_10_1:
        ratio = WavesSSLCompRatioType.Ratio_10_1;
        break;
      default:
      case GlueCompressorRatioType.Ratio_4_1:
        ratio = WavesSSLCompRatioType.Ratio_4_1;
        break;
      case GlueCompressorRatioType.Ratio_2_1:
        ratio = WavesSSLCompRatioType.Ratio_2_1;
        break;
    }
    compressor.Ratio = ratio;

    // Attack [0 - 5, .1 ms, .3 ms, 1 ms, 3 ms, 10 ms, 30 ms)
    let attack: WavesSSLCompAttackType;
    switch (comp.Attack) {
      case GlueCompressorAttackType.Attack_0_01: // Mapping 0.01 to 0.1 as per C#
      case GlueCompressorAttackType.Attack_0_1:
        attack = WavesSSLCompAttackType.Attack_0_1;
        break;
      case GlueCompressorAttackType.Attack_0_3:
        attack = WavesSSLCompAttackType.Attack_0_3;
        break;
      default:
      case GlueCompressorAttackType.Attack_1:
        attack = WavesSSLCompAttackType.Attack_1;
        break;
      case GlueCompressorAttackType.Attack_3:
        attack = WavesSSLCompAttackType.Attack_3;
        break;
      case GlueCompressorAttackType.Attack_10:
        attack = WavesSSLCompAttackType.Attack_10;
        break;
      case GlueCompressorAttackType.Attack_30:
        attack = WavesSSLCompAttackType.Attack_30;
        break;
    }
    compressor.Attack = attack;

    // Release: 0 - 4, .1 s, .3 s, .6 s, 1.2 s, Auto (-1)
    let release: WavesSSLCompReleaseType;
    switch (comp.Release) {
      case GlueCompressorReleaseType.Release_0_1:
        release = WavesSSLCompReleaseType.Release_0_1;
        break;
      case GlueCompressorReleaseType.Release_0_2: // Mapping 0.2 to 0.3 as per C#
      case GlueCompressorReleaseType.Release_0_4: // Mapping 0.4 to 0.3 as per C#
        release = WavesSSLCompReleaseType.Release_0_3;
        break;
      default:
      case GlueCompressorReleaseType.Release_0_6:
        release = WavesSSLCompReleaseType.Release_0_6;
        break;
      case GlueCompressorReleaseType.Release_0_8: // Mapping 0.8 to 0.6 as per C#
        release = WavesSSLCompReleaseType.Release_0_6;
        break;
      case GlueCompressorReleaseType.Release_1_2:
        release = WavesSSLCompReleaseType.Release_1_2;
        break;
      case GlueCompressorReleaseType.Release_Auto:
        release = WavesSSLCompReleaseType.Release_Auto;
        break;
    }
    compressor.Release = release;

    compressor.MakeupGain = comp.Makeup;
    compressor.RateS = 0; // Hardcoded in C#
    compressor.In = true; // Hardcoded in C#
    compressor.Analog = false; // Hardcoded in C#
    compressor.Fade = WavesSSLCompFadeType.Off; // Hardcoded in C#

    return compressor;
  }
}
