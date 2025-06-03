import { UADSSLChannel } from "../preset/UADSSLChannel";
import { WavesSSLChannel } from "../preset/WavesSSLChannel";
import { MultiFormatConverter } from "./MultiFormatConverter";

export const UADSSLChannelToWavesSSLChannel: MultiFormatConverter<
  UADSSLChannel,
  WavesSSLChannel
> = {
  from: "UADSSLChannel",
  to: "WavesSSLChannel",
  displayName: "Waves SSL Channel",

  convertBase(uadSSLChannel: UADSSLChannel) {
    const wavesSSLChannel = new WavesSSLChannel();

    wavesSSLChannel.PresetName = uadSSLChannel.presetName;
    wavesSSLChannel.PresetGenericType = "SLCH";
    wavesSSLChannel.PresetGroup = null;
    wavesSSLChannel.PresetPluginName = "SSLChannel";
    wavesSSLChannel.PresetPluginSubComp = "SCHS";
    wavesSSLChannel.PresetPluginVersion = "9.92.0.45";
    wavesSSLChannel.PresetActiveSetup = "SETUP_A";

    wavesSSLChannel.CompThreshold = uadSSLChannel.findClosestParameterValue(
      "CMP Thresh",
      uadSSLChannel.CompThresh
    ) as number;
    wavesSSLChannel.CompRatio = uadSSLChannel.findClosestParameterValue(
      "CMP Ratio",
      uadSSLChannel.CompRatio
    ) as number;
    wavesSSLChannel.CompFastAttack = uadSSLChannel.CompAttack === 1;
    wavesSSLChannel.CompRelease = uadSSLChannel.findClosestParameterValue(
      "CMP Release",
      uadSSLChannel.CompRelease
    ) as number;

    wavesSSLChannel.ExpThreshold = uadSSLChannel.findClosestParameterValue(
      "EXP Thresh",
      uadSSLChannel.ExpThresh
    ) as number;
    wavesSSLChannel.ExpRange = uadSSLChannel.findClosestParameterValue(
      "EXP Range",
      uadSSLChannel.ExpRange
    ) as number;
    wavesSSLChannel.ExpDisabledGateEnabled = uadSSLChannel.Select >= 0.25;
    wavesSSLChannel.ExpFastAttack = uadSSLChannel.ExpAttack === 1;
    wavesSSLChannel.ExpRelease = uadSSLChannel.findClosestParameterValue(
      "EXP Release",
      uadSSLChannel.ExpRelease
    ) as number;

    wavesSSLChannel.DynToChannelOut = uadSSLChannel.PreDyn === 1;
    wavesSSLChannel.FilterSplit = false; // Hardcoded as false in C#
    wavesSSLChannel.DynToByPass = uadSSLChannel.DynIn === 0;

    wavesSSLChannel.LFTypeBell = uadSSLChannel.LFBell === 1;
    wavesSSLChannel.LFGain = uadSSLChannel.findClosestParameterValue(
      "LF Gain",
      uadSSLChannel.LFGain
    ) as number;
    wavesSSLChannel.LFFrq = uadSSLChannel.findClosestParameterValue(
      "LF Freq",
      uadSSLChannel.LFFreq
    ) as number;

    wavesSSLChannel.LMFGain = uadSSLChannel.findClosestParameterValue(
      "LMF Gain",
      uadSSLChannel.LMFGain
    ) as number;
    wavesSSLChannel.LMFFrq =
      (uadSSLChannel.findClosestParameterValue(
        "LMF Freq",
        uadSSLChannel.LMFFreq
      ) as number) / 1000;
    wavesSSLChannel.LMFQ = uadSSLChannel.findClosestParameterValue(
      "LMF Q",
      uadSSLChannel.LMFQ
    ) as number;

    wavesSSLChannel.HMFGain = uadSSLChannel.findClosestParameterValue(
      "HMF Gain",
      uadSSLChannel.HMFGain
    ) as number;
    wavesSSLChannel.HMFFrq =
      (uadSSLChannel.findClosestParameterValue(
        "HMF Freq",
        uadSSLChannel.HMFFreq
      ) as number) / 1000;
    wavesSSLChannel.HMFQ = uadSSLChannel.findClosestParameterValue(
      "HMF Q",
      uadSSLChannel.HMFQ
    ) as number;

    wavesSSLChannel.HFTypeBell = uadSSLChannel.HFBell === 1;
    wavesSSLChannel.HFGain = uadSSLChannel.findClosestParameterValue(
      "HF Gain",
      uadSSLChannel.HFGain
    ) as number;
    wavesSSLChannel.HFFrq =
      (uadSSLChannel.findClosestParameterValue(
        "HF Freq",
        uadSSLChannel.HFFreq
      ) as number) / 1000;

    wavesSSLChannel.EQToBypass = uadSSLChannel.EQIn === 0;
    wavesSSLChannel.EQToDynSC = uadSSLChannel.EQDynSC === 1;

    wavesSSLChannel.HPFrq = uadSSLChannel.findClosestParameterValue(
      "HP Freq",
      uadSSLChannel.HPFreq
    ) as number;

    if (uadSSLChannel.LPFreq === 0) {
      wavesSSLChannel.LPFrq = 30;
    } else {
      wavesSSLChannel.LPFrq =
        (uadSSLChannel.findClosestParameterValue(
          "LP Freq",
          uadSSLChannel.LPFreq
        ) as number) / 1000;
    }

    wavesSSLChannel.Gain = uadSSLChannel.findClosestParameterValue(
      "Output",
      uadSSLChannel.Output
    ) as number;
    wavesSSLChannel.Analog = false; // Hardcoded as false in C#
    wavesSSLChannel.VUShowOutput = true; // Hardcoded as true in C#
    wavesSSLChannel.PhaseReverse = uadSSLChannel.Phase === 1;
    wavesSSLChannel.InputTrim = uadSSLChannel.findClosestParameterValue(
      "Input",
      uadSSLChannel.Input
    ) as number;

    return wavesSSLChannel;
  },

  outputFormats: [
    {
      formatId: "vstpreset",
      extension: ".vstpreset",
      displayName: "VSTPreset",
      convert(preset: UADSSLChannel) {
        const result = UADSSLChannelToWavesSSLChannel.convertBase(preset);
        return result.write();
      },
    },
  ],
};
