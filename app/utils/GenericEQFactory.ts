import {
  ProQBand,
  ProQLPHPSlope,
  ProQShape,
  ProQStereoPlacement,
} from "./FabfilterProQ";
import {
  ProQ2Band,
  ProQ2Shape,
  ProQ2Slope,
  ProQ2StereoPlacement,
} from "./FabfilterProQ2";
import {
  ProQ3Band,
  ProQ3Shape,
  ProQ3Slope,
  ProQ3StereoPlacement,
} from "./FabfilterProQ3";
import { FabfilterProQBase } from "./FabfilterProQBase";
import {
  GenericEQBand,
  GenericEQPreset,
  GenericEQShape,
  GenericEQSlope,
  GenericEQStereoPlacement,
} from "./GenericEQTypes";

type FabFilterBand = ProQBand | ProQ2Band | ProQ3Band;

export class GenericEQFactory {
  static fromFabFilterProQ(preset: FabfilterProQBase): GenericEQPreset {
    const result: GenericEQPreset = {
      Name: preset.PlugInName || "Unknown Preset",
      Bands: [],
      Version: "1", // Version is not available on base class
      Vendor: preset.PlugInVendor,
    };

    for (const band of preset.Bands) {
      const convertedBand = this.convertBand(band as FabFilterBand);
      result.Bands.push(convertedBand);
    }

    return result;
  }

  private static convertBand(band: FabFilterBand): GenericEQBand {
    const convertedBand: GenericEQBand = {
      Enabled: band.Enabled,
      Frequency: band.Frequency,
      Gain: band.Gain,
      Q: band.Q,
      Shape: this.convertShape(band),
      Slope: this.convertSlope(band),
      StereoPlacement: this.convertStereoPlacement(band),
    };

    // Handle ProQ3 specific properties
    if (this.isProQ3Band(band)) {
      convertedBand.DynamicRange = band.DynamicRange;
      convertedBand.DynamicThreshold = band.DynamicThreshold;
    }

    return convertedBand;
  }

  private static isProQ3Band(band: FabFilterBand): band is ProQ3Band {
    return "DynamicRange" in band && "DynamicThreshold" in band;
  }

  private static isProQ1Band(band: FabFilterBand): band is ProQBand {
    return "LPHPSlope" in band;
  }

  private static convertShape(band: FabFilterBand): GenericEQShape {
    const shape = band.Shape;

    // ProQ1 shapes
    if (this.isProQ1Band(band)) {
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

  private static convertSlope(band: FabFilterBand): GenericEQSlope {
    if (this.isProQ1Band(band)) {
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

  private static convertStereoPlacement(
    band: FabFilterBand
  ): GenericEQStereoPlacement {
    const placement = band.StereoPlacement;

    if (this.isProQ1Band(band)) {
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
}
