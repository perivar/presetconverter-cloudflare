import { AbletonPlugin } from "./AbletonPlugin";

export enum FilterSlope {
  Slope24 = 0,
  Slope48 = 1,
}

export class AbletonEq3Band {
  Freq: number;
  Gain: number; // Stored in dB
  IsOn: boolean;
  Slope: FilterSlope;

  constructor(freq: number, gain: number, isOn: boolean, slope: FilterSlope) {
    this.Freq = freq;
    this.Gain = gain;
    this.IsOn = isOn;
    this.Slope = slope;
  }

  toString(): string {
    return `Freq: ${this.Freq}, Gain: ${this.Gain.toFixed(2)} dB, Slope: ${FilterSlope[this.Slope]}, On: ${this.IsOn ? "On" : "Off"}`;
  }
}

export class AbletonEq3 implements AbletonPlugin {
  Bands: AbletonEq3Band[] = [];

  // --- Static Conversion Methods (Unchanged) ---
  static amplitudeRatio2Decibel(value: number): number {
    if (value <= 0) return -Infinity; // Avoid log(0) or log(-ve)
    return 20 * Math.log10(value);
  }

  static decibel2AmplitudeRatio(value: number): number {
    return Math.pow(10, value / 20);
  }
  // --- End Static Conversion Methods ---

  constructor(xElement: any) {
    // Allow any for flexibility with parser output
    // Directly parse bands using the simplified method
    const bandLow = this.parseBand(
      xElement,
      "FreqLo",
      "GainLo",
      "LowOn",
      "Slope"
    );
    if (bandLow) this.Bands.push(bandLow);

    const bandMid = this.parseBand(
      xElement,
      "FreqMid",
      "GainMid",
      "MidOn",
      "Slope"
    );
    if (bandMid) this.Bands.push(bandMid);

    const bandHigh = this.parseBand(
      xElement,
      "FreqHi",
      "GainHi",
      "HighOn",
      "Slope"
    );
    if (bandHigh) this.Bands.push(bandHigh);
  }

  private parseBand(
    xElement: any, // Allow any type from parser
    freqName: string,
    gainName: string,
    onName: string,
    slopeName: string // Slope is shared across bands in EQ3
  ): AbletonEq3Band | null {
    if (!xElement) return null;

    // Simplify access using optional chaining and nullish coalescing
    // Assumes structure like: xElement.FreqLo.Manual.@_Value
    const freqStr = xElement?.[freqName]?.Manual?.["@_Value"] ?? "0";
    const gainStr = xElement?.[gainName]?.Manual?.["@_Value"] ?? "1"; // Default gain ratio is 1 (0 dB)
    const onStr = xElement?.[onName]?.Manual?.["@_Value"] ?? "true"; // Default ON is true for EQ3 bands? Check Ableton default. Assuming true.
    const slopeStr = xElement?.[slopeName]?.Manual?.["@_Value"] ?? "0"; // Default slope 24dB

    const freq = parseFloat(freqStr);
    const gainAmplitude = parseFloat(gainStr);
    // Convert amplitude ratio to dB *during* parsing
    const gain = AbletonEq3.amplitudeRatio2Decibel(gainAmplitude);
    const isOn = String(onStr).toLowerCase() === "true"; // Ensure boolean conversion
    const slope = parseInt(slopeStr, 10) as FilterSlope;

    // Validate parsed numbers
    if (isNaN(freq) || isNaN(gain) || isNaN(slope)) {
      console.warn(
        `[AbletonEq3] Invalid number encountered during parsing band: Freq=${freqStr}, Gain=${gainStr}, Slope=${slopeStr}`
      );
      return null; // Or handle error appropriately
    }

    return new AbletonEq3Band(freq, gain, isOn, slope);
  }

  /**
   * Checks if the EQ is active due to have been changed from the default values.
   * @returns True if any band is active (on) and has a non-zero Gain (in dB). False otherwise.
   */
  hasBeenModified(): boolean {
    // Check against default values (0 dB gain)
    // Note: Default frequency/slope might also be relevant depending on exact definition of "modified"
    for (const band of this.Bands) {
      // Use a small tolerance for floating point comparison
      if (band.IsOn && Math.abs(band.Gain) > 0.01) {
        return true;
      }
      // Add checks for Freq/Slope if needed, comparing against Ableton defaults
    }
    return false;
  }
}
