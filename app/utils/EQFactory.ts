import {
  EQBand,
  EQPreset,
  EQShape,
  EQSlope,
  EQStereoPlacement,
} from "./EQTypes";
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

type FabFilterBand = ProQBand | ProQ2Band | ProQ3Band;

export class EQFactory {
  static fromFabFilterProQ(preset: FabfilterProQBase): EQPreset {
    const result: EQPreset = {
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

  private static convertBand(band: FabFilterBand): EQBand {
    const convertedBand: EQBand = {
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

  private static convertShape(band: FabFilterBand): EQShape {
    const shape = band.Shape;

    // ProQ1 shapes
    if (this.isProQ1Band(band)) {
      switch (shape as ProQShape) {
        case ProQShape.Bell:
          return EQShape.Bell;
        case ProQShape.LowShelf:
          return EQShape.LowShelf;
        case ProQShape.LowCut:
          return EQShape.LowCut;
        case ProQShape.HighShelf:
          return EQShape.HighShelf;
        case ProQShape.HighCut:
          return EQShape.HighCut;
        case ProQShape.Notch:
          return EQShape.Notch;
      }
    }
    // ProQ2/3 shapes
    else {
      switch (shape as ProQ2Shape | ProQ3Shape) {
        case ProQ2Shape.Bell:
          return EQShape.Bell;
        case ProQ2Shape.LowShelf:
          return EQShape.LowShelf;
        case ProQ2Shape.LowCut:
          return EQShape.LowCut;
        case ProQ2Shape.HighShelf:
          return EQShape.HighShelf;
        case ProQ2Shape.HighCut:
          return EQShape.HighCut;
        case ProQ2Shape.Notch:
          return EQShape.Notch;
        case ProQ2Shape.BandPass:
          return EQShape.BandPass;
        case ProQ2Shape.TiltShelf:
          return EQShape.TiltShelf;
        case ProQ3Shape.FlatTilt:
          return EQShape.FlatTilt;
      }
    }

    return EQShape.Bell;
  }

  private static convertSlope(band: FabFilterBand): EQSlope {
    if (this.isProQ1Band(band)) {
      switch (band.LPHPSlope) {
        case ProQLPHPSlope.Slope6dB_oct:
          return EQSlope.Slope6dB_oct;
        case ProQLPHPSlope.Slope12dB_oct:
          return EQSlope.Slope12dB_oct;
        case ProQLPHPSlope.Slope24dB_oct:
          return EQSlope.Slope24dB_oct;
        case ProQLPHPSlope.Slope48dB_oct:
          return EQSlope.Slope48dB_oct;
      }
    } else {
      switch ((band as ProQ2Band | ProQ3Band).Slope) {
        case ProQ2Slope.Slope6dB_oct:
          return EQSlope.Slope6dB_oct;
        case ProQ2Slope.Slope12dB_oct:
          return EQSlope.Slope12dB_oct;
        case ProQ2Slope.Slope18dB_oct:
          return EQSlope.Slope18dB_oct;
        case ProQ2Slope.Slope24dB_oct:
          return EQSlope.Slope24dB_oct;
        case ProQ2Slope.Slope30dB_oct:
          return EQSlope.Slope30dB_oct;
        case ProQ2Slope.Slope36dB_oct:
          return EQSlope.Slope36dB_oct;
        case ProQ2Slope.Slope48dB_oct:
          return EQSlope.Slope48dB_oct;
        case ProQ2Slope.Slope72dB_oct:
          return EQSlope.Slope72dB_oct;
        case ProQ2Slope.Slope96dB_oct:
          return EQSlope.Slope96dB_oct;
        case ProQ3Slope.SlopeBrickwall:
          return EQSlope.SlopeBrickwall;
      }
    }
    return EQSlope.Slope24dB_oct;
  }

  private static convertStereoPlacement(
    band: FabFilterBand
  ): EQStereoPlacement {
    const placement = band.StereoPlacement;

    if (this.isProQ1Band(band)) {
      switch (placement as ProQStereoPlacement) {
        case ProQStereoPlacement.LeftOrMid:
          return EQStereoPlacement.Left;
        case ProQStereoPlacement.RightOrSide:
          return EQStereoPlacement.Right;
        case ProQStereoPlacement.Stereo:
          return EQStereoPlacement.Stereo;
      }
    } else {
      switch (placement as ProQ2StereoPlacement | ProQ3StereoPlacement) {
        case ProQ2StereoPlacement.LeftOrMid:
          return EQStereoPlacement.Left;
        case ProQ2StereoPlacement.RightOrSide:
          return EQStereoPlacement.Right;
        case ProQ2StereoPlacement.Stereo:
          return EQStereoPlacement.Stereo;
        case ProQ3StereoPlacement.Mid:
          return EQStereoPlacement.Mid;
        case ProQ3StereoPlacement.Side:
          return EQStereoPlacement.Side;
      }
    }

    return EQStereoPlacement.Stereo;
  }
}
