/**
 * Standardized EQ types that can represent multiple EQ plugin formats
 */

export enum EQShape {
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

export enum EQSlope {
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

export enum EQStereoPlacement {
  Left = 0,
  Right = 1,
  Stereo = 2,
  Mid = 3,
  Side = 4,
}

export interface EQBand {
  Enabled: boolean;
  Frequency: number;
  Gain: number;
  Q: number;
  Shape: EQShape;
  Slope: EQSlope;
  StereoPlacement: EQStereoPlacement;
  DynamicRange?: number;
  DynamicThreshold?: number;
}

export interface EQPreset {
  Name: string;
  Bands: EQBand[];
  Version?: string;
  Vendor?: string;
}
