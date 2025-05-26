import {
  ProQChannelMode,
  ProQLPHPSlope,
  ProQShape,
  ProQStereoPlacement,
} from "../FabfilterProQ";
import {
  ProQ2ChannelMode,
  ProQ2Shape,
  ProQ2Slope,
  ProQ2StereoPlacement,
} from "../FabfilterProQ2";
import {
  ProQ3Shape,
  ProQ3Slope,
  ProQ3StereoPlacement,
} from "../FabfilterProQ3";
import {
  BandMode1And8,
  BandMode2To7,
  ChannelMode,
  SteinbergFrequency,
} from "../SteinbergFrequency";

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
export function getCutSlope(slope: Slope): BandMode1And8 {
  if (
    slope === ProQLPHPSlope.Slope6dB_oct ||
    slope === ProQ2Slope.Slope6dB_oct ||
    slope === ProQ3Slope.Slope6dB_oct
  ) {
    return BandMode1And8.Cut6;
  }
  if (
    slope === ProQLPHPSlope.Slope12dB_oct ||
    slope === ProQ2Slope.Slope12dB_oct ||
    slope === ProQ3Slope.Slope12dB_oct
  ) {
    return BandMode1And8.Cut12;
  }
  if (
    slope === ProQLPHPSlope.Slope24dB_oct ||
    slope === ProQ2Slope.Slope24dB_oct ||
    slope === ProQ3Slope.Slope24dB_oct
  ) {
    return BandMode1And8.Cut24;
  }
  if (
    slope === ProQLPHPSlope.Slope48dB_oct ||
    slope === ProQ2Slope.Slope48dB_oct ||
    slope === ProQ3Slope.Slope48dB_oct
  ) {
    return BandMode1And8.Cut48;
  }

  // Handle steeper slopes from Pro-Q2/3
  if (
    slope === ProQ2Slope.Slope72dB_oct ||
    slope === ProQ3Slope.Slope72dB_oct ||
    slope === ProQ2Slope.Slope96dB_oct ||
    slope === ProQ3Slope.Slope96dB_oct
  ) {
    return BandMode1And8.Cut96;
  }

  return BandMode1And8.Cut48; // Default to 48dB/oct
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

export function setBand(
  band: Band,
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
          ? ChannelMode.MidSideModeMid
          : ChannelMode.LeftRightModeLeft
        : isMidSide
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
  shape: Shape,
  band: Band,
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
          : null;

  if (type !== null) {
    setBandParameter(frequency, bandNumber, channel, "type", type);
  }
}
