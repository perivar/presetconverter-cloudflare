import {
  GenericEQBand,
  GenericEQPreset,
  GenericEQShape,
  GenericEQSlope,
  GenericEQStereoPlacement,
} from "../preset/GenericEQPreset";
import { UADSSLChannel } from "../preset/UADSSLChannel";
import { MultiFormatConverter } from "./MultiFormatConverter";

export const UADSSLChannelToGenericEQ: MultiFormatConverter<
  UADSSLChannel,
  GenericEQPreset
> = {
  from: "UADSSLChannel",
  to: "GenericEQPreset",
  displayName: "Generic EQ Preset",

  convertBase(preset: UADSSLChannel) {
    const genericEQPreset = new GenericEQPreset(
      preset.presetName || "UAD SSL Channel Preset",
      [],
      "1", // Version is not available
      preset.PlugInVendor
    );

    // High Pass Filter
    // UAD SSL HPFreq is 0-1, where 0 is "Out" and >0 is frequency.
    // Need to use findClosestParameterValue to get the actual frequency in Hz.
    const hpFreqValueRaw = preset.findClosestParameterValue(
      "HP Freq",
      preset.HPFreq
    );
    const hpFreqValue =
      typeof hpFreqValueRaw === "number" ? hpFreqValueRaw : 20;
    genericEQPreset.Bands.push(
      new GenericEQBand(
        typeof hpFreqValueRaw === "number",
        hpFreqValue,
        0, // HP filter usually has 0 gain
        0.707, // Default Q for filters
        GenericEQShape.LowCut,
        GenericEQSlope.Slope18dB_oct, // Common slope for SSL HPF
        GenericEQStereoPlacement.Stereo
      )
    );

    // Low Pass Filter
    // UAD SSL LPFreq is 0-1, where 0 is "Out" and >0 is frequency.
    // Need to use findClosestParameterValue to get the actual frequency in kHz.
    const lpFreqValueRaw = preset.findClosestParameterValue(
      "LP Freq",
      preset.LPFreq
    );
    const lpFreqValue =
      typeof lpFreqValueRaw === "number" ? lpFreqValueRaw : 35000;
    genericEQPreset.Bands.push(
      new GenericEQBand(
        typeof lpFreqValueRaw === "number",
        lpFreqValue,
        0, // LP filter usually has 0 gain
        0.707, // Default Q for filters
        GenericEQShape.HighCut,
        GenericEQSlope.Slope12dB_oct, // Common slope for SSL LPF
        GenericEQStereoPlacement.Stereo
      )
    );

    // Low Frequency EQ
    const lfGainValue = preset.findClosestParameterValue(
      "LF Gain",
      preset.LFGain
    ) as number;
    const lfFreqValue = preset.findClosestParameterValue(
      "LF Freq",
      preset.LFFreq
    ) as number;
    genericEQPreset.Bands.push(
      new GenericEQBand(
        true,
        lfFreqValue,
        lfGainValue,
        0.707, // Default Q for shelves
        preset.LFBell === 1 ? GenericEQShape.Bell : GenericEQShape.LowShelf,
        GenericEQSlope.Slope24dB_oct, // Default slope
        GenericEQStereoPlacement.Stereo
      )
    );

    // Low Mid Frequency EQ
    const lmfGainValue = preset.findClosestParameterValue(
      "LMF Gain",
      preset.LMFGain
    ) as number;
    const lmfFreqValue = preset.findClosestParameterValue(
      "LMF Freq",
      preset.LMFFreq
    ) as number;
    genericEQPreset.Bands.push(
      new GenericEQBand(
        true,
        lmfFreqValue,
        lmfGainValue,
        preset.findClosestParameterValue("LMF Q", preset.LMFQ) as number,
        GenericEQShape.Bell,
        GenericEQSlope.Slope24dB_oct, // Default slope
        GenericEQStereoPlacement.Stereo
      )
    );

    // High Mid Frequency EQ
    const hmfGainValue = preset.findClosestParameterValue(
      "HMF Gain",
      preset.HMFGain
    ) as number;
    const hmfFreqValue = preset.findClosestParameterValue(
      "HMF Freq",
      preset.HMFFreq
    ) as number;
    genericEQPreset.Bands.push(
      new GenericEQBand(
        true,
        hmfFreqValue,
        hmfGainValue,
        preset.findClosestParameterValue("HMF Q", preset.HMFQ) as number,
        GenericEQShape.Bell,
        GenericEQSlope.Slope24dB_oct, // Default slope
        GenericEQStereoPlacement.Stereo
      )
    );

    // High Frequency EQ
    const hfGainValue = preset.findClosestParameterValue(
      "HF Gain",
      preset.HFGain
    ) as number;
    const hfFreqValue = preset.findClosestParameterValue(
      "HF Freq",
      preset.HFFreq
    ) as number;
    genericEQPreset.Bands.push(
      new GenericEQBand(
        true,
        hfFreqValue,
        hfGainValue,
        0.707, // Default Q for shelves
        preset.HFBell === 1 ? GenericEQShape.Bell : GenericEQShape.HighShelf,
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
      convert(preset: UADSSLChannel) {
        const result = UADSSLChannelToGenericEQ.convertBase(preset);
        return result.toString();
      },
    },
  ],
};
