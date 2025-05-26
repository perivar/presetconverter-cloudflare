/**
 * Standardized EQ types that can represent multiple EQ plugin formats
 */

export enum GenericEQShape {
  Bell = 0,
  LowShelf = 1,
  LowCut = 2,
  HighShelf = 3,
  HighCut = 4,
  Notch = 5,
  BandPass = 6,
  TiltShelf = 7,
  FlatTilt = 8,
}

export enum GenericEQSlope {
  Slope6dB_oct = 0,
  Slope12dB_oct = 1,
  Slope18dB_oct = 2,
  Slope24dB_oct = 3,
  Slope30dB_oct = 4,
  Slope36dB_oct = 5,
  Slope48dB_oct = 6,
  Slope72dB_oct = 7,
  Slope96dB_oct = 8,
  SlopeBrickwall = 9,
}

export enum GenericEQStereoPlacement {
  Left = 0,
  Right = 1,
  Stereo = 2,
  Mid = 3,
  Side = 4,
}

export class GenericEQBand {
  Enabled: boolean;
  Frequency: number;
  Gain: number;
  Q: number;
  Shape: GenericEQShape;
  Slope: GenericEQSlope;
  StereoPlacement: GenericEQStereoPlacement;
  DynamicRange?: number;
  DynamicThreshold?: number;

  constructor(
    enabled: boolean = false,
    frequency: number = 0,
    gain: number = 0,
    q: number = 0,
    shape: GenericEQShape = GenericEQShape.Bell,
    slope: GenericEQSlope = GenericEQSlope.Slope24dB_oct,
    stereoPlacement: GenericEQStereoPlacement = GenericEQStereoPlacement.Stereo,
    dynamicRange?: number,
    dynamicThreshold?: number
  ) {
    this.Enabled = enabled;
    this.Frequency = frequency;
    this.Gain = gain;
    this.Q = q;
    this.Shape = shape;
    this.Slope = slope;
    this.StereoPlacement = stereoPlacement;
    this.DynamicRange = dynamicRange;
    this.DynamicThreshold = dynamicThreshold;
  }

  toString(): string {
    const shapeStr = GenericEQShape[this.Shape];
    const slopeStr = GenericEQSlope[this.Slope];
    const placementStr = GenericEQStereoPlacement[this.StereoPlacement];
    const dynamicStr =
      this.DynamicRange !== undefined && this.DynamicThreshold !== undefined
        ? ` | Dynamic Range: ${this.DynamicRange.toFixed(1)} dB | Threshold: ${this.DynamicThreshold === 1 ? "Auto" : this.DynamicThreshold.toFixed(1) + " dB"}`
        : "";

    return (
      `${this.Enabled ? "Enabled" : "Disabled"} | ${placementStr} | ` +
      `${shapeStr} @ ${this.Frequency.toFixed(1)} Hz | ` +
      `Gain: ${this.Gain.toFixed(1)} dB | Q: ${this.Q.toFixed(2)} | ` +
      `${slopeStr}${dynamicStr}`
    );
  }
}

export class GenericEQPreset {
  Name: string;
  Bands: GenericEQBand[];
  Version?: string;
  Vendor?: string;

  constructor(
    name: string = "Default Preset",
    bands: GenericEQBand[] = [],
    version?: string,
    vendor?: string
  ) {
    this.Name = name;
    this.Bands = bands;
    this.Version = version;
    this.Vendor = vendor;
  }

  toString(): string {
    const bandStrings = this.Bands.map(
      (band, index) => `Band ${index + 1}: ${band.toString()}`
    );
    return bandStrings.join("\n") || "No bands defined";
  }
}
