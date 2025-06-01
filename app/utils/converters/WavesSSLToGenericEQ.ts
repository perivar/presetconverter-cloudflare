import {
  GenericEQBand,
  GenericEQPreset,
  GenericEQShape,
  GenericEQSlope,
  GenericEQStereoPlacement,
} from "../preset/GenericEQPreset";
import { WavesSSLChannel } from "../preset/WavesSSLChannel";
import { MultiFormatConverter } from "./MultiFormatConverter";

export const WavesSSLToGenericEQ: MultiFormatConverter<
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

    // Low Pass Filter
    if (preset.LPFrq > 0) {
      genericEQPreset.Bands.push(
        new GenericEQBand(
          true,
          preset.LPFrq * 1000, // KHz to Hz
          0, // LP filter usually has 0 gain
          0.707, // Default Q for filters
          GenericEQShape.HighCut,
          GenericEQSlope.Slope12dB_oct, // Waves SSLChannel LP is 12 dB/octave
          GenericEQStereoPlacement.Stereo
        )
      );
    }

    // High Pass Filter
    if (preset.HPFrq > 0) {
      genericEQPreset.Bands.push(
        new GenericEQBand(
          true,
          preset.HPFrq,
          0, // HP filter usually has 0 gain
          0.707, // Default Q for filters
          GenericEQShape.LowCut,
          GenericEQSlope.Slope18dB_oct, // Waves SSLChannel HP is 18 dB/octave
          GenericEQStereoPlacement.Stereo
        )
      );
    }

    // Low Frequency EQ
    if (preset.LFGain !== 0) {
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
    }

    // Low Mid Frequency EQ
    if (preset.LMFGain !== 0) {
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
    }

    // High Mid Frequency EQ
    if (preset.HMFGain !== 0) {
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
    }

    // High Frequency EQ
    if (preset.HFGain !== 0) {
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
    }

    genericEQPreset.Bands.sort((a, b) => a.Frequency - b.Frequency);
    return genericEQPreset;
  },

  outputFormats: [
    {
      formatId: "txt",
      extension: ".txt",
      displayName: "Text Format",
      convert(preset: WavesSSLChannel) {
        const result = WavesSSLToGenericEQ.convertBase(preset);
        return result.toString();
      },
    },
  ],
};
