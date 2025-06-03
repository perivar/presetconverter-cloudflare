import {
  GenericEQBand,
  GenericEQPreset,
  GenericEQShape,
  GenericEQSlope,
  GenericEQStereoPlacement,
} from "../preset/GenericEQPreset";
import { WavesSSLChannel } from "../preset/WavesSSLChannel";
import { MultiFormatConverter } from "./MultiFormatConverter";

export const WavesSSLChannelToGenericEQ: MultiFormatConverter<
  WavesSSLChannel,
  GenericEQPreset
> = {
  from: "WavesSSLChannel",
  to: "GenericEQPreset",
  displayName: "Generic EQ Preset",

  convertBase(preset: WavesSSLChannel) {
    const genericEQPreset = new GenericEQPreset(
      preset.PresetName || "Waves SSLChannel Preset",
      [],
      "1", // Version is not available
      preset.PlugInVendor
    );

    // High Pass Filter
    genericEQPreset.Bands.push(
      new GenericEQBand(
        preset.HPFrq > 0,
        preset.HPFrq > 0 ? preset.HPFrq : 20,
        0, // HP filter usually has 0 gain
        0.707, // Default Q for filters
        GenericEQShape.LowCut,
        GenericEQSlope.Slope18dB_oct, // Waves SSLChannel HP is 18 dB/octave
        GenericEQStereoPlacement.Stereo
      )
    );

    // Low Pass Filter
    genericEQPreset.Bands.push(
      new GenericEQBand(
        preset.LPFrq < 30,
        preset.LPFrq < 30 ? preset.LPFrq * 1000 : 30000, // KHz to Hz
        0, // LP filter usually has 0 gain
        0.707, // Default Q for filters
        GenericEQShape.HighCut,
        GenericEQSlope.Slope12dB_oct, // Waves SSLChannel LP is 12 dB/octave
        GenericEQStereoPlacement.Stereo
      )
    );

    // Low Frequency EQ
    genericEQPreset.Bands.push(
      new GenericEQBand(
        true,
        preset.LFFrq,
        preset.LFGain,
        0.707, // Default Q for shelves
        preset.LFTypeBell ? GenericEQShape.Bell : GenericEQShape.LowShelf,
        GenericEQSlope.Slope24dB_oct, // Default slope
        GenericEQStereoPlacement.Stereo
      )
    );

    // Low Mid Frequency EQ
    genericEQPreset.Bands.push(
      new GenericEQBand(
        true,
        preset.LMFFrq * 1000, // KHz to Hz
        preset.LMFGain,
        preset.LMFQ,
        GenericEQShape.Bell,
        GenericEQSlope.Slope24dB_oct, // Default slope
        GenericEQStereoPlacement.Stereo
      )
    );

    // High Mid Frequency EQ
    genericEQPreset.Bands.push(
      new GenericEQBand(
        true,
        preset.HMFFrq * 1000, // KHz to Hz
        preset.HMFGain,
        preset.HMFQ,
        GenericEQShape.Bell,
        GenericEQSlope.Slope24dB_oct, // Default slope
        GenericEQStereoPlacement.Stereo
      )
    );

    // High Frequency EQ
    genericEQPreset.Bands.push(
      new GenericEQBand(
        true,
        preset.HFFrq * 1000, // KHz to Hz
        preset.HFGain,
        0.707, // Default Q for shelves
        preset.HFTypeBell ? GenericEQShape.Bell : GenericEQShape.HighShelf,
        GenericEQSlope.Slope24dB_oct, // Default slope
        GenericEQStereoPlacement.Stereo
      )
    );

    genericEQPreset.Bands.sort((a, b) => a.Frequency - b.Frequency);
    return genericEQPreset;
  },

  outputFormats: [
    {
      formatId: "text",
      extension: ".txt",
      displayName: "Text",
      convert(preset: WavesSSLChannel) {
        const result = WavesSSLChannelToGenericEQ.convertBase(preset);
        return result.toString();
      },
    },
  ],
};
