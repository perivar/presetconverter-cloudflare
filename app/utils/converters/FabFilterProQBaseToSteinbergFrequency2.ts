import {
  ProQChannelMode,
  ProQLPHPSlope,
  ProQShape,
  ProQStereoPlacement,
} from "../preset/FabFilterProQ";
import {
  ProQ2ChannelMode,
  ProQ2Shape,
  ProQ2Slope,
  ProQ2StereoPlacement,
} from "../preset/FabFilterProQ2";
import {
  ProQ3Shape,
  ProQ3Slope,
  ProQ3StereoPlacement,
} from "../preset/FabFilterProQ3";
import { FabFilterProQBase } from "../preset/FabFilterProQBase";
import {
  FrequencyBandMode1And8,
  FrequencyBandMode2To7,
  FrequencyChannelMode,
} from "../preset/SteinbergFrequency";
import { SteinbergFrequency2 } from "../preset/SteinbergFrequency2";
import { VstPreset } from "../preset/VstPreset";
import { MultiFormatConverter } from "./MultiFormatConverter";

export const FabFilterProQBaseToSteinbergFrequency2: MultiFormatConverter<
  FabFilterProQBase,
  SteinbergFrequency2
> = {
  from: "FabFilterProQBase", // this gets overridden during registration
  to: "SteinbergFrequency2",
  displayName: "Steinberg Frequency2",

  convertBase(eq: FabFilterProQBase) {
    const frequency = new SteinbergFrequency2();

    // Frequency only supports lowcut on the 1st band and highcut on the 8th band
    const hasLowCutBand = eq.Bands.some(band => isLowCut((band as Band).Shape));
    const hasHighCutBand = eq.Bands.some(band =>
      isHighCut((band as Band).Shape)
    );

    // get remaining bands that are not lowcut or highcut and sort by frequency
    const band2To7 = eq.Bands.filter(band => {
      const shape = (band as Band).Shape;
      return !isLowCut(shape) && !isHighCut(shape);
    }).sort((a, b) => a.Frequency - b.Frequency);

    if (hasLowCutBand) {
      const lowCutBand = eq.Bands.filter(band =>
        isLowCut((band as Band).Shape)
      ).sort((a, b) => a.Frequency - b.Frequency)[0];

      if (lowCutBand) {
        setBand(lowCutBand as Band, 1, frequency);
      }
    }

    if (hasHighCutBand) {
      const highCutBand = eq.Bands.filter(band =>
        isHighCut((band as Band).Shape)
      ).sort((a, b) => b.Frequency - a.Frequency)[0];

      if (highCutBand) {
        setBand(highCutBand as Band, 8, frequency);
      }
    }

    // rest of the bands (2-7)
    const startIndex = hasLowCutBand ? 2 : 1;
    const endIndex = hasHighCutBand ? 7 : 8;

    for (
      let bandNumber = startIndex, index = 0;
      bandNumber <= endIndex && index < band2To7.length;
      bandNumber++, index++
    ) {
      const band = band2To7[index];
      if (band) {
        setBand(band as Band, bandNumber, frequency);
      }
    }

    return frequency;
  },

  outputFormats: [
    {
      formatId: "vstpreset",
      extension: ".vstpreset",
      displayName: "VSTPreset",
      convert(preset: FabFilterProQBase) {
        const result =
          FabFilterProQBaseToSteinbergFrequency2.convertBase(preset);
        return result.write();
      },
    },
  ],
};

export type Shape = ProQShape | ProQ2Shape | ProQ3Shape;
export type Slope = ProQLPHPSlope | ProQ2Slope | ProQ3Slope;
export type StereoPlacement =
  | ProQStereoPlacement
  | ProQ2StereoPlacement
  | ProQ3StereoPlacement;
export type ChannelModeType = ProQChannelMode | ProQ2ChannelMode;

export interface Band {
  Enabled: boolean;
  Shape: Shape;
  Frequency: number;
  Gain: number;
  Q: number;
  StereoPlacement: StereoPlacement;
  LPHPSlope?: ProQLPHPSlope;
  Slope?: ProQ2Slope | ProQ3Slope;
  ChannelMode?: ChannelModeType;
}

// Helper function to check if a shape is a low cut filter
export function isLowCut(shape: Shape): boolean {
  return (
    shape === ProQShape.LowCut ||
    shape === ProQ2Shape.LowCut ||
    shape === ProQ3Shape.LowCut
  );
}

// Helper function to check if a shape is a high cut filter
export function isHighCut(shape: Shape): boolean {
  return (
    shape === ProQShape.HighCut ||
    shape === ProQ2Shape.HighCut ||
    shape === ProQ3Shape.HighCut
  );
}

// Helper function to check if a shape is a peak-type filter (including bell, bandpass, and tilt shelf)
export function isPeakType(shape: Shape): boolean {
  return (
    shape === ProQShape.Bell ||
    shape === ProQ2Shape.Bell ||
    shape === ProQ3Shape.Bell ||
    shape === ProQ2Shape.BandPass ||
    shape === ProQ2Shape.TiltShelf ||
    shape === ProQ3Shape.BandPass ||
    shape === ProQ3Shape.TiltShelf
  );
}

// Helper function to check if a shape is a low shelf filter
export function isLowShelf(shape: Shape): boolean {
  return (
    shape === ProQShape.LowShelf ||
    shape === ProQ2Shape.LowShelf ||
    shape === ProQ3Shape.LowShelf
  );
}

// Helper function to check if a shape is a high shelf filter
export function isHighShelf(shape: Shape): boolean {
  return (
    shape === ProQShape.HighShelf ||
    shape === ProQ2Shape.HighShelf ||
    shape === ProQ3Shape.HighShelf
  );
}

// Helper function to check if a shape is a notch filter
export function isNotch(shape: Shape): boolean {
  return (
    shape === ProQShape.Notch ||
    shape === ProQ2Shape.Notch ||
    shape === ProQ3Shape.Notch
  );
}

// Helper function to get the appropriate cut slope mode
export function getCutSlope(slope: Slope): FrequencyBandMode1And8 {
  if (
    slope === ProQLPHPSlope.Slope6dB_oct ||
    slope === ProQ2Slope.Slope6dB_oct ||
    slope === ProQ3Slope.Slope6dB_oct
  ) {
    return FrequencyBandMode1And8.Cut6;
  }
  if (
    slope === ProQLPHPSlope.Slope12dB_oct ||
    slope === ProQ2Slope.Slope12dB_oct ||
    slope === ProQ3Slope.Slope12dB_oct
  ) {
    return FrequencyBandMode1And8.Cut12;
  }
  if (
    slope === ProQLPHPSlope.Slope24dB_oct ||
    slope === ProQ2Slope.Slope24dB_oct ||
    slope === ProQ3Slope.Slope24dB_oct
  ) {
    return FrequencyBandMode1And8.Cut24;
  }
  if (
    slope === ProQLPHPSlope.Slope48dB_oct ||
    slope === ProQ2Slope.Slope48dB_oct ||
    slope === ProQ3Slope.Slope48dB_oct
  ) {
    return FrequencyBandMode1And8.Cut48;
  }

  // Handle steeper slopes from Pro-Q2/3
  if (
    slope === ProQ2Slope.Slope72dB_oct ||
    slope === ProQ3Slope.Slope72dB_oct ||
    slope === ProQ2Slope.Slope96dB_oct ||
    slope === ProQ3Slope.Slope96dB_oct
  ) {
    return FrequencyBandMode1And8.Cut96;
  }

  return FrequencyBandMode1And8.Cut48; // Default to 48dB/oct
}

function setBandParameter(
  frequency: SteinbergFrequency2,
  bandNumber: number,
  channel: string,
  param: string,
  value: number
): void {
  frequency.setNumberParameter(
    `${VstPreset.CHUNK_COMP}equalizerA${param}${bandNumber}${channel}`,
    value
  );
}

export function setBand(
  band: Band,
  bandNumber: number,
  frequency: SteinbergFrequency2
): void {
  setBandParameter(
    frequency,
    bandNumber,
    "",
    "bandon",
    band.Enabled ? 1.0 : 0.0
  );
  let channel = "";

  // due to the way fabfilter have only one stereo placement per band (frequency has two) we need to modify both channels in frequency
  // we could have in theory instead updated both channels per band in frequency
  const isStandardStereo =
    band.StereoPlacement === ProQStereoPlacement.Stereo ||
    band.StereoPlacement === ProQ2StereoPlacement.Stereo ||
    band.StereoPlacement === ProQ3StereoPlacement.Stereo;

  if (!isStandardStereo) {
    const isLeft =
      band.StereoPlacement === ProQStereoPlacement.LeftOrMid ||
      band.StereoPlacement === ProQ2StereoPlacement.LeftOrMid ||
      band.StereoPlacement === ProQ3StereoPlacement.Left ||
      band.StereoPlacement === ProQ3StereoPlacement.Mid;

    setBandParameter(frequency, bandNumber, "", "on", isLeft ? 1.0 : 0.0);
    setBandParameter(frequency, bandNumber, "Ch2", "on", isLeft ? 0.0 : 1.0);

    if (!isLeft) {
      channel = "Ch2";
    }

    const isMidSide =
      band.ChannelMode === ProQChannelMode.MidSide ||
      band.ChannelMode === ProQ2ChannelMode.MidSide;

    setBandParameter(
      frequency,
      bandNumber,
      "",
      "editchannel",
      isLeft
        ? isMidSide
          ? FrequencyChannelMode.MidSideModeMid
          : FrequencyChannelMode.LeftRightModeLeft
        : isMidSide
          ? FrequencyChannelMode.MidSideModeSide
          : FrequencyChannelMode.LeftRightModeRight
    );
  }

  // Set basic parameters
  setBandParameter(frequency, bandNumber, channel, "gain", band.Gain);
  setBandParameter(frequency, bandNumber, channel, "freq", band.Frequency);
  setBandParameter(frequency, bandNumber, channel, "q", band.Q);

  const shape = band.Shape;
  if (bandNumber === 1 || bandNumber === 8) {
    handleBand1And8Shape(shape, band, bandNumber, channel, frequency);
  } else {
    handleBand2To7Shape(shape, bandNumber, channel, frequency);
  }
}

function handleBand1And8Shape(
  shape: Shape,
  band: Band,
  bandNumber: number,
  channel: string,
  frequency: SteinbergFrequency2
): void {
  const type = isPeakType(shape)
    ? FrequencyBandMode1And8.Peak
    : isLowShelf(shape)
      ? FrequencyBandMode1And8.LowShelf
      : isHighShelf(shape)
        ? FrequencyBandMode1And8.HighShelf
        : isNotch(shape)
          ? FrequencyBandMode1And8.Notch
          : (isLowCut(shape) || isHighCut(shape)) && band.Slope
            ? getCutSlope(band.Slope)
            : null;

  if (type !== null) {
    setBandParameter(frequency, bandNumber, channel, "type", type);
  }
}

function handleBand2To7Shape(
  shape: Shape,
  bandNumber: number,
  channel: string,
  frequency: SteinbergFrequency2
): void {
  const type = isPeakType(shape)
    ? FrequencyBandMode2To7.Peak
    : isLowShelf(shape)
      ? FrequencyBandMode2To7.LowShelf
      : isHighShelf(shape)
        ? FrequencyBandMode2To7.HighShelf
        : isNotch(shape)
          ? FrequencyBandMode2To7.Notch
          : null;

  if (type !== null) {
    setBandParameter(frequency, bandNumber, channel, "type", type);
  }
}
