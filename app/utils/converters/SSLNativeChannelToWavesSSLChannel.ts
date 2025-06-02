import { SSLNativeChannel } from "../preset/SSLNativeChannel";
import { WavesSSLChannel } from "../preset/WavesSSLChannel";
import { MultiFormatConverter } from "./MultiFormatConverter";

export const SSLNativeChannelToWavesSSLChannel: MultiFormatConverter<
  SSLNativeChannel,
  WavesSSLChannel
> = {
  from: "SSLNativeChannel",
  to: "WavesSSLChannel",
  displayName: "Waves SSL Channel",

  convertBase(sslNativeChannel: SSLNativeChannel) {
    const wavesSSLChannel = new WavesSSLChannel();

    wavesSSLChannel.PresetName = sslNativeChannel.PresetName;

    wavesSSLChannel.HPFrq = sslNativeChannel.HighPassFreq;
    wavesSSLChannel.LPFrq = sslNativeChannel.LowPassFreq;

    wavesSSLChannel.CompThreshold = sslNativeChannel.CompThreshold;
    wavesSSLChannel.CompRatio = sslNativeChannel.CompRatio;
    wavesSSLChannel.CompRelease = sslNativeChannel.CompRelease;
    wavesSSLChannel.CompFastAttack = sslNativeChannel.CompFastAttack;

    wavesSSLChannel.ExpDisabledGateEnabled =
      !sslNativeChannel.GateDisabledExpEnabled;
    wavesSSLChannel.ExpThreshold = sslNativeChannel.GateThreshold;
    wavesSSLChannel.ExpRange = sslNativeChannel.GateRange;
    wavesSSLChannel.ExpRelease = sslNativeChannel.GateRelease;
    wavesSSLChannel.ExpFastAttack = sslNativeChannel.GateFastAttack;

    wavesSSLChannel.DynToByPass = !sslNativeChannel.DynamicsIn;
    wavesSSLChannel.DynToChannelOut = !sslNativeChannel.DynamicsPreEq; // This mapping might need adjustment based on exact logic
    wavesSSLChannel.FilterSplit = sslNativeChannel.FiltersToInput;

    wavesSSLChannel.EQToBypass = !sslNativeChannel.EqIn;
    wavesSSLChannel.EQToDynSC = sslNativeChannel.EqToSidechain;

    wavesSSLChannel.LFTypeBell = sslNativeChannel.LowEqBell;
    wavesSSLChannel.LFGain = sslNativeChannel.LowEqGain;
    wavesSSLChannel.LFFrq = sslNativeChannel.LowEqFreq;

    wavesSSLChannel.LMFGain = sslNativeChannel.LowMidEqGain;
    wavesSSLChannel.LMFFrq = sslNativeChannel.LowMidEqFreq;
    wavesSSLChannel.LMFQ = sslNativeChannel.LowMidEqQ;

    wavesSSLChannel.HMFGain = sslNativeChannel.HighMidEqGain;
    wavesSSLChannel.HMFFrq = sslNativeChannel.HighMidEqFreq;
    wavesSSLChannel.HMFQ = sslNativeChannel.HighMidEqQ;

    wavesSSLChannel.HFTypeBell = sslNativeChannel.HighEqBell;
    wavesSSLChannel.HFGain = sslNativeChannel.HighEqGain;
    wavesSSLChannel.HFFrq = sslNativeChannel.HighEqFreq;

    wavesSSLChannel.InputTrim = sslNativeChannel.InputTrim;
    wavesSSLChannel.Gain = sslNativeChannel.OutputTrim;
    wavesSSLChannel.PhaseReverse = sslNativeChannel.PhaseInvert;

    // Default values for WavesSSLChannel that are not directly mapped from SSLNativeChannel
    wavesSSLChannel.Analog = false;
    wavesSSLChannel.VUShowOutput = false;

    return wavesSSLChannel;
  },

  outputFormats: [
    {
      formatId: "vstpreset",
      extension: ".vstpreset",
      displayName: "Steinberg VSTPreset",
      convert(preset: SSLNativeChannel) {
        const result = SSLNativeChannelToWavesSSLChannel.convertBase(preset);
        return result.write();
      },
    },
  ],
};
