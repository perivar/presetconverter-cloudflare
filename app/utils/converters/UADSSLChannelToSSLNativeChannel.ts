import { SSLNativeChannel } from "../preset/SSLNativeChannel";
import { UADSSLChannel } from "../preset/UADSSLChannel";
import { MultiFormatConverter } from "./MultiFormatConverter";

export const UADSSLChannelToSSLNativeChannel: MultiFormatConverter<
  UADSSLChannel,
  SSLNativeChannel
> = {
  from: "UADSSLChannel",
  to: "SSLNativeChannel",
  displayName: "SSL Native Channel",

  convertBase(uadSSLChannel: UADSSLChannel) {
    const sslNativeChannel = new SSLNativeChannel();

    sslNativeChannel.PresetName = uadSSLChannel.presetName;

    sslNativeChannel.CompThreshold = uadSSLChannel.findClosestParameterValue(
      "CMP Thresh",
      uadSSLChannel.CompThresh
    ) as number;
    sslNativeChannel.CompRatio = uadSSLChannel.findClosestParameterValue(
      "CMP Ratio",
      uadSSLChannel.CompRatio
    ) as number;
    sslNativeChannel.CompFastAttack = uadSSLChannel.CompAttack === 1;
    sslNativeChannel.CompRelease = uadSSLChannel.findClosestParameterValue(
      "CMP Release",
      uadSSLChannel.CompRelease
    ) as number;
    sslNativeChannel.CompMix = 100.0; // Default value for SSLNativeChannel
    sslNativeChannel.CompPeak = 0.0; // Default value for SSLNativeChannel

    sslNativeChannel.GateThreshold = uadSSLChannel.findClosestParameterValue(
      "EXP Thresh",
      uadSSLChannel.ExpThresh
    ) as number;
    sslNativeChannel.GateRange = uadSSLChannel.findClosestParameterValue(
      "EXP Range",
      uadSSLChannel.ExpRange
    ) as number;
    sslNativeChannel.GateDisabledExpEnabled = uadSSLChannel.Select === 0.0; // 0.0 is Gate, 0.5 is Expander
    sslNativeChannel.GateFastAttack = uadSSLChannel.ExpAttack === 1;
    sslNativeChannel.GateRelease = uadSSLChannel.findClosestParameterValue(
      "EXP Release",
      uadSSLChannel.ExpRelease
    ) as number;
    sslNativeChannel.GateHold = 0.25; // Default value for SSLNativeChannel

    sslNativeChannel.DynamicsIn = uadSSLChannel.DynIn === 1;
    sslNativeChannel.DynamicsPreEq = uadSSLChannel.PreDyn === 0; // Invert logic: PreDyn (UAD) vs DynamicsPreEq (SSL Native)
    sslNativeChannel.FiltersToInput = false; // UAD doesn't have a direct equivalent for FilterSplit
    sslNativeChannel.FiltersToSidechain = false; // Default value for SSLNativeChannel

    sslNativeChannel.EqIn = uadSSLChannel.EQIn === 1;
    sslNativeChannel.EqToSidechain = uadSSLChannel.EQDynSC === 1;
    sslNativeChannel.EqE = true; // Default value for SSLNativeChannel

    sslNativeChannel.LowEqBell = uadSSLChannel.LFBell === 1;
    sslNativeChannel.LowEqGain = uadSSLChannel.findClosestParameterValue(
      "LF Gain",
      uadSSLChannel.LFGain
    ) as number;
    sslNativeChannel.LowEqFreq = uadSSLChannel.findClosestParameterValue(
      "LF Freq",
      uadSSLChannel.LFFreq
    ) as number;

    sslNativeChannel.LowMidEqGain = uadSSLChannel.findClosestParameterValue(
      "LMF Gain",
      uadSSLChannel.LMFGain
    ) as number;
    sslNativeChannel.LowMidEqFreq =
      (uadSSLChannel.findClosestParameterValue(
        "LMF Freq",
        uadSSLChannel.LMFFreq
      ) as number) / 1000;
    sslNativeChannel.LowMidEqQ = uadSSLChannel.findClosestParameterValue(
      "LMF Q",
      uadSSLChannel.LMFQ
    ) as number;

    sslNativeChannel.HighMidEqGain = uadSSLChannel.findClosestParameterValue(
      "HMF Gain",
      uadSSLChannel.HMFGain
    ) as number;
    sslNativeChannel.HighMidEqFreq =
      (uadSSLChannel.findClosestParameterValue(
        "HMF Freq",
        uadSSLChannel.HMFFreq
      ) as number) / 1000;
    sslNativeChannel.HighMidEqQ = uadSSLChannel.findClosestParameterValue(
      "HMF Q",
      uadSSLChannel.HMFQ
    ) as number;

    sslNativeChannel.HighEqBell = uadSSLChannel.HFBell === 1;
    sslNativeChannel.HighEqGain = uadSSLChannel.findClosestParameterValue(
      "HF Gain",
      uadSSLChannel.HFGain
    ) as number;
    sslNativeChannel.HighEqFreq =
      (uadSSLChannel.findClosestParameterValue(
        "HF Freq",
        uadSSLChannel.HFFreq
      ) as number) / 1000;

    sslNativeChannel.HighPassFreq = uadSSLChannel.findClosestParameterValue(
      "HP Freq",
      uadSSLChannel.HPFreq
    ) as number;
    sslNativeChannel.LowPassFreq =
      (uadSSLChannel.findClosestParameterValue(
        "LP Freq",
        uadSSLChannel.LPFreq
      ) as number) / 1000;

    sslNativeChannel.InputTrim = uadSSLChannel.findClosestParameterValue(
      "Input",
      uadSSLChannel.Input
    ) as number;
    sslNativeChannel.OutputTrim = uadSSLChannel.findClosestParameterValue(
      "Output",
      uadSSLChannel.Output
    ) as number;
    sslNativeChannel.PhaseInvert = uadSSLChannel.Phase === 1;

    sslNativeChannel.Bypass = uadSSLChannel.Power === 0; // Power off means Bypass on
    sslNativeChannel.FaderLevel = 0.0; // Default value for SSLNativeChannel
    sslNativeChannel.Pan = 0.0; // Default value for SSLNativeChannel
    sslNativeChannel.SidechainListen = false; // Default value for SSLNativeChannel
    sslNativeChannel.UseExternalKey = false; // Default value for SSLNativeChannel
    sslNativeChannel.Width = 100.0; // Default value for SSLNativeChannel
    sslNativeChannel.HighQuality = false; // Default value for SSLNativeChannel

    return sslNativeChannel;
  },

  outputFormats: [
    {
      formatId: "vstpreset",
      extension: ".vstpreset",
      displayName: "VSTPreset",
      convert(preset: UADSSLChannel) {
        const result = UADSSLChannelToSSLNativeChannel.convertBase(preset);
        return result.write();
      },
    },
  ],
};
