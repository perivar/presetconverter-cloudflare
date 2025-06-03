import {
  GenericEQBand,
  GenericEQPreset,
  GenericEQShape,
  GenericEQSlope,
  GenericEQStereoPlacement,
} from "../preset/GenericEQPreset";
import {
  FrequencyBandMode1And8,
  FrequencyBandMode2To7,
  FrequencyChannelMode,
  SteinbergFrequency,
} from "../preset/SteinbergFrequency";
import { MultiFormatConverter } from "./MultiFormatConverter";

function convertSteinbergShapeAndSlope(
  bandNum: number,
  type: number
): { shape: GenericEQShape; slope: GenericEQSlope } {
  let shape: GenericEQShape = GenericEQShape.Bell; // Default
  let slope: GenericEQSlope = GenericEQSlope.Slope12dB_oct; // Default slope for shelves/cuts

  if (bandNum === 1 || bandNum === 8) {
    const mode = type as FrequencyBandMode1And8;
    const isLowCut = bandNum === 1; // Assume band 1 is Low Cut, band 8 is High Cut for Cut types
    switch (mode) {
      case FrequencyBandMode1And8.Cut6:
        shape = isLowCut ? GenericEQShape.LowCut : GenericEQShape.HighCut;
        slope = GenericEQSlope.Slope6dB_oct;
        break;
      case FrequencyBandMode1And8.Cut12:
        shape = isLowCut ? GenericEQShape.LowCut : GenericEQShape.HighCut;
        slope = GenericEQSlope.Slope12dB_oct;
        break;
      case FrequencyBandMode1And8.Cut24:
        shape = isLowCut ? GenericEQShape.LowCut : GenericEQShape.HighCut;
        slope = GenericEQSlope.Slope24dB_oct;
        break;
      case FrequencyBandMode1And8.Cut48:
        shape = isLowCut ? GenericEQShape.LowCut : GenericEQShape.HighCut;
        slope = GenericEQSlope.Slope48dB_oct;
        break;
      case FrequencyBandMode1And8.Cut96:
        shape = isLowCut ? GenericEQShape.LowCut : GenericEQShape.HighCut;
        slope = GenericEQSlope.Slope96dB_oct;
        break;
      case FrequencyBandMode1And8.LowShelf:
        shape = GenericEQShape.LowShelf;
        // Slope might be implicitly 12dB/oct for Steinberg shelves? Use default.
        break;
      case FrequencyBandMode1And8.Peak:
        shape = GenericEQShape.Bell;
        // Slope not applicable for Bell
        break;
      case FrequencyBandMode1And8.HighShelf:
        shape = GenericEQShape.HighShelf;
        // Slope might be implicitly 12dB/oct. Use default.
        break;
      case FrequencyBandMode1And8.Notch:
        shape = GenericEQShape.Notch;
        // Slope not applicable for Notch
        break;
      default:
        shape = GenericEQShape.Bell; // Fallback
        break;
    }
  } else {
    // Bands 2-7
    const mode = type as FrequencyBandMode2To7;
    switch (mode) {
      case FrequencyBandMode2To7.LowShelf:
        shape = GenericEQShape.LowShelf;
        break;
      case FrequencyBandMode2To7.Peak:
        shape = GenericEQShape.Bell;
        break;
      case FrequencyBandMode2To7.HighShelf:
        shape = GenericEQShape.HighShelf;
        break;
      case FrequencyBandMode2To7.Notch:
        shape = GenericEQShape.Notch;
        break;
      default:
        shape = GenericEQShape.Bell; // Fallback
        break;
    }
    // Slope not directly applicable or defined for these types in Steinberg Frequency
  }

  // Assign slope only if shape is Cut/Shelf, otherwise use a default/null?
  if (
    shape !== GenericEQShape.LowCut &&
    shape !== GenericEQShape.HighCut &&
    shape !== GenericEQShape.LowShelf &&
    shape !== GenericEQShape.HighShelf
  ) {
    // For Bell, Notch, etc., slope isn't typically defined in this way.
    // Assigning a default might be misleading. Let's use the default Slope12dB_oct for now,
    // but this could be refined to `undefined` or a specific 'None' value if added to GenericEQSlope.
    // slope = undefined; // Or keep default? Let's keep default for now.
  }

  return { shape, slope };
}

export const SteinbergFrequencyToGenericEQ: MultiFormatConverter<
  SteinbergFrequency,
  GenericEQPreset
> = {
  from: "SteinbergFrequency",
  to: "GenericEQPreset",
  displayName: "Generic EQ Preset",

  convertBase(preset: SteinbergFrequency) {
    const result = new GenericEQPreset(
      preset.PlugInName || "Steinberg Frequency Preset",
      [], // Bands will be added later
      "1", // Steinberg Frequency doesn't expose a version easily
      preset.PlugInVendor
    );

    if (!preset.bands || preset.bands.length === 0) {
      if (
        preset.Parameters.size > 0 &&
        typeof preset.readParameters === "function"
      ) {
        preset.readParameters();
      } else if (preset.Parameters.size === 0) {
        console.warn("SteinbergFrequency preset has no parameters loaded.");
        return result;
      } else {
        console.warn(
          "SteinbergFrequency preset bands array is empty or parameters not processed into bands."
        );
      }
      if (!preset.bands || preset.bands.length === 0) {
        console.warn(
          "SteinbergFrequency bands still empty after attempting readParameters."
        );
        return result;
      }
    }

    for (let bandNum = 1; bandNum <= 8; bandNum++) {
      const steinbergBand = preset.bands[bandNum - 1];

      const channelMode = steinbergBand.shared
        .editChannel as FrequencyChannelMode;

      const isBandEnabled = steinbergBand.shared.bandOn === 1.0;

      // ignore linear phase for now
      // const isLinearPhase =
      //   preset.getNumberParameter(`linearphase${bandNum}`) === 1.0;

      // --- Process Channel 1 (Left / Mid / Stereo) ---
      const { shape: shapeCh1, slope: slopeCh1 } =
        convertSteinbergShapeAndSlope(bandNum, steinbergBand.ch1.type);

      let placementCh1 = GenericEQStereoPlacement.Stereo; // Default for StereoMode

      if (
        channelMode === FrequencyChannelMode.LeftRightModeLeft ||
        channelMode === FrequencyChannelMode.LeftRightModeRight
      ) {
        placementCh1 = GenericEQStereoPlacement.Left;
      } else if (
        channelMode === FrequencyChannelMode.MidSideModeMid ||
        channelMode === FrequencyChannelMode.MidSideModeSide
      ) {
        placementCh1 = GenericEQStereoPlacement.Mid;
      }

      if (steinbergBand.ch1.enabled === 1.0) {
        const convertedBandCh1 = new GenericEQBand(
          isBandEnabled,
          steinbergBand.ch1.freq,
          steinbergBand.ch1.gain,
          steinbergBand.ch1.q,
          shapeCh1,
          slopeCh1,
          placementCh1,
          undefined, // DynamicRange
          undefined // DynamicThreshold
        );
        result.Bands.push(convertedBandCh1);
      }

      // --- Process Channel 2 (Right / Side) ---
      if (
        channelMode !== FrequencyChannelMode.StereoMode &&
        steinbergBand.ch2.enabled === 1.0
      ) {
        const { shape: shapeCh2, slope: slopeCh2 } =
          convertSteinbergShapeAndSlope(bandNum, steinbergBand.ch2.type);

        let placementCh2 = GenericEQStereoPlacement.Right; // Default for L/R mode

        if (
          channelMode === FrequencyChannelMode.MidSideModeMid ||
          channelMode === FrequencyChannelMode.MidSideModeSide
        ) {
          placementCh2 = GenericEQStereoPlacement.Side;
        }

        const convertedBandCh2 = new GenericEQBand(
          isBandEnabled,
          steinbergBand.ch2.freq,
          steinbergBand.ch2.gain,
          steinbergBand.ch2.q,
          shapeCh2,
          slopeCh2,
          placementCh2,
          undefined, // DynamicRange
          undefined // DynamicThreshold
        );
        result.Bands.push(convertedBandCh2);
      }
    }

    return result;
  },

  outputFormats: [
    {
      formatId: "text",
      extension: ".txt",
      displayName: "Text",
      convert(preset: SteinbergFrequency) {
        const result = SteinbergFrequencyToGenericEQ.convertBase(preset);
        return result.toString();
      },
    },
  ],
};
