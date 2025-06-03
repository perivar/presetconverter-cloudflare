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

export const GenericEQToSteinbergFrequency: MultiFormatConverter<
  GenericEQPreset,
  SteinbergFrequency
> = {
  from: "GenericEQPreset",
  to: "SteinbergFrequency",
  displayName: "Steinberg Frequency",

  convertBase(preset: GenericEQPreset) {
    const frequency = new SteinbergFrequency();

    const hasLowCutBand = preset.Bands.some(band => isLowCut(band.Shape));
    const hasHighCutBand = preset.Bands.some(band => isHighCut(band.Shape));

    const band2To7 = preset.Bands.filter(
      band => !isLowCut(band.Shape) && !isHighCut(band.Shape)
    ).sort((a, b) => a.Frequency - b.Frequency);

    if (hasLowCutBand) {
      const lowCutBand = preset.Bands.filter(band => isLowCut(band.Shape)).sort(
        (a, b) => a.Frequency - b.Frequency
      )[0];
      if (lowCutBand) setBand(lowCutBand, 1, frequency);
    }

    if (hasHighCutBand) {
      const highCutBand = preset.Bands.filter(band =>
        isHighCut(band.Shape)
      ).sort((a, b) => b.Frequency - a.Frequency)[0];
      if (highCutBand) setBand(highCutBand, 8, frequency);
    }

    const startIndex = hasLowCutBand ? 2 : 1;
    const endIndex = hasHighCutBand ? 7 : 8;

    for (
      let bandNumber = startIndex, index = 0;
      bandNumber <= endIndex && index < band2To7.length;
      bandNumber++, index++
    ) {
      const band = band2To7[index];
      if (band) setBand(band, bandNumber, frequency);
    }

    return frequency;
  },

  outputFormats: [
    {
      formatId: "vstpreset",
      extension: ".vstpreset",
      displayName: "VSTPreset",
      convert(preset: GenericEQPreset) {
        const result = GenericEQToSteinbergFrequency.convertBase(preset);
        return result.write();
      },
    },
  ],
};

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

export function getCutSlope(slope: GenericEQSlope): FrequencyBandMode1And8 {
  switch (slope) {
    case GenericEQSlope.Slope6dB_oct:
      return FrequencyBandMode1And8.Cut6;
    case GenericEQSlope.Slope12dB_oct:
      return FrequencyBandMode1And8.Cut12;
    case GenericEQSlope.Slope18dB_oct:
    case GenericEQSlope.Slope24dB_oct:
      return FrequencyBandMode1And8.Cut24;
    case GenericEQSlope.Slope30dB_oct:
    case GenericEQSlope.Slope36dB_oct:
      return FrequencyBandMode1And8.Cut48;
    case GenericEQSlope.Slope48dB_oct:
      return FrequencyBandMode1And8.Cut48;
    case GenericEQSlope.Slope72dB_oct:
    case GenericEQSlope.Slope96dB_oct:
    case GenericEQSlope.SlopeBrickwall:
      return FrequencyBandMode1And8.Cut96;
    default:
      return FrequencyBandMode1And8.Cut48;
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
        ? FrequencyChannelMode.LeftRightModeLeft
        : isMid
          ? FrequencyChannelMode.MidSideModeMid
          : band.StereoPlacement === GenericEQStereoPlacement.Side
            ? FrequencyChannelMode.MidSideModeSide
            : FrequencyChannelMode.LeftRightModeRight
    );
  }

  setBandParameter(frequency, bandNumber, channel, "gain", band.Gain);
  setBandParameter(frequency, bandNumber, channel, "freq", band.Frequency);
  setBandParameter(frequency, bandNumber, channel, "q", band.Q);

  const shape = band.Shape;

  if (bandNumber === 1 || bandNumber === 8) {
    const type = isPeakType(shape)
      ? FrequencyBandMode1And8.Peak
      : isLowShelf(shape)
        ? FrequencyBandMode1And8.LowShelf
        : isHighShelf(shape)
          ? FrequencyBandMode1And8.HighShelf
          : isNotch(shape)
            ? FrequencyBandMode1And8.Notch
            : isLowCut(shape) || isHighCut(shape)
              ? getCutSlope(band.Slope)
              : FrequencyBandMode1And8.Peak;

    setBandParameter(frequency, bandNumber, channel, "type", type);
  } else {
    const type = isPeakType(shape)
      ? FrequencyBandMode2To7.Peak
      : isLowShelf(shape)
        ? FrequencyBandMode2To7.LowShelf
        : isHighShelf(shape)
          ? FrequencyBandMode2To7.HighShelf
          : isNotch(shape)
            ? FrequencyBandMode2To7.Notch
            : FrequencyBandMode2To7.Peak;

    setBandParameter(frequency, bandNumber, channel, "type", type);
  }
}
