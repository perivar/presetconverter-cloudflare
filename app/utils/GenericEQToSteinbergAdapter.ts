/**
 * GenericEQToSteinbergAdapter.ts
 * Converts generic EQPreset format to Steinberg Frequency format
 */

import {
  GenericEQBand,
  GenericEQPreset,
  GenericEQShape,
  GenericEQSlope,
  GenericEQStereoPlacement,
} from "./GenericEQTypes";
import {
  BandMode1And8,
  BandMode2To7,
  ChannelMode,
  SteinbergFrequency,
} from "./SteinbergFrequency";

// Helper function to check if a shape is a low cut filter
function isLowCut(shape: GenericEQShape): boolean {
  return shape === GenericEQShape.LowCut;
}

// Helper function to check if a shape is a high cut filter
function isHighCut(shape: GenericEQShape): boolean {
  return shape === GenericEQShape.HighCut;
}

// Helper function to check if a shape is a peak-type filter
function isPeakType(shape: GenericEQShape): boolean {
  return (
    shape === GenericEQShape.Bell ||
    shape === GenericEQShape.BandPass ||
    shape === GenericEQShape.TiltShelf
  );
}

// Helper function to check if a shape is a low shelf filter
function isLowShelf(shape: GenericEQShape): boolean {
  return shape === GenericEQShape.LowShelf;
}

// Helper function to check if a shape is a high shelf filter
function isHighShelf(shape: GenericEQShape): boolean {
  return shape === GenericEQShape.HighShelf;
}

// Helper function to check if a shape is a notch filter
function isNotch(shape: GenericEQShape): boolean {
  return shape === GenericEQShape.Notch;
}

// Helper function to get the appropriate cut slope mode
function getCutSlope(slope: GenericEQSlope): BandMode1And8 {
  switch (slope) {
    case GenericEQSlope.Slope6dB_oct:
      return BandMode1And8.Cut6;
    case GenericEQSlope.Slope12dB_oct:
      return BandMode1And8.Cut12;
    case GenericEQSlope.Slope18dB_oct:
      return BandMode1And8.Cut24; // No 18dB option, use 24dB
    case GenericEQSlope.Slope24dB_oct:
      return BandMode1And8.Cut24;
    case GenericEQSlope.Slope30dB_oct:
    case GenericEQSlope.Slope36dB_oct:
      return BandMode1And8.Cut48; // No exact match, use 48dB
    case GenericEQSlope.Slope48dB_oct:
      return BandMode1And8.Cut48;
    case GenericEQSlope.Slope72dB_oct:
    case GenericEQSlope.Slope96dB_oct:
    case GenericEQSlope.SlopeBrickwall:
      return BandMode1And8.Cut96;
    default:
      return BandMode1And8.Cut48; // Default to 48dB/oct
  }
}

export function eqPresetToSteinbergFrequency(
  preset: GenericEQPreset
): SteinbergFrequency {
  const frequency = new SteinbergFrequency();

  // Frequency only supports lowcut on the 1st band and highcut on the 8th band
  const hasLowCutBand = preset.Bands.some(band => isLowCut(band.Shape));
  const hasHighCutBand = preset.Bands.some(band => isHighCut(band.Shape));

  // get remaining bands that are not lowcut or highcut and sort by frequency
  const band2To7 = preset.Bands.filter(band => {
    return !isLowCut(band.Shape) && !isHighCut(band.Shape);
  }).sort((a, b) => a.Frequency - b.Frequency);

  if (hasLowCutBand) {
    const lowCutBand = preset.Bands.filter(band => isLowCut(band.Shape)).sort(
      (a, b) => a.Frequency - b.Frequency
    )[0];
    if (lowCutBand) {
      setBand(lowCutBand, 1, frequency);
    }
  }

  if (hasHighCutBand) {
    const highCutBand = preset.Bands.filter(band => isHighCut(band.Shape)).sort(
      (a, b) => b.Frequency - a.Frequency
    )[0];
    if (highCutBand) {
      setBand(highCutBand, 8, frequency);
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
      setBand(band, bandNumber, frequency);
    }
  }

  return frequency;
}

function setBandParameter(
  frequency: SteinbergFrequency,
  bandNumber: number,
  channel: string,
  param: string,
  value: number
): void {
  frequency.setNumberParameter(
    `equalizerA${param}${bandNumber}${channel}`,
    value
  );
}

function setBand(
  band: GenericEQBand,
  bandNumber: number,
  frequency: SteinbergFrequency
): void {
  setBandParameter(
    frequency,
    bandNumber,
    "",
    "bandon",
    band.Enabled ? 1.0 : 0.0
  );
  let channel = "";

  // Handle stereo placement
  const isStandardStereo =
    band.StereoPlacement === GenericEQStereoPlacement.Stereo;

  if (!isStandardStereo) {
    const isLeft = band.StereoPlacement === GenericEQStereoPlacement.Left;
    const isMid = band.StereoPlacement === GenericEQStereoPlacement.Mid;

    setBandParameter(
      frequency,
      bandNumber,
      "",
      "on",
      isLeft || isMid ? 1.0 : 0.0
    );
    setBandParameter(
      frequency,
      bandNumber,
      "Ch2",
      "on",
      !isLeft && !isMid ? 1.0 : 0.0
    );

    if (!isLeft && !isMid) {
      channel = "Ch2";
    }

    setBandParameter(
      frequency,
      bandNumber,
      "",
      "editchannel",
      isLeft
        ? ChannelMode.LeftRightModeLeft
        : isMid
          ? ChannelMode.MidSideModeMid
          : band.StereoPlacement === GenericEQStereoPlacement.Side
            ? ChannelMode.MidSideModeSide
            : ChannelMode.LeftRightModeRight
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
  shape: GenericEQShape,
  band: GenericEQBand,
  bandNumber: number,
  channel: string,
  frequency: SteinbergFrequency
): void {
  const type = isPeakType(shape)
    ? BandMode1And8.Peak
    : isLowShelf(shape)
      ? BandMode1And8.LowShelf
      : isHighShelf(shape)
        ? BandMode1And8.HighShelf
        : isNotch(shape)
          ? BandMode1And8.Notch
          : isLowCut(shape) || isHighCut(shape)
            ? getCutSlope(band.Slope)
            : BandMode1And8.Peak; // Default to peak if unknown shape

  setBandParameter(frequency, bandNumber, channel, "type", type);
}

function handleBand2To7Shape(
  shape: GenericEQShape,
  bandNumber: number,
  channel: string,
  frequency: SteinbergFrequency
): void {
  const type = isPeakType(shape)
    ? BandMode2To7.Peak
    : isLowShelf(shape)
      ? BandMode2To7.LowShelf
      : isHighShelf(shape)
        ? BandMode2To7.HighShelf
        : isNotch(shape)
          ? BandMode2To7.Notch
          : BandMode2To7.Peak; // Default to peak if unknown shape

  setBandParameter(frequency, bandNumber, channel, "type", type);
}
