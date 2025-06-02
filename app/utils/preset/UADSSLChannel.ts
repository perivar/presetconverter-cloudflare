import { BinaryFile, ByteOrder } from "../binary/BinaryFile";
import { VstClassIDs } from "./VstClassIDs";
import { VstPreset } from "./VstPreset";

// Define interfaces for parameter mapping entries
interface ParameterMappingEntry {
  value: number; // Normalized value (0.00 - 1.00)
  displayNumber: number | string; // Numeric display value or "Out", "Limit", etc.
  displayText: string; // Formatted display text
}

// Define a type for parameters with linear mapping
interface LinearParameterConfig {
  minDisplay: number;
  maxDisplay: number;
  unit?: string; // e.g., "dB", "s"
  decimalPlaces?: number; // for formatting DisplayText
}

// Define a type for parameters with logarithmic frequency mapping
interface FrequencyParameterConfig {
  minFreq: number; // Hz
  maxFreq: number; // Hz
  specialCases?: {
    valueRange: [number, number]; // [min, max] normalized value
    displayText: string;
    displayNumber: string;
  }[];
  decimalPlaces?: number; // for formatting DisplayText
  reverseScale?: boolean; // Indicates if the frequency scale is reversed (e.g., high value maps to low freq)
}

// Define a type for parameters with custom discrete mappings (like Select)
interface DiscreteParameterConfig {
  mappings: {
    valueRange: [number, number]; // [min, max] normalized value
    displayText: string;
    displayNumber: number | string;
  }[];
}

// Define a type for parameters with custom non-linear numeric mappings (like CMP Ratio, Q)
// For these, we'll use a small, hardcoded array of key points and interpolate.
interface CustomCurveParameterConfig {
  points: {
    value: number; // Normalized value (0.00 - 1.00)
    displayNumber: number; // Actual numeric display value
    displayText: string; // Actual display text
  }[];
  unit?: string; // e.g., ":1"
  decimalPlaces?: number; // for formatting DisplayText
}

// Helper functions for conversions
function formatDb(value: number, decimalPlaces: number = 1): string {
  return `${value.toFixed(decimalPlaces)} dB`;
}

function formatSeconds(value: number, decimalPlaces: number = 2): string {
  return `${value.toFixed(decimalPlaces)} s`;
}

function formatHz(value: number, decimalPlaces: number = 1): string {
  if (value >= 1000) {
    return `${(value / 1000).toFixed(decimalPlaces)} k`;
  }
  return `${value.toFixed(decimalPlaces)} Hz`;
}

function formatRatio(value: number, decimalPlaces: number = 2): string {
  return `${value.toFixed(decimalPlaces)}:1`;
}

// Linear interpolation function
function lerp(
  value: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number
): number {
  return ((value - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;
}

// Inverse linear interpolation (value from output range to input range)
function invLerp(
  value: number,
  outMin: number,
  outMax: number,
  inMin: number,
  inMax: number
): number {
  return ((value - outMin) * (inMax - inMin)) / (outMax - outMin) + inMin;
}

// Logarithmic interpolation for frequencies (value 0-1 to freq range)
function mapNormalizedValueToFrequency(
  normalizedValue: number,
  minFreq: number,
  maxFreq: number
): number {
  // Ensure normalizedValue is within [0, 1]
  normalizedValue = Math.max(0, Math.min(1, normalizedValue));
  // Map normalized value linearly to log scale
  const logMin = Math.log(minFreq);
  const logMax = Math.log(maxFreq);
  const logFreq = lerp(normalizedValue, 0, 1, logMin, logMax);
  return Math.exp(logFreq);
}

// Inverse logarithmic interpolation for frequencies (freq to value 0-1)
function mapFrequencyToNormalizedValue(
  frequency: number,
  minFreq: number,
  maxFreq: number
): number {
  // Ensure frequency is within [minFreq, maxFreq]
  frequency = Math.max(minFreq, Math.min(maxFreq, frequency));
  const logMin = Math.log(minFreq);
  const logMax = Math.log(maxFreq);
  const logFreq = Math.log(frequency);
  // Map log frequency linearly to normalized value
  return invLerp(logFreq, logMin, logMax, 0, 1);
}

// Function to get display text/number for linear parameters
function getLinearParameterDisplay(
  value: number,
  config: LinearParameterConfig
): { displayNumber: number; displayText: string } {
  const displayNumber = lerp(value, 0, 1, config.minDisplay, config.maxDisplay);
  const formattedText = config.unit
    ? `${displayNumber.toFixed(config.decimalPlaces ?? 2)} ${config.unit}`
    : displayNumber.toFixed(config.decimalPlaces ?? 2);
  return { displayNumber, displayText: formattedText };
}

// Function to get normalized value for linear parameters
function getLinearParameterValue(
  displayNumber: number,
  config: LinearParameterConfig
): number {
  return invLerp(displayNumber, config.minDisplay, config.maxDisplay, 0, 1);
}

// Function to get display text/number for frequency parameters
function getFrequencyParameterDisplay(
  value: number,
  config: FrequencyParameterConfig
): { displayNumber: number | string; displayText: string } {
  // Handle special cases first
  if (config.specialCases) {
    for (const sc of config.specialCases) {
      if (value >= sc.valueRange[0] && value <= sc.valueRange[1]) {
        return { displayNumber: sc.displayNumber, displayText: sc.displayText };
      }
    }
  }

  const freq = mapNormalizedValueToFrequency(
    value,
    config.reverseScale ? config.maxFreq : config.minFreq,
    config.reverseScale ? config.minFreq : config.maxFreq
  );
  const formattedText = formatHz(freq, config.decimalPlaces ?? 1);
  return { displayNumber: freq, displayText: formattedText };
}

// Function to get normalized value for frequency parameters
function getFrequencyParameterValue(
  displayNumber: number,
  config: FrequencyParameterConfig
): number {
  // Handle special cases (e.g., "Out") - for simplicity, assume 0 for "Out"
  if (typeof displayNumber === "string") {
    return 0; // Or handle based on specific logic for "Out"
  }
  return mapFrequencyToNormalizedValue(
    displayNumber,
    config.reverseScale ? config.maxFreq : config.minFreq,
    config.reverseScale ? config.minFreq : config.maxFreq
  );
}

// Function to get display text/number for discrete parameters
function getDiscreteParameterDisplay(
  value: number,
  config: DiscreteParameterConfig
): { displayNumber: number | string; displayText: string } {
  for (const mapping of config.mappings) {
    if (value >= mapping.valueRange[0] && value <= mapping.valueRange[1]) {
      return {
        displayNumber: mapping.displayNumber,
        displayText: mapping.displayText,
      };
    }
  }
  // Fallback for unexpected values
  return { displayNumber: value, displayText: `Unknown (${value})` };
}

// Function to get normalized value for discrete parameters
function getDiscreteParameterValue(
  displayText: string,
  config: DiscreteParameterConfig
): number {
  for (const mapping of config.mappings) {
    if (mapping.displayText === displayText) {
      // Return the midpoint of the value range for simplicity, or the min value
      return mapping.valueRange[0];
    }
  }
  return 0; // Default to 0 if not found
}

// Function to get display text/number for custom curve parameters (interpolation)
function getCustomCurveParameterDisplay(
  value: number,
  config: CustomCurveParameterConfig
): { displayNumber: number | string; displayText: string } {
  // Handle edge cases for min/max values
  if (value <= config.points[0].value) {
    return {
      displayNumber: config.points[0].displayNumber,
      displayText: config.points[0].displayText,
    };
  }
  if (value >= config.points[config.points.length - 1].value) {
    return {
      displayNumber: config.points[config.points.length - 1].displayNumber,
      displayText: config.points[config.points.length - 1].displayText,
    };
  }

  // Find the two points to interpolate between
  let lowerPoint: ParameterMappingEntry = config.points[0];
  let upperPoint: ParameterMappingEntry =
    config.points[config.points.length - 1];

  for (let i = 0; i < config.points.length; i++) {
    if (value >= config.points[i].value) {
      lowerPoint = config.points[i];
    }
    if (value <= config.points[i].value) {
      upperPoint = config.points[i];
      break;
    }
  }

  // If either point has a string displayNumber, return the closest one directly
  if (typeof lowerPoint.displayNumber === "string") {
    return {
      displayNumber: lowerPoint.displayNumber,
      displayText: lowerPoint.displayText,
    };
  }
  if (typeof upperPoint.displayNumber === "string") {
    return {
      displayNumber: upperPoint.displayNumber,
      displayText: upperPoint.displayText,
    };
  }

  const displayNumber = lerp(
    value,
    lowerPoint.value,
    upperPoint.value,
    lowerPoint.displayNumber,
    upperPoint.displayNumber
  );

  const formattedText = config.unit
    ? `${displayNumber.toFixed(config.decimalPlaces ?? 2)}${config.unit}`
    : displayNumber.toFixed(config.decimalPlaces ?? 2);

  return { displayNumber, displayText: formattedText };
}

// Function to get normalized value for custom curve parameters (inverse interpolation)
function getCustomCurveParameterValue(
  displayNumber: number | string,
  config: CustomCurveParameterConfig
): number {
  // Handle special string display numbers (e.g., "Limit")
  if (typeof displayNumber === "string") {
    for (const point of config.points) {
      if (
        typeof point.displayNumber === "string" &&
        point.displayNumber === displayNumber
      ) {
        return point.value;
      }
    }
    return 0; // Fallback if string display number not found
  }

  // Now, we are sure that displayNumber is a number.
  const numericDisplayNumber = displayNumber; // Type is now narrowed to number

  // Handle edge cases for min/max display numbers
  if (
    typeof config.points[0].displayNumber === "number" &&
    numericDisplayNumber <= (config.points[0].displayNumber as number)
  ) {
    return config.points[0].value;
  }
  if (
    typeof config.points[config.points.length - 1].displayNumber === "number" &&
    numericDisplayNumber >=
      (config.points[config.points.length - 1].displayNumber as number)
  ) {
    return config.points[config.points.length - 1].value;
  }

  // Find the two points to inverse interpolate between
  let lowerPoint: ParameterMappingEntry = config.points[0];
  let upperPoint: ParameterMappingEntry =
    config.points[config.points.length - 1];

  for (let i = 0; i < config.points.length; i++) {
    if (
      typeof config.points[i].displayNumber === "number" &&
      numericDisplayNumber >= (config.points[i].displayNumber as number)
    ) {
      lowerPoint = config.points[i];
    }
    if (
      typeof config.points[i].displayNumber === "number" &&
      numericDisplayNumber <= (config.points[i].displayNumber as number)
    ) {
      upperPoint = config.points[i];
      break;
    }
  }

  const value = invLerp(
    numericDisplayNumber,
    lowerPoint.displayNumber as number,
    upperPoint.displayNumber as number,
    lowerPoint.value,
    upperPoint.value
  );
  return value;
}

// Parameter configurations
const parameterConfigs = {
  Input: {
    minDisplay: -20.0,
    maxDisplay: 20.0,
    unit: "dB",
    decimalPlaces: 1,
  } as LinearParameterConfig,
  Output: {
    minDisplay: -20.0,
    maxDisplay: 20.0,
    unit: "dB",
    decimalPlaces: 1,
  } as LinearParameterConfig,
  Phase: {
    mappings: [
      { valueRange: [0.0, 0.5], displayText: "Normal", displayNumber: 0.0 },
      { valueRange: [0.5, 1.0], displayText: "Inverted", displayNumber: 1.0 },
    ],
  } as DiscreteParameterConfig,
  "HP Freq": {
    minFreq: 14.8, // Actual min frequency from XML (after "Out")
    maxFreq: 401.0, // Actual max frequency from XML
    specialCases: [
      { valueRange: [0.0, 0.05], displayText: "Out", displayNumber: "Out" },
    ],
    decimalPlaces: 1,
  } as FrequencyParameterConfig,
  "LP Freq": {
    minFreq: 3150, // Actual min frequency from XML (after "Out")
    maxFreq: 21000, // Actual max frequency from XML
    specialCases: [
      { valueRange: [0.0, 0.05], displayText: "Out", displayNumber: "Out" },
    ],
    decimalPlaces: 1,
    reverseScale: true, // LP Freq maps from high to low frequency as value increases
  } as FrequencyParameterConfig,
  "HP/LP Dyn SC": {
    mappings: [
      { valueRange: [0.0, 0.5], displayText: "Off", displayNumber: 0.0 },
      { valueRange: [0.5, 1.0], displayText: "On", displayNumber: 1.0 },
    ],
  } as DiscreteParameterConfig,
  "CMP Ratio": {
    points: [
      { value: 0.0, displayNumber: 1.0, displayText: "1.00:1" },
      { value: 0.01, displayNumber: 1.05, displayText: "1.05:1" },
      { value: 0.05, displayNumber: 1.23, displayText: "1.23:1" },
      { value: 0.1, displayNumber: 1.47, displayText: "1.47:1" },
      { value: 0.2, displayNumber: 1.96, displayText: "1.96:1" },
      { value: 0.3, displayNumber: 2.5, displayText: "2.50:1" },
      { value: 0.4, displayNumber: 3.1, displayText: "3.10:1" },
      { value: 0.5, displayNumber: 3.8, displayText: "3.80:1" },
      { value: 0.6, displayNumber: 4.67, displayText: "4.67:1" },
      { value: 0.7, displayNumber: 5.87, displayText: "5.87:1" },
      { value: 0.8, displayNumber: 7.91, displayText: "7.91:1" },
      { value: 0.9, displayNumber: 13.3, displayText: "13.3:1" },
      { value: 0.95, displayNumber: 23.5, displayText: "23.5:1" },
      { value: 0.99, displayNumber: 103.0, displayText: "103:1" },
      { value: 1.0, displayNumber: "Limit", displayText: "Limit" },
    ],
    unit: ":1",
    decimalPlaces: 2,
  } as CustomCurveParameterConfig,
  "CMP Thresh": {
    minDisplay: 10.0,
    maxDisplay: -20.0,
    unit: "dB",
    decimalPlaces: 1,
  } as LinearParameterConfig,
  "CMP Release": {
    minDisplay: 0.1,
    maxDisplay: 4.0,
    unit: "s",
    decimalPlaces: 2,
  } as LinearParameterConfig,
  "CMP Attack": {
    mappings: [
      { valueRange: [0.0, 0.5], displayText: "Auto", displayNumber: 0.0 },
      { valueRange: [0.5, 1.0], displayText: "Fast", displayNumber: 1.0 },
    ],
  } as DiscreteParameterConfig,
  "Stereo Link": {
    mappings: [
      { valueRange: [0.0, 0.5], displayText: "UnLink", displayNumber: 0.0 },
      { valueRange: [0.5, 1.0], displayText: "Link", displayNumber: 1.0 },
    ],
  } as DiscreteParameterConfig,
  Select: {
    mappings: [
      {
        valueRange: [0.0, 0.24],
        displayText: "Expand",
        displayNumber: "Expand",
      },
      { valueRange: [0.25, 0.74], displayText: "Gate 1", displayNumber: 1.0 },
      { valueRange: [0.75, 1.0], displayText: "Gate 2", displayNumber: 2.0 },
    ],
  } as DiscreteParameterConfig,
  "EXP Thresh": {
    minDisplay: -30.0,
    maxDisplay: 10.0,
    unit: "dB",
    decimalPlaces: 1,
  } as LinearParameterConfig,
  "EXP Range": {
    minDisplay: 0.0,
    maxDisplay: 40.0,
    unit: "dB",
    decimalPlaces: 1,
  } as LinearParameterConfig,
  "EXP Release": {
    minDisplay: 0.1,
    maxDisplay: 4.0,
    unit: "s",
    decimalPlaces: 2,
  } as LinearParameterConfig,
  "EXP Attack": {
    mappings: [
      { valueRange: [0.0, 0.5], displayText: "Auto", displayNumber: 0.0 },
      { valueRange: [0.5, 1.0], displayText: "Fast", displayNumber: 1.0 },
    ],
  } as DiscreteParameterConfig,
  "DYN In": {
    mappings: [
      { valueRange: [0.0, 0.5], displayText: "Out", displayNumber: 0.0 },
      { valueRange: [0.5, 1.0], displayText: "In", displayNumber: 1.0 },
    ],
  } as DiscreteParameterConfig,
  "Comp In": {
    mappings: [
      { valueRange: [0.0, 0.5], displayText: "Out", displayNumber: 0.0 },
      { valueRange: [0.5, 1.0], displayText: "In", displayNumber: 1.0 },
    ],
  } as DiscreteParameterConfig,
  "Exp In": {
    mappings: [
      { valueRange: [0.0, 0.5], displayText: "Out", displayNumber: 0.0 },
      { valueRange: [0.5, 1.0], displayText: "In", displayNumber: 1.0 },
    ],
  } as DiscreteParameterConfig,
  "LF Gain": {
    minDisplay: -15.0,
    maxDisplay: 15.0,
    unit: "dB",
    decimalPlaces: 1,
  } as LinearParameterConfig,
  "LF Freq": {
    minFreq: 34.6,
    maxFreq: 403.0,
    decimalPlaces: 1,
  } as FrequencyParameterConfig,
  "LF Bell": {
    mappings: [
      { valueRange: [0.0, 0.5], displayText: "Shelf", displayNumber: 0.0 },
      { valueRange: [0.5, 1.0], displayText: "Bell", displayNumber: 1.0 },
    ],
  } as DiscreteParameterConfig,
  "LMF Gain": {
    minDisplay: -15.0,
    maxDisplay: 15.0,
    unit: "dB",
    decimalPlaces: 1,
  } as LinearParameterConfig,
  "LMF Freq": {
    minFreq: 135.0,
    maxFreq: 2010.0,
    decimalPlaces: 1,
  } as FrequencyParameterConfig,
  "LMF Q": {
    points: [
      { value: 0.0, displayNumber: 4.0, displayText: "4.00" },
      { value: 0.1, displayNumber: 3.25, displayText: "3.25" },
      { value: 0.2, displayNumber: 2.5, displayText: "2.50" },
      { value: 0.3, displayNumber: 2.17, displayText: "2.17" },
      { value: 0.4, displayNumber: 1.83, displayText: "1.83" },
      { value: 0.5, displayNumber: 1.5, displayText: "1.50" },
      { value: 0.6, displayNumber: 1.2, displayText: "1.20" },
      { value: 0.7, displayNumber: 0.9, displayText: "0.90" },
      { value: 0.8, displayNumber: 0.6, displayText: "0.60" },
      { value: 0.9, displayNumber: 0.5, displayText: "0.50" },
      { value: 1.0, displayNumber: 0.4, displayText: "0.40" },
    ],
    decimalPlaces: 2,
  } as CustomCurveParameterConfig,
  "HMF Q": {
    points: [
      { value: 0.0, displayNumber: 4.0, displayText: "4.00" },
      { value: 0.1, displayNumber: 3.25, displayText: "3.25" },
      { value: 0.2, displayNumber: 2.5, displayText: "2.50" },
      { value: 0.3, displayNumber: 2.17, displayText: "2.17" },
      { value: 0.4, displayNumber: 1.83, displayText: "1.83" },
      { value: 0.5, displayNumber: 1.5, displayText: "1.50" },
      { value: 0.6, displayNumber: 1.2, displayText: "1.20" },
      { value: 0.7, displayNumber: 0.9, displayText: "0.90" },
      { value: 0.8, displayNumber: 0.6, displayText: "0.60" },
      { value: 0.9, displayNumber: 0.5, displayText: "0.50" },
      { value: 1.0, displayNumber: 0.4, displayText: "0.40" },
    ],
    decimalPlaces: 2,
  } as CustomCurveParameterConfig,
  "HMF Gain": {
    minDisplay: -15.0,
    maxDisplay: 15.0,
    unit: "dB",
    decimalPlaces: 1,
  } as LinearParameterConfig,
  "HMF Freq": {
    minFreq: 632.0,
    maxFreq: 9410.0,
    decimalPlaces: 1,
  } as FrequencyParameterConfig,
  "HF Gain": {
    minDisplay: -15.0,
    maxDisplay: 20.0,
    unit: "dB",
    decimalPlaces: 1,
  } as LinearParameterConfig,
  "HF Freq": {
    minFreq: 4100.0,
    maxFreq: 18100.0,
    decimalPlaces: 1,
  } as FrequencyParameterConfig,
  "HF Bell": {
    mappings: [
      { valueRange: [0.0, 0.5], displayText: "Shelf", displayNumber: 0.0 },
      { valueRange: [0.5, 1.0], displayText: "Bell", displayNumber: 1.0 },
    ],
  } as DiscreteParameterConfig,
  "EQ In": {
    mappings: [
      { valueRange: [0.0, 0.5], displayText: "Out", displayNumber: 0.0 },
      { valueRange: [0.5, 1.0], displayText: "In", displayNumber: 1.0 },
    ],
  } as DiscreteParameterConfig,
  "EQ Dyn SC": {
    mappings: [
      { valueRange: [0.0, 0.5], displayText: "Off", displayNumber: 0.0 },
      { valueRange: [0.5, 1.0], displayText: "On", displayNumber: 1.0 },
    ],
  } as DiscreteParameterConfig,
  "Pre Dyn": {
    mappings: [
      { valueRange: [0.0, 0.5], displayText: "Off", displayNumber: 0.0 },
      { valueRange: [0.5, 1.0], displayText: "On", displayNumber: 1.0 },
    ],
  } as DiscreteParameterConfig,
  "EQ Type": {
    mappings: [
      { valueRange: [0.0, 0.5], displayText: "Black", displayNumber: 0.0 },
      { valueRange: [0.5, 1.0], displayText: "Brown", displayNumber: 1.0 },
    ],
  } as DiscreteParameterConfig,
  Power: {
    mappings: [
      { valueRange: [0.0, 0.5], displayText: "Off", displayNumber: 0.0 },
      { valueRange: [0.5, 1.0], displayText: "On", displayNumber: 1.0 },
    ],
  } as DiscreteParameterConfig,
};

// Main UADSSLChannel class
export class UADSSLChannel extends VstPreset {
  public FilePath: string = "";
  public PresetName: string = "";
  public PresetHeaderVar1: number = 3;
  public PresetHeaderVar2: number = 2;

  // Parameter values (0-1 floats)
  public Input: number = 0;
  public Phase: number = 0;
  public HPFreq: number = 0;
  public LPFreq: number = 0;
  public HP_LPDynSC: number = 0;
  public CompRatio: number = 0;
  public CompThresh: number = 0;
  public CompRelease: number = 0;
  public CompAttack: number = 0;
  public StereoLink: number = 0;
  public Select: number = 0;
  public ExpThresh: number = 0;
  public ExpRange: number = 0;
  public ExpRelease: number = 0;
  public ExpAttack: number = 0;
  public DynIn: number = 0;
  public CompIn: number = 0;
  public ExpIn: number = 0;
  public LFGain: number = 0;
  public LFFreq: number = 0;
  public LFBell: number = 0;
  public LMFGain: number = 0;
  public LMFFreq: number = 0;
  public LMFQ: number = 0;
  public HMFQ: number = 0;
  public HMFGain: number = 0;
  public HMFFreq: number = 0;
  public HFGain: number = 0;
  public HFFreq: number = 0;
  public HFBell: number = 0;
  public EQIn: number = 0;
  public EQDynSC: number = 0;
  public PreDyn: number = 0;
  public Output: number = 0;
  public EQType: number = 0;
  public Power: number = 0;

  constructor(input?: Uint8Array) {
    super(input);
    this.Vst3ClassID = VstClassIDs.UADSSLEChannel;
    this.PlugInCategory = "Fx|Channel Strip";
    this.PlugInName = "UAD SSL E Channel Strip";
    this.PlugInVendor = "Universal Audio, Inc.";
  }

  protected preparedForWriting(): boolean {
    this.initCompChunkData();
    this.initInfoXml();
    this.calculateBytePositions();
    return true;
  }

  protected initCompChunkData(): void {
    const bf = new BinaryFile(undefined, ByteOrder.LittleEndian);
    const writer = bf.binaryWriter;
    if (!writer) {
      throw new Error("Failed to create binary writer for chunk data.");
    }

    // Write UAD Preset Header information
    writer.writeInt32(this.PresetHeaderVar1);
    writer.writeInt32(this.PresetHeaderVar2);
    writer.writeString(this.PresetName.padEnd(32, "\0"));

    // Write Parameters
    writer.writeFloat32(this.Input);
    writer.writeFloat32(this.Phase);
    writer.writeFloat32(this.HPFreq);
    writer.writeFloat32(this.LPFreq);
    writer.writeFloat32(this.HP_LPDynSC);
    writer.writeFloat32(this.CompRatio);
    writer.writeFloat32(this.CompThresh);
    writer.writeFloat32(this.CompRelease);
    writer.writeFloat32(this.CompAttack);
    writer.writeFloat32(this.StereoLink);
    writer.writeFloat32(this.Select);
    writer.writeFloat32(this.ExpThresh);
    writer.writeFloat32(this.ExpRange);
    writer.writeFloat32(this.ExpRelease);
    writer.writeFloat32(this.ExpAttack);
    writer.writeFloat32(this.DynIn);
    writer.writeFloat32(this.CompIn);
    writer.writeFloat32(this.ExpIn);
    writer.writeFloat32(this.LFGain);
    writer.writeFloat32(this.LFFreq);
    writer.writeFloat32(this.LFBell);
    writer.writeFloat32(this.LMFGain);
    writer.writeFloat32(this.LMFFreq);
    writer.writeFloat32(this.LMFQ);
    writer.writeFloat32(this.HMFQ);
    writer.writeFloat32(this.HMFGain);
    writer.writeFloat32(this.HMFFreq);
    writer.writeFloat32(this.HFGain);
    writer.writeFloat32(this.HFFreq);
    writer.writeFloat32(this.HFBell);
    writer.writeFloat32(this.EQIn);
    writer.writeFloat32(this.EQDynSC);
    writer.writeFloat32(this.PreDyn);
    writer.writeFloat32(this.Output);
    writer.writeFloat32(this.EQType);
    writer.writeFloat32(this.Power);

    const buffer = writer.getBuffer();
    this.CompChunkData = buffer ? new Uint8Array(buffer) : new Uint8Array();
  }

  public initFromParameters(): void {
    // This method is called by the base class after reading the VST preset file.
    // We need to populate the public properties from the `CompChunkData`.
    if (!this.CompChunkData) {
      console.warn("CompChunkData is not available for UADSSLChannel.");
      return;
    }

    const bf = new BinaryFile(this.CompChunkData, ByteOrder.LittleEndian);
    const reader = bf.binaryReader;
    if (!reader) {
      console.error("Failed to create binary reader for CompChunkData.");
      return;
    }

    try {
      // Read UAD Preset Header information
      this.PresetHeaderVar1 = reader.readInt32();
      this.PresetHeaderVar2 = reader.readInt32();
      this.PresetName = reader.readString(32).replace(/\0+$/, "");

      // Read Parameters
      this.Input = reader.readFloat32();
      this.Phase = reader.readFloat32();
      this.HPFreq = reader.readFloat32();
      this.LPFreq = reader.readFloat32();
      this.HP_LPDynSC = reader.readFloat32();
      this.CompRatio = reader.readFloat32();
      this.CompThresh = reader.readFloat32();
      this.CompRelease = reader.readFloat32();
      this.CompAttack = reader.readFloat32();
      this.StereoLink = reader.readFloat32();
      this.Select = reader.readFloat32();
      this.ExpThresh = reader.readFloat32();
      this.ExpRange = reader.readFloat32();
      this.ExpRelease = reader.readFloat32();
      this.ExpAttack = reader.readFloat32();
      this.DynIn = reader.readFloat32();
      this.CompIn = reader.readFloat32();
      this.ExpIn = reader.readFloat32();
      this.LFGain = reader.readFloat32();
      this.LFFreq = reader.readFloat32();
      this.LFBell = reader.readFloat32();
      this.LMFGain = reader.readFloat32();
      this.LMFFreq = reader.readFloat32();
      this.LMFQ = reader.readFloat32();
      this.HMFQ = reader.readFloat32();
      this.HMFGain = reader.readFloat32();
      this.HMFFreq = reader.readFloat32();
      this.HFGain = reader.readFloat32();
      this.HFFreq = reader.readFloat32();
      this.HFBell = reader.readFloat32();
      this.EQIn = reader.readFloat32();
      this.EQDynSC = reader.readFloat32();
      this.PreDyn = reader.readFloat32();
      this.Output = reader.readFloat32();
      this.EQType = reader.readFloat32();
      this.Power = reader.readFloat32();
    } catch (error) {
      console.error("Error reading UADSSLChannel parameters:", error);
    }
  }

  public getParameterDisplay(
    paramName: string,
    value: number
  ): { displayNumber: number | string; displayText: string } {
    const config = (parameterConfigs as any)[paramName];
    if (!config) {
      return { displayNumber: value, displayText: value.toFixed(2) };
    }

    if ("minDisplay" in config) {
      return getLinearParameterDisplay(value, config as LinearParameterConfig);
    } else if ("minFreq" in config) {
      return getFrequencyParameterDisplay(
        value,
        config as FrequencyParameterConfig
      );
    } else if ("mappings" in config) {
      return getDiscreteParameterDisplay(
        value,
        config as DiscreteParameterConfig
      );
    } else if ("points" in config) {
      return getCustomCurveParameterDisplay(
        value,
        config as CustomCurveParameterConfig
      );
    }
    return { displayNumber: value, displayText: value.toFixed(2) };
  }

  public getParameterValueFromDisplay(
    paramName: string,
    displayNumber: number | string,
    displayText: string
  ): number {
    const config = (parameterConfigs as any)[paramName];
    if (!config) {
      return typeof displayNumber === "number" ? displayNumber : 0;
    }

    if ("minDisplay" in config) {
      return getLinearParameterValue(
        displayNumber as number,
        config as LinearParameterConfig
      );
    } else if ("minFreq" in config) {
      return getFrequencyParameterValue(
        displayNumber as number,
        config as FrequencyParameterConfig
      );
    } else if ("mappings" in config) {
      return getDiscreteParameterValue(
        displayText,
        config as DiscreteParameterConfig
      );
    } else if ("points" in config) {
      return getCustomCurveParameterValue(
        displayNumber as number,
        config as CustomCurveParameterConfig
      );
    }
    return 0;
  }

  public toString(): string {
    const sb: string[] = [];

    sb.push(`PresetName: ${this.PresetName}`);
    sb.push(
      `Input: ${this.Input.toFixed(2)} = ${this.getParameterDisplay("Input", this.Input).displayText}`
    );
    sb.push(
      `Phase: ${this.Phase.toFixed(2)} = ${this.getParameterDisplay("Phase", this.Phase).displayText}`
    );
    sb.push(
      `HP Freq: ${this.HPFreq.toFixed(2)} = ${this.getParameterDisplay("HP Freq", this.HPFreq).displayText}`
    );
    sb.push(
      `LP Freq: ${this.LPFreq.toFixed(2)} = ${this.getParameterDisplay("LP Freq", this.LPFreq).displayText}`
    );
    sb.push(
      `HP/LP Dyn SC: ${this.HP_LPDynSC.toFixed(2)} = ${this.getParameterDisplay("HP/LP Dyn SC", this.HP_LPDynSC).displayText}`
    );
    sb.push(
      `CMP Ratio: ${this.CompRatio.toFixed(2)} = ${this.getParameterDisplay("CMP Ratio", this.CompRatio).displayText}`
    );
    sb.push(
      `CMP Thresh: ${this.CompThresh.toFixed(2)} = ${this.getParameterDisplay("CMP Thresh", this.CompThresh).displayText}`
    );
    sb.push(
      `CMP Release: ${this.CompRelease.toFixed(2)} = ${this.getParameterDisplay("CMP Release", this.CompRelease).displayText}`
    );
    sb.push(
      `CMP Attack: ${this.CompAttack.toFixed(2)} = ${this.getParameterDisplay("CMP Attack", this.CompAttack).displayText}`
    );
    sb.push(
      `Stereo Link: ${this.StereoLink.toFixed(2)} = ${this.getParameterDisplay("Stereo Link", this.StereoLink).displayText}`
    );
    sb.push(
      `Select: ${this.Select.toFixed(2)} = ${this.getParameterDisplay("Select", this.Select).displayText}`
    );
    sb.push(
      `EXP Thresh: ${this.ExpThresh.toFixed(2)} = ${this.getParameterDisplay("EXP Thresh", this.ExpThresh).displayText}`
    );
    sb.push(
      `EXP Range: ${this.ExpRange.toFixed(2)} = ${this.getParameterDisplay("EXP Range", this.ExpRange).displayText}`
    );
    sb.push(
      `EXP Release: ${this.ExpRelease.toFixed(2)} = ${this.getParameterDisplay("EXP Release", this.ExpRelease).displayText}`
    );
    sb.push(
      `EXP Attack: ${this.ExpAttack.toFixed(2)} = ${this.getParameterDisplay("EXP Attack", this.ExpAttack).displayText}`
    );
    sb.push(
      `DYN In: ${this.DynIn.toFixed(2)} = ${this.getParameterDisplay("DYN In", this.DynIn).displayText}`
    );
    sb.push(
      `Comp In: ${this.CompIn.toFixed(2)} = ${this.getParameterDisplay("Comp In", this.CompIn).displayText}`
    );
    sb.push(
      `Exp In: ${this.ExpIn.toFixed(2)} = ${this.getParameterDisplay("Exp In", this.ExpIn).displayText}`
    );
    sb.push(
      `LF Gain: ${this.LFGain.toFixed(2)} = ${this.getParameterDisplay("LF Gain", this.LFGain).displayText}`
    );
    sb.push(
      `LF Freq: ${this.LFFreq.toFixed(2)} = ${this.getParameterDisplay("LF Freq", this.LFFreq).displayText}`
    );
    sb.push(
      `LF Bell: ${this.LFBell.toFixed(2)} = ${this.getParameterDisplay("LF Bell", this.LFBell).displayText}`
    );
    sb.push(
      `LMF Gain: ${this.LMFGain.toFixed(2)} = ${this.getParameterDisplay("LMF Gain", this.LMFGain).displayText}`
    );
    sb.push(
      `LMF Freq: ${this.LMFFreq.toFixed(2)} = ${this.getParameterDisplay("LMF Freq", this.LMFFreq).displayText}`
    );
    sb.push(
      `LMF Q: ${this.LMFQ.toFixed(2)} = ${this.getParameterDisplay("LMF Q", this.LMFQ).displayText}`
    );
    sb.push(
      `HMF Q: ${this.HMFQ.toFixed(2)} = ${this.getParameterDisplay("HMF Q", this.HMFQ).displayText}`
    );
    sb.push(
      `HMF Gain: ${this.HMFGain.toFixed(2)} = ${this.getParameterDisplay("HMF Gain", this.HMFGain).displayText}`
    );
    sb.push(
      `HMF Freq: ${this.HMFFreq.toFixed(2)} = ${this.getParameterDisplay("HMF Freq", this.HMFFreq).displayText}`
    );
    sb.push(
      `HF Gain: ${this.HFGain.toFixed(2)} = ${this.getParameterDisplay("HF Gain", this.HFGain).displayText}`
    );
    sb.push(
      `HF Freq: ${this.HFFreq.toFixed(2)} = ${this.getParameterDisplay("HF Freq", this.HFFreq).displayText}`
    );
    sb.push(
      `HF Bell: ${this.HFBell.toFixed(2)} = ${this.getParameterDisplay("HF Bell", this.HFBell).displayText}`
    );
    sb.push(
      `EQ In: ${this.EQIn.toFixed(2)} = ${this.getParameterDisplay("EQ In", this.EQIn).displayText}`
    );
    sb.push(
      `EQ Dyn SC: ${this.EQDynSC.toFixed(2)} = ${this.getParameterDisplay("EQ Dyn SC", this.EQDynSC).displayText}`
    );
    sb.push(
      `Pre Dyn: ${this.PreDyn.toFixed(2)} = ${this.getParameterDisplay("Pre Dyn", this.PreDyn).displayText}`
    );
    sb.push(
      `Output: ${this.Output.toFixed(2)} = ${this.getParameterDisplay("Output", this.Output).displayText}`
    );
    sb.push(
      `EQ Type: ${this.EQType.toFixed(2)} = ${this.getParameterDisplay("EQ Type", this.EQType).displayText}`
    );
    sb.push(
      `Power: ${this.Power.toFixed(2)} = ${this.getParameterDisplay("Power", this.Power).displayText}`
    );

    return sb.join("\n");
  }
}
