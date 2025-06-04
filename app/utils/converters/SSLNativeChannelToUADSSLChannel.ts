import { SSLNativeChannel } from "../preset/SSLNativeChannel";
import { UADSSLChannel } from "../preset/UADSSLChannel";
import { MultiFormatConverter } from "./MultiFormatConverter";

export const SSLNativeChannelToUADSSLChannel: MultiFormatConverter<
  SSLNativeChannel,
  UADSSLChannel
> = {
  from: "SSLNativeChannel",
  to: "UADSSLChannel",
  displayName: "UAD SSL Channel",

  convertBase(sslNativeChannel: SSLNativeChannel) {
    const uadSSLChannel = new UADSSLChannel();

    uadSSLChannel.presetName = sslNativeChannel.PresetName;

    uadSSLChannel.CompThresh = uadSSLChannel.findClosestValue(
      "CMP Thresh",
      sslNativeChannel.CompThreshold
    );
    uadSSLChannel.CompRatio = uadSSLChannel.findClosestValue(
      "CMP Ratio",
      sslNativeChannel.CompRatio
    );
    uadSSLChannel.CompAttack = sslNativeChannel.CompFastAttack ? 1 : 0;
    uadSSLChannel.CompRelease = uadSSLChannel.findClosestValue(
      "CMP Release",
      sslNativeChannel.CompRelease
    );

    uadSSLChannel.ExpThresh = uadSSLChannel.findClosestValue(
      "EXP Thresh",
      sslNativeChannel.GateThreshold
    );
    uadSSLChannel.ExpRange = uadSSLChannel.findClosestValue(
      "EXP Range",
      sslNativeChannel.GateRange
    );
    if (sslNativeChannel.GateDisabledExpEnabled) {
      uadSSLChannel.Select = uadSSLChannel.findClosestValue("Select", 0.0); // Gate
    } else {
      uadSSLChannel.Select = uadSSLChannel.findClosestValue("Select", 0.5); // Expander
    }
    uadSSLChannel.ExpAttack = sslNativeChannel.GateFastAttack ? 1 : 0;
    uadSSLChannel.ExpRelease = uadSSLChannel.findClosestValue(
      "EXP Release",
      sslNativeChannel.GateRelease
    );
    uadSSLChannel.ExpIn = 1.0; // Always on for UAD

    uadSSLChannel.CompIn = sslNativeChannel.DynamicsIn ? 1 : 0;
    uadSSLChannel.DynIn = sslNativeChannel.DynamicsIn ? 1 : 0;
    uadSSLChannel.PreDyn = sslNativeChannel.DynamicsPreEq ? 0 : 1; // Invert logic: DynamicsPreEq (SSL Native) vs PreDyn (UAD)

    uadSSLChannel.LFBell = sslNativeChannel.LowEqBell ? 1 : 0;
    uadSSLChannel.LFGain = uadSSLChannel.findClosestValue(
      "LF Gain",
      sslNativeChannel.LowEqGain
    );
    uadSSLChannel.LFFreq = uadSSLChannel.findClosestValue(
      "LF Freq",
      sslNativeChannel.LowEqFreq
    );

    uadSSLChannel.LMFGain = uadSSLChannel.findClosestValue(
      "LMF Gain",
      sslNativeChannel.LowMidEqGain
    );
    uadSSLChannel.LMFFreq = uadSSLChannel.findClosestValue(
      "LMF Freq",
      sslNativeChannel.LowMidEqFreq * 1000
    );
    uadSSLChannel.LMFQ = uadSSLChannel.findClosestValue(
      "LMF Q",
      sslNativeChannel.LowMidEqQ
    );

    uadSSLChannel.HMFGain = uadSSLChannel.findClosestValue(
      "HMF Gain",
      sslNativeChannel.HighMidEqGain
    );
    uadSSLChannel.HMFFreq = uadSSLChannel.findClosestValue(
      "HMF Freq",
      sslNativeChannel.HighMidEqFreq * 1000
    );
    uadSSLChannel.HMFQ = uadSSLChannel.findClosestValue(
      "HMF Q",
      sslNativeChannel.HighMidEqQ
    );

    uadSSLChannel.HFBell = sslNativeChannel.HighEqBell ? 1 : 0;
    uadSSLChannel.HFGain = uadSSLChannel.findClosestValue(
      "HF Gain",
      sslNativeChannel.HighEqGain
    );
    uadSSLChannel.HFFreq = uadSSLChannel.findClosestValue(
      "HF Freq",
      sslNativeChannel.HighEqFreq * 1000
    );

    uadSSLChannel.EQIn = sslNativeChannel.EqIn ? 1 : 0;
    uadSSLChannel.EQDynSC = sslNativeChannel.EqToSidechain ? 1 : 0;

    uadSSLChannel.HPFreq = uadSSLChannel.findClosestValue(
      "HP Freq",
      sslNativeChannel.HighPassFreq
    );
    uadSSLChannel.LPFreq = uadSSLChannel.findClosestValue(
      "LP Freq",
      sslNativeChannel.LowPassFreq * 1000
    );

    uadSSLChannel.Output = uadSSLChannel.findClosestValue(
      "Output",
      sslNativeChannel.OutputTrim
    );
    uadSSLChannel.Phase = sslNativeChannel.PhaseInvert ? 1 : 0;
    uadSSLChannel.Input = uadSSLChannel.findClosestValue(
      "Input",
      sslNativeChannel.InputTrim
    );

    uadSSLChannel.EQType = 0.0; // Black EQ Type (default for UAD SSL E Channel)
    uadSSLChannel.StereoLink = 1.0; // Always linked for UAD
    uadSSLChannel.Power = 1.0; // Always on for UAD

    return uadSSLChannel;
  },

  outputFormats: [
    {
      formatId: "vstpreset",
      extension: ".vstpreset",
      displayName: "VSTPreset",
      convert(preset: SSLNativeChannel) {
        const result = SSLNativeChannelToUADSSLChannel.convertBase(preset);
        return result.write();
      },
    },
  ],
};
