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
import {
  BandMode1And8,
  BandMode2To7,
  ChannelMode,
  SteinbergFrequency,
} from "./SteinbergFrequency";

type FabFilterBand = ProQBand | ProQ2Band | ProQ3Band;

export class GenericEQFactory {
  // --- Fabfilter Frequency Conversion ---

  static fromFabFilterProQ(preset: FabfilterProQBase): GenericEQPreset {
    const result: GenericEQPreset = {
      Name: preset.PlugInName || "Unknown Preset",
      Bands: [],
      Version: "1", // Version is not available on base class
      Vendor: preset.PlugInVendor,
    };

    for (const band of preset.Bands) {
      const convertedBand = this.convertFabFilterBand(band as FabFilterBand);
      result.Bands.push(convertedBand);
    }

    return result;
  }

  private static convertFabFilterBand(band: FabFilterBand): GenericEQBand {
    const convertedBand: GenericEQBand = {
      Enabled: band.Enabled,
      Frequency: band.Frequency,
      Gain: band.Gain,
      Q: band.Q,
      Shape: this.convertFabFilterShape(band),
      Slope: this.convertFabFilterSlope(band),
      StereoPlacement: this.convertFabFilterStereoPlacement(band),
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

  private static convertFabFilterShape(band: FabFilterBand): GenericEQShape {
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

  private static convertFabFilterSlope(band: FabFilterBand): GenericEQSlope {
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

  private static convertFabFilterStereoPlacement(
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

  // --- Steinberg Frequency Conversion ---

  public static convertSteinbergShapeAndSlope(
    bandNum: number,
    type: number
  ): { shape: GenericEQShape; slope: GenericEQSlope } {
    let shape: GenericEQShape = GenericEQShape.Bell; // Default
    let slope: GenericEQSlope = GenericEQSlope.Slope12dB_oct; // Default slope for shelves/cuts

    if (bandNum === 1 || bandNum === 8) {
      const mode = type as BandMode1And8;
      const isLowCut = bandNum === 1; // Assume band 1 is Low Cut, band 8 is High Cut for Cut types
      switch (mode) {
        case BandMode1And8.Cut6:
          shape = isLowCut ? GenericEQShape.LowCut : GenericEQShape.HighCut;
          slope = GenericEQSlope.Slope6dB_oct;
          break;
        case BandMode1And8.Cut12:
          shape = isLowCut ? GenericEQShape.LowCut : GenericEQShape.HighCut;
          slope = GenericEQSlope.Slope12dB_oct;
          break;
        case BandMode1And8.Cut24:
          shape = isLowCut ? GenericEQShape.LowCut : GenericEQShape.HighCut;
          slope = GenericEQSlope.Slope24dB_oct;
          break;
        case BandMode1And8.Cut48:
          shape = isLowCut ? GenericEQShape.LowCut : GenericEQShape.HighCut;
          slope = GenericEQSlope.Slope48dB_oct;
          break;
        case BandMode1And8.Cut96:
          shape = isLowCut ? GenericEQShape.LowCut : GenericEQShape.HighCut;
          slope = GenericEQSlope.Slope96dB_oct;
          break;
        case BandMode1And8.LowShelf:
          shape = GenericEQShape.LowShelf;
          // Slope might be implicitly 12dB/oct for Steinberg shelves? Use default.
          break;
        case BandMode1And8.Peak:
          shape = GenericEQShape.Bell;
          // Slope not applicable for Bell
          break;
        case BandMode1And8.HighShelf:
          shape = GenericEQShape.HighShelf;
          // Slope might be implicitly 12dB/oct. Use default.
          break;
        case BandMode1And8.Notch:
          shape = GenericEQShape.Notch;
          // Slope not applicable for Notch
          break;
        default:
          shape = GenericEQShape.Bell; // Fallback
          break;
      }
    } else {
      // Bands 2-7
      const mode = type as BandMode2To7;
      switch (mode) {
        case BandMode2To7.LowShelf:
          shape = GenericEQShape.LowShelf;
          break;
        case BandMode2To7.Peak:
          shape = GenericEQShape.Bell;
          break;
        case BandMode2To7.HighShelf:
          shape = GenericEQShape.HighShelf;
          break;
        case BandMode2To7.Notch:
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

  static fromSteinbergFrequency(preset: SteinbergFrequency): GenericEQPreset {
    const result: GenericEQPreset = {
      Name: preset.PlugInName || "Steinberg Frequency Preset",
      Bands: [],
      Version: "1", // Steinberg Frequency doesn't expose a version easily
      Vendor: preset.PlugInVendor,
    };

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

      const channelMode = steinbergBand.shared.editChannel as ChannelMode;

      const isBandEnabled = steinbergBand.shared.bandOn === 1.0;

      // ignore linear phase for now
      // const isLinearPhase =
      //   preset.getNumberParameter(`linearphase${bandNum}`) === 1.0;

      // --- Process Channel 1 (Left / Mid / Stereo) ---
      const { shape: shapeCh1, slope: slopeCh1 } =
        GenericEQFactory.convertSteinbergShapeAndSlope(
          bandNum,
          steinbergBand.ch1.type
        );

      let placementCh1 = GenericEQStereoPlacement.Stereo; // Default for StereoMode

      if (
        channelMode === ChannelMode.LeftRightModeLeft ||
        channelMode === ChannelMode.LeftRightModeRight
      ) {
        placementCh1 = GenericEQStereoPlacement.Left;
      } else if (
        channelMode === ChannelMode.MidSideModeMid ||
        channelMode === ChannelMode.MidSideModeSide
      ) {
        placementCh1 = GenericEQStereoPlacement.Mid;
      }

      if (steinbergBand.ch1.enabled === 1.0) {
        const convertedBandCh1: GenericEQBand = {
          Enabled: isBandEnabled,
          Frequency: steinbergBand.ch1.freq,
          Gain: steinbergBand.ch1.gain,
          Q: steinbergBand.ch1.q,
          Shape: shapeCh1,
          Slope: slopeCh1,
          StereoPlacement: placementCh1,
          DynamicRange: undefined,
          DynamicThreshold: undefined,
        };
        result.Bands.push(convertedBandCh1);
      }

      // --- Process Channel 2 (Right / Side) ---
      if (
        channelMode !== ChannelMode.StereoMode &&
        steinbergBand.ch2.enabled === 1.0
      ) {
        const { shape: shapeCh2, slope: slopeCh2 } =
          GenericEQFactory.convertSteinbergShapeAndSlope(
            bandNum,
            steinbergBand.ch2.type
          );

        let placementCh2 = GenericEQStereoPlacement.Right; // Default for L/R mode

        if (
          channelMode === ChannelMode.MidSideModeMid ||
          channelMode === ChannelMode.MidSideModeSide
        ) {
          placementCh2 = GenericEQStereoPlacement.Side;
        }

        const convertedBandCh2: GenericEQBand = {
          Enabled: isBandEnabled,
          Frequency: steinbergBand.ch2.freq,
          Gain: steinbergBand.ch2.gain,
          Q: steinbergBand.ch2.q,
          Shape: shapeCh2,
          Slope: slopeCh2,
          StereoPlacement: placementCh2,
          DynamicRange: undefined,
          DynamicThreshold: undefined,
        };
        result.Bands.push(convertedBandCh2);
      }
    }

    return result;
  }
}
