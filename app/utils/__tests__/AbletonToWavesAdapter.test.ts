import {
  AbletonGlueCompressor,
  GlueCompressorAttackType,
  GlueCompressorRatioType,
  GlueCompressorReleaseType,
} from "../ableton/AbletonGlueCompressor";
import { AbletonToWavesAdapter } from "../ableton/AbletonToWavesAdapter";
import {
  WavesSSLCompAttackType,
  WavesSSLCompRatioType,
  WavesSSLCompReleaseType,
} from "../WavesSSLComp";

describe("AbletonToWavesAdapter", () => {
  it("should convert AbletonGlueCompressor to WavesSSLComp", () => {
    // Provide a dummy object for the constructor as it expects xElement
    const abletonComp = new AbletonGlueCompressor({});
    abletonComp.Threshold = 0.5; // Example value
    abletonComp.Ratio = GlueCompressorRatioType.Ratio_4_1;
    abletonComp.Attack = GlueCompressorAttackType.Attack_1;
    abletonComp.Release = GlueCompressorReleaseType.Release_0_6;
    abletonComp.Makeup = 2.5; // Example value

    const wavesComp = AbletonToWavesAdapter.toWavesSSLComp(abletonComp);

    expect(wavesComp).toBeDefined();
    expect(wavesComp.Threshold).toBe(-0.5); // Expect inverted threshold
    expect(wavesComp.Ratio).toBe(WavesSSLCompRatioType.Ratio_4_1);
    expect(wavesComp.Attack).toBe(WavesSSLCompAttackType.Attack_1);
    expect(wavesComp.Release).toBe(WavesSSLCompReleaseType.Release_0_6);
    expect(wavesComp.MakeupGain).toBe(2.5);
    expect(wavesComp.RateS).toBe(0);
    expect(wavesComp.In).toBe(true);
    expect(wavesComp.Analog).toBe(false);
    expect(wavesComp.Fade).toBe(0); // WavesSSLCompFadeType.Off is 0
  });

  it("should handle different ratio, attack, and release mappings", () => {
    const abletonComp = new AbletonGlueCompressor({});

    // Test Ratio mapping
    abletonComp.Ratio = GlueCompressorRatioType.Ratio_10_1;
    expect(AbletonToWavesAdapter.toWavesSSLComp(abletonComp).Ratio).toBe(
      WavesSSLCompRatioType.Ratio_10_1
    );
    abletonComp.Ratio = GlueCompressorRatioType.Ratio_2_1;
    expect(AbletonToWavesAdapter.toWavesSSLComp(abletonComp).Ratio).toBe(
      WavesSSLCompRatioType.Ratio_2_1
    );

    // Test Attack mapping
    abletonComp.Attack = GlueCompressorAttackType.Attack_0_01;
    expect(AbletonToWavesAdapter.toWavesSSLComp(abletonComp).Attack).toBe(
      WavesSSLCompAttackType.Attack_0_1
    );
    abletonComp.Attack = GlueCompressorAttackType.Attack_0_3;
    expect(AbletonToWavesAdapter.toWavesSSLComp(abletonComp).Attack).toBe(
      WavesSSLCompAttackType.Attack_0_3
    );
    abletonComp.Attack = GlueCompressorAttackType.Attack_30;
    expect(AbletonToWavesAdapter.toWavesSSLComp(abletonComp).Attack).toBe(
      WavesSSLCompAttackType.Attack_30
    );

    // Test Release mapping
    abletonComp.Release = GlueCompressorReleaseType.Release_0_2;
    expect(AbletonToWavesAdapter.toWavesSSLComp(abletonComp).Release).toBe(
      WavesSSLCompReleaseType.Release_0_3
    );
    abletonComp.Release = GlueCompressorReleaseType.Release_0_8;
    expect(AbletonToWavesAdapter.toWavesSSLComp(abletonComp).Release).toBe(
      WavesSSLCompReleaseType.Release_0_6
    );
    abletonComp.Release = GlueCompressorReleaseType.Release_Auto;
    expect(AbletonToWavesAdapter.toWavesSSLComp(abletonComp).Release).toBe(
      WavesSSLCompReleaseType.Release_Auto
    );
  });
});
