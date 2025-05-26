// === Helper Functions ===

import {
  GenericEQBand,
  GenericEQShape,
  GenericEQSlope,
  GenericEQStereoPlacement,
} from "../GenericEQPreset";
import {
  BandMode1And8,
  BandMode2To7,
  ChannelMode,
  SteinbergFrequency,
} from "../SteinbergFrequency";

export function isLowCut(shape: GenericEQShape): boolean {
  return shape === GenericEQShape.LowCut;
}

export function isHighCut(shape: GenericEQShape): boolean {
  return shape === GenericEQShape.HighCut;
}

export function isPeakType(shape: GenericEQShape): boolean {
  return (
    shape === GenericEQShape.Bell ||
    shape === GenericEQShape.BandPass ||
    shape === GenericEQShape.TiltShelf
  );
}

export function isLowShelf(shape: GenericEQShape): boolean {
  return shape === GenericEQShape.LowShelf;
}

export function isHighShelf(shape: GenericEQShape): boolean {
  return shape === GenericEQShape.HighShelf;
}

export function isNotch(shape: GenericEQShape): boolean {
  return shape === GenericEQShape.Notch;
}

export function getCutSlope(slope: GenericEQSlope): BandMode1And8 {
  switch (slope) {
    case GenericEQSlope.Slope6dB_oct:
      return BandMode1And8.Cut6;
    case GenericEQSlope.Slope12dB_oct:
      return BandMode1And8.Cut12;
    case GenericEQSlope.Slope18dB_oct:
    case GenericEQSlope.Slope24dB_oct:
      return BandMode1And8.Cut24;
    case GenericEQSlope.Slope30dB_oct:
    case GenericEQSlope.Slope36dB_oct:
      return BandMode1And8.Cut48;
    case GenericEQSlope.Slope48dB_oct:
      return BandMode1And8.Cut48;
    case GenericEQSlope.Slope72dB_oct:
    case GenericEQSlope.Slope96dB_oct:
    case GenericEQSlope.SlopeBrickwall:
      return BandMode1And8.Cut96;
    default:
      return BandMode1And8.Cut48;
  }
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

    if (!isLeft && !isMid) channel = "Ch2";

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

  setBandParameter(frequency, bandNumber, channel, "gain", band.Gain);
  setBandParameter(frequency, bandNumber, channel, "freq", band.Frequency);
  setBandParameter(frequency, bandNumber, channel, "q", band.Q);

  const shape = band.Shape;

  if (bandNumber === 1 || bandNumber === 8) {
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
              : BandMode1And8.Peak;

    setBandParameter(frequency, bandNumber, channel, "type", type);
  } else {
    const type = isPeakType(shape)
      ? BandMode2To7.Peak
      : isLowShelf(shape)
        ? BandMode2To7.LowShelf
        : isHighShelf(shape)
          ? BandMode2To7.HighShelf
          : isNotch(shape)
            ? BandMode2To7.Notch
            : BandMode2To7.Peak;

    setBandParameter(frequency, bandNumber, channel, "type", type);
  }
}
