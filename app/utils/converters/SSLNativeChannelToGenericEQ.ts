import {
  GenericEQBand,
  GenericEQPreset,
  GenericEQShape,
  GenericEQSlope,
  GenericEQStereoPlacement,
} from "../preset/GenericEQPreset";
import { SSLNativeChannel } from "../preset/SSLNativeChannel";
import { MultiFormatConverter } from "./MultiFormatConverter";

export const SSLNativeChannelToGenericEQ: MultiFormatConverter<
  SSLNativeChannel,
  GenericEQPreset
> = {
  from: "SSLNativeChannel",
  to: "GenericEQPreset",
  displayName: "Generic EQ Preset",

  convertBase(preset: SSLNativeChannel) {
    const genericEQPreset = new GenericEQPreset(
      preset.PresetName || "SSL Native Channel Preset",
      [],
      preset.PresetVersion,
      preset.PlugInVendor
    );

    // High Pass Filter
    genericEQPreset.Bands.push(
      new GenericEQBand(
        preset.HighPassFreq > 20,
        preset.HighPassFreq > 20 ? preset.HighPassFreq : 20,
        0, // HP filter usually has 0 gain
        0.707, // Default Q for filters
        GenericEQShape.LowCut,
        GenericEQSlope.Slope18dB_oct, // SSL Native HP is 18 dB/octave
        GenericEQStereoPlacement.Stereo
      )
    );

    // Low Pass Filter
    genericEQPreset.Bands.push(
      new GenericEQBand(
        preset.LowPassFreq < 35,
        preset.LowPassFreq > 35 ? preset.LowPassFreq * 1000 : 35000, // KHz to Hz
        0, // LP filter usually has 0 gain
        0.707, // Default Q for filters
        GenericEQShape.HighCut,
        GenericEQSlope.Slope12dB_oct, // SSL Native LP is 12 dB/octave
        GenericEQStereoPlacement.Stereo
      )
    );

    // Low Frequency EQ
    genericEQPreset.Bands.push(
      new GenericEQBand(
        true,
        preset.LowEqFreq,
        preset.LowEqGain,
        0.707, // Default Q for shelves
        preset.LowEqBell ? GenericEQShape.Bell : GenericEQShape.LowShelf,
        GenericEQSlope.Slope24dB_oct, // Default slope
        GenericEQStereoPlacement.Stereo
      )
    );

    // Low Mid Frequency EQ
    genericEQPreset.Bands.push(
      new GenericEQBand(
        true,
        preset.LowMidEqFreq * 1000, // KHz to Hz
        preset.LowMidEqGain,
        preset.LowMidEqQ,
        GenericEQShape.Bell,
        GenericEQSlope.Slope24dB_oct, // Default slope
        GenericEQStereoPlacement.Stereo
      )
    );

    // High Mid Frequency EQ
    genericEQPreset.Bands.push(
      new GenericEQBand(
        true,
        preset.HighMidEqFreq * 1000, // KHz to Hz
        preset.HighMidEqGain,
        preset.HighMidEqQ,
        GenericEQShape.Bell,
        GenericEQSlope.Slope24dB_oct, // Default slope
        GenericEQStereoPlacement.Stereo
      )
    );

    // High Frequency EQ
    genericEQPreset.Bands.push(
      new GenericEQBand(
        true,
        preset.HighEqFreq * 1000, // KHz to Hz
        preset.HighEqGain,
        0.707, // Default Q for shelves
        preset.HighEqBell ? GenericEQShape.Bell : GenericEQShape.HighShelf,
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
      convert(preset: SSLNativeChannel) {
        const result = SSLNativeChannelToGenericEQ.convertBase(preset);
        return result.toString();
      },
    },
  ],
};
