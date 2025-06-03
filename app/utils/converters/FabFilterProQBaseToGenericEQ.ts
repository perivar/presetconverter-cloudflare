import {
  ProQBand,
  ProQLPHPSlope,
  ProQShape,
  ProQStereoPlacement,
} from "../preset/FabFilterProQ";
import {
  ProQ2Band,
  ProQ2Shape,
  ProQ2Slope,
  ProQ2StereoPlacement,
} from "../preset/FabFilterProQ2";
import {
  ProQ3Band,
  ProQ3Shape,
  ProQ3Slope,
  ProQ3StereoPlacement,
} from "../preset/FabFilterProQ3";
import { FabFilterProQBase } from "../preset/FabFilterProQBase";
import {
  GenericEQBand,
  GenericEQPreset,
  GenericEQShape,
  GenericEQSlope,
  GenericEQStereoPlacement,
} from "../preset/GenericEQPreset";
import { MultiFormatConverter } from "./MultiFormatConverter";

export const FabFilterProQBaseToGenericEQ: MultiFormatConverter<
  FabFilterProQBase,
  GenericEQPreset
> = {
  from: "FabFilterProQBase", // this gets overridden during registration
  to: "GenericEQPreset",
  displayName: "Generic EQ Preset",

  convertBase(preset: FabFilterProQBase) {
    const result = new GenericEQPreset(
      preset.PlugInName || "Unknown Preset",
      preset.Bands.map(band => convertFabFilterBand(band as FabFilterBand)),
      "1", // Version is not available on base class
      preset.PlugInVendor
    );

    return result;
  },

  outputFormats: [
    {
      formatId: "text",
      extension: ".txt",
      displayName: "Text",
      convert(preset: FabFilterProQBase) {
        const result = FabFilterProQBaseToGenericEQ.convertBase(preset);
        return result.toString();
      },
    },
  ],
};

export type FabFilterBand = ProQBand | ProQ2Band | ProQ3Band;

export function convertFabFilterBand(band: FabFilterBand): GenericEQBand {
  const convertedBand = new GenericEQBand(
    band.Enabled,
    band.Frequency,
    band.Gain,
    band.Q,
    convertFabFilterShape(band),
    convertFabFilterSlope(band),
    convertFabFilterStereoPlacement(band)
  );

  // Handle ProQ3 specific properties
  if (isProQ3Band(band)) {
    convertedBand.DynamicRange = band.DynamicRange;
    convertedBand.DynamicThreshold = band.DynamicThreshold;
  }

  return convertedBand;
}

function isProQ3Band(band: FabFilterBand): band is ProQ3Band {
  return "DynamicRange" in band && "DynamicThreshold" in band;
}

function isProQ1Band(band: FabFilterBand): band is ProQBand {
  return "LPHPSlope" in band;
}

function convertFabFilterShape(band: FabFilterBand): GenericEQShape {
  const shape = band.Shape;

  // ProQ1 shapes
  if (isProQ1Band(band)) {
    switch (shape as ProQShape) {
      case ProQShape.Bell:
        return GenericEQShape.Bell;
      case ProQShape.LowShelf:
        return GenericEQShape.LowShelf;
      case ProQShape.LowCut:
        return GenericEQShape.LowCut;
      case ProQShape.HighShelf:
        return GenericEQShape.HighShelf;
      case ProQShape.HighCut:
        return GenericEQShape.HighCut;
      case ProQShape.Notch:
        return GenericEQShape.Notch;
    }
  }
  // ProQ2/3 shapes
  else {
    switch (shape as ProQ2Shape | ProQ3Shape) {
      case ProQ2Shape.Bell:
        return GenericEQShape.Bell;
      case ProQ2Shape.LowShelf:
        return GenericEQShape.LowShelf;
      case ProQ2Shape.LowCut:
        return GenericEQShape.LowCut;
      case ProQ2Shape.HighShelf:
        return GenericEQShape.HighShelf;
      case ProQ2Shape.HighCut:
        return GenericEQShape.HighCut;
      case ProQ2Shape.Notch:
        return GenericEQShape.Notch;
      case ProQ2Shape.BandPass:
        return GenericEQShape.BandPass;
      case ProQ2Shape.TiltShelf:
        return GenericEQShape.TiltShelf;
      case ProQ3Shape.FlatTilt:
        return GenericEQShape.FlatTilt;
    }
  }

  return GenericEQShape.Bell;
}

function convertFabFilterSlope(band: FabFilterBand): GenericEQSlope {
  if (isProQ1Band(band)) {
    switch (band.LPHPSlope) {
      case ProQLPHPSlope.Slope6dB_oct:
        return GenericEQSlope.Slope6dB_oct;
      case ProQLPHPSlope.Slope12dB_oct:
        return GenericEQSlope.Slope12dB_oct;
      case ProQLPHPSlope.Slope24dB_oct:
        return GenericEQSlope.Slope24dB_oct;
      case ProQLPHPSlope.Slope48dB_oct:
        return GenericEQSlope.Slope48dB_oct;
    }
  } else {
    switch ((band as ProQ2Band | ProQ3Band).Slope) {
      case ProQ2Slope.Slope6dB_oct:
        return GenericEQSlope.Slope6dB_oct;
      case ProQ2Slope.Slope12dB_oct:
        return GenericEQSlope.Slope12dB_oct;
      case ProQ2Slope.Slope18dB_oct:
        return GenericEQSlope.Slope18dB_oct;
      case ProQ2Slope.Slope24dB_oct:
        return GenericEQSlope.Slope24dB_oct;
      case ProQ2Slope.Slope30dB_oct:
        return GenericEQSlope.Slope30dB_oct;
      case ProQ2Slope.Slope36dB_oct:
        return GenericEQSlope.Slope36dB_oct;
      case ProQ2Slope.Slope48dB_oct:
        return GenericEQSlope.Slope48dB_oct;
      case ProQ2Slope.Slope72dB_oct:
        return GenericEQSlope.Slope72dB_oct;
      case ProQ2Slope.Slope96dB_oct:
        return GenericEQSlope.Slope96dB_oct;
      case ProQ3Slope.SlopeBrickwall:
        return GenericEQSlope.SlopeBrickwall;
    }
  }
  return GenericEQSlope.Slope24dB_oct;
}

function convertFabFilterStereoPlacement(
  band: FabFilterBand
): GenericEQStereoPlacement {
  const placement = band.StereoPlacement;

  if (isProQ1Band(band)) {
    switch (placement as ProQStereoPlacement) {
      case ProQStereoPlacement.LeftOrMid:
        return GenericEQStereoPlacement.Left;
      case ProQStereoPlacement.RightOrSide:
        return GenericEQStereoPlacement.Right;
      case ProQStereoPlacement.Stereo:
        return GenericEQStereoPlacement.Stereo;
    }
  } else {
    switch (placement as ProQ2StereoPlacement | ProQ3StereoPlacement) {
      case ProQ2StereoPlacement.LeftOrMid:
        return GenericEQStereoPlacement.Left;
      case ProQ2StereoPlacement.RightOrSide:
        return GenericEQStereoPlacement.Right;
      case ProQ2StereoPlacement.Stereo:
        return GenericEQStereoPlacement.Stereo;
      case ProQ3StereoPlacement.Mid:
        return GenericEQStereoPlacement.Mid;
      case ProQ3StereoPlacement.Side:
        return GenericEQStereoPlacement.Side;
    }
  }

  return GenericEQStereoPlacement.Stereo;
}
