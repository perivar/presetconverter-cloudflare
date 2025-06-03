import { UADSSLChannel } from "../preset/UADSSLChannel";
import { WavesSSLChannel } from "../preset/WavesSSLChannel";
import { MultiFormatConverter } from "./MultiFormatConverter";

export const WavesSSLChannelToUADSSLChannel: MultiFormatConverter<
  WavesSSLChannel,
  UADSSLChannel
> = {
  from: "WavesSSLChannel",
  to: "UADSSLChannel",
  displayName: "UAD SSL Channel",

  convertBase(wavesSSLChannel: WavesSSLChannel) {
    const uadSSLChannel = new UADSSLChannel();

    uadSSLChannel.presetName = wavesSSLChannel.PresetName;

    uadSSLChannel.CompThresh = uadSSLChannel.findClosestValue(
      "CMP Thresh",
      wavesSSLChannel.CompThreshold
    );
    uadSSLChannel.CompRatio = uadSSLChannel.findClosestValue(
      "CMP Ratio",
      wavesSSLChannel.CompRatio
    );
    uadSSLChannel.CompAttack = wavesSSLChannel.CompFastAttack ? 1 : 0;
    uadSSLChannel.CompRelease = uadSSLChannel.findClosestValue(
      "CMP Release",
      wavesSSLChannel.CompRelease
    );

    uadSSLChannel.ExpThresh = uadSSLChannel.findClosestValue(
      "EXP Thresh",
      wavesSSLChannel.ExpThreshold
    );
    uadSSLChannel.ExpRange = uadSSLChannel.findClosestValue(
      "EXP Range",
      wavesSSLChannel.ExpRange
    );
    if (wavesSSLChannel.ExpDisabledGateEnabled) {
      uadSSLChannel.Select = uadSSLChannel.findClosestValue("Select", 0.5);
    } else {
      uadSSLChannel.Select = uadSSLChannel.findClosestValue("Select", 0.0);
    }
    uadSSLChannel.ExpAttack = wavesSSLChannel.ExpFastAttack ? 1 : 0;
    uadSSLChannel.ExpRelease = uadSSLChannel.findClosestValue(
      "EXP Release",
      wavesSSLChannel.ExpRelease
    );
    uadSSLChannel.ExpIn = 1.0;

    // Dyn To Ch Out (Dynamics to Channel Out) moves the dynamics to the output, making it post-EQ.
    // Filter Split determines whether low pass and high pass filters are placed before the dynamics processors.
    // The routing diagram is determined based on the values of FilterSplit and DynToChannelOut, and the result
    // is appended to a StringBuilder (sb) to represent the routing configuration.
    // The routing options are:
    // 1. If FilterSplit is true and DynToChannelOut is true, the order is FLTR -> EQ -> DYN.
    // 2. If FilterSplit is true and DynToChannelOut is false, the order is FLTR -> DYN -> EQ.
    // 3. If FilterSplit is false, the default order is DYN -> FLTR -> EQ.
    //wavesSSLChannel.FilterSplit;
    uadSSLChannel.CompIn = wavesSSLChannel.DynToByPass ? 0 : 1;
    uadSSLChannel.DynIn = wavesSSLChannel.DynToByPass ? 0 : 1;
    uadSSLChannel.PreDyn = wavesSSLChannel.DynToChannelOut ? 1 : 0;

    uadSSLChannel.LFBell = wavesSSLChannel.LFTypeBell ? 1 : 0;
    uadSSLChannel.LFGain = uadSSLChannel.findClosestValue(
      "LF Gain",
      wavesSSLChannel.LFGain
    );
    uadSSLChannel.LFFreq = uadSSLChannel.findClosestValue(
      "LF Freq",
      wavesSSLChannel.LFFrq
    );

    uadSSLChannel.LMFGain = uadSSLChannel.findClosestValue(
      "LMF Gain",
      wavesSSLChannel.LMFGain
    );
    uadSSLChannel.LMFFreq = uadSSLChannel.findClosestValue(
      "LMF Freq",
      wavesSSLChannel.LMFFrq * 1000
    );
    uadSSLChannel.LMFQ = uadSSLChannel.findClosestValue(
      "LMF Q",
      wavesSSLChannel.LMFQ
    );

    uadSSLChannel.HMFGain = uadSSLChannel.findClosestValue(
      "HMF Gain",
      wavesSSLChannel.HMFGain
    );
    uadSSLChannel.HMFFreq = uadSSLChannel.findClosestValue(
      "HMF Freq",
      wavesSSLChannel.HMFFrq * 1000
    );
    uadSSLChannel.HMFQ = uadSSLChannel.findClosestValue(
      "HMF Q",
      wavesSSLChannel.HMFQ
    );

    uadSSLChannel.HFBell = wavesSSLChannel.HFTypeBell ? 1 : 0;
    uadSSLChannel.HFGain = uadSSLChannel.findClosestValue(
      "HF Gain",
      wavesSSLChannel.HFGain
    );
    uadSSLChannel.HFFreq = uadSSLChannel.findClosestValue(
      "HF Freq",
      wavesSSLChannel.HFFrq * 1000
    );

    uadSSLChannel.EQIn = wavesSSLChannel.EQToBypass ? 0 : 1;
    uadSSLChannel.EQDynSC = wavesSSLChannel.EQToDynSC ? 1 : 0;

    uadSSLChannel.HPFreq = uadSSLChannel.findClosestValue(
      "HP Freq",
      wavesSSLChannel.HPFrq
    );
    if (wavesSSLChannel.LPFrq === 30) {
      uadSSLChannel.LPFreq = 0;
    } else {
      uadSSLChannel.LPFreq = uadSSLChannel.findClosestValue(
        "LP Freq",
        wavesSSLChannel.LPFrq * 1000
      );
    }

    uadSSLChannel.Output = uadSSLChannel.findClosestValue(
      "Output",
      wavesSSLChannel.Gain
    );
    //wavesSSLChannel.Analog;
    //wavesSSLChannel.VUShowOutput;
    uadSSLChannel.Phase = wavesSSLChannel.PhaseReverse ? 1 : 0;
    uadSSLChannel.Input = uadSSLChannel.findClosestValue(
      "Input",
      wavesSSLChannel.InputTrim
    );

    uadSSLChannel.EQType = 0.0; // Black EQ Type
    uadSSLChannel.StereoLink = 1.0;
    uadSSLChannel.Power = 1.0;

    return uadSSLChannel;
  },

  outputFormats: [
    {
      formatId: "vstpreset",
      extension: ".vstpreset",
      displayName: "VSTPreset",
      convert(preset: WavesSSLChannel) {
        const result = WavesSSLChannelToUADSSLChannel.convertBase(preset);
        return result.write();
      },
    },
  ],
};
