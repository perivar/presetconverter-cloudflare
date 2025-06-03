import { SSLNativeChannel } from "../preset/SSLNativeChannel";
import { WavesSSLChannel } from "../preset/WavesSSLChannel";
import { MultiFormatConverter } from "./MultiFormatConverter";

export const WavesSSLChannelToSSLNativeChannel: MultiFormatConverter<
  WavesSSLChannel,
  SSLNativeChannel
> = {
  from: "WavesSSLChannel",
  to: "SSLNativeChannel",
  displayName: "SSL Native Channel",

  convertBase(wavesSSLChannel: WavesSSLChannel) {
    const sslNativeChannel = new SSLNativeChannel();

    sslNativeChannel.PresetName = wavesSSLChannel.PresetName;

    sslNativeChannel.HighPassFreq = wavesSSLChannel.HPFrq;
    sslNativeChannel.LowPassFreq = wavesSSLChannel.LPFrq;

    sslNativeChannel.CompThreshold = wavesSSLChannel.CompThreshold;
    sslNativeChannel.CompRatio = wavesSSLChannel.CompRatio;
    sslNativeChannel.CompRelease = wavesSSLChannel.CompRelease;
    sslNativeChannel.CompFastAttack = wavesSSLChannel.CompFastAttack;
    sslNativeChannel.CompMix = 100;
    sslNativeChannel.CompPeak = 0;

    sslNativeChannel.GateDisabledExpEnabled =
      !wavesSSLChannel.ExpDisabledGateEnabled;

    sslNativeChannel.GateThreshold = wavesSSLChannel.ExpThreshold;
    sslNativeChannel.GateRange = wavesSSLChannel.ExpRange;
    sslNativeChannel.GateHold = 0.25;
    sslNativeChannel.GateFastAttack = wavesSSLChannel.ExpFastAttack;
    sslNativeChannel.GateRelease = wavesSSLChannel.ExpRelease;

    sslNativeChannel.DynamicsPreEq = !wavesSSLChannel.DynToChannelOut;
    sslNativeChannel.FiltersToInput = wavesSSLChannel.FilterSplit;

    sslNativeChannel.DynamicsIn = !wavesSSLChannel.DynToByPass;
    sslNativeChannel.FiltersToSidechain = false;

    sslNativeChannel.EqE = true;
    sslNativeChannel.EqIn = !wavesSSLChannel.EQToBypass;
    sslNativeChannel.EqToSidechain = wavesSSLChannel.EQToDynSC;

    sslNativeChannel.LowEqBell = wavesSSLChannel.LFTypeBell;
    sslNativeChannel.LowEqGain = wavesSSLChannel.LFGain;
    sslNativeChannel.LowEqFreq = wavesSSLChannel.LFFrq;

    sslNativeChannel.LowMidEqGain = wavesSSLChannel.LMFGain;
    sslNativeChannel.LowMidEqFreq = wavesSSLChannel.LMFFrq;
    sslNativeChannel.LowMidEqQ = wavesSSLChannel.LMFQ;

    sslNativeChannel.HighMidEqGain = wavesSSLChannel.HMFGain;
    sslNativeChannel.HighMidEqFreq = wavesSSLChannel.HMFFrq;
    sslNativeChannel.HighMidEqQ = wavesSSLChannel.HMFQ;

    sslNativeChannel.HighEqBell = wavesSSLChannel.HFTypeBell;
    sslNativeChannel.HighEqGain = wavesSSLChannel.HFGain;
    sslNativeChannel.HighEqFreq = wavesSSLChannel.HFFrq;

    sslNativeChannel.Bypass = false;
    sslNativeChannel.InputTrim = wavesSSLChannel.InputTrim;
    sslNativeChannel.OutputTrim = wavesSSLChannel.Gain;
    sslNativeChannel.Pan = 0;
    sslNativeChannel.PhaseInvert = wavesSSLChannel.PhaseReverse;
    sslNativeChannel.SidechainListen = false;
    sslNativeChannel.UseExternalKey = false;
    sslNativeChannel.Width = 100;
    sslNativeChannel.HighQuality = false;

    return sslNativeChannel;
  },

  outputFormats: [
    {
      formatId: "vstpreset",
      extension: ".vstpreset",
      displayName: "VSTPreset",
      convert(preset: WavesSSLChannel) {
        const result = WavesSSLChannelToSSLNativeChannel.convertBase(preset);
        return result.write();
      },
    },
  ],
};
