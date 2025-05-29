import { AbletonPlugin } from "./AbletonPlugin";

export enum AbletonEq8BandMode {
  LowCut48 = 0,
  LowCut12 = 1,
  LeftShelf = 2,
  Bell = 3,
  Notch = 4,
  RightShelf = 5,
  HighCut12 = 6,
  HighCut48 = 7,
}

export enum AbletonEq8ChannelMode {
  Stereo = 0, // Default
  LeftRight = 1,
  MidSide = 2,
}

export class AbletonEq8Band {
  Parameter: string; // Parameter A or B
  Number: number; // Band index (0-7)
  IsOn: boolean;
  Mode: AbletonEq8BandMode;
  Freq: number;
  Gain: number; // Stored in dB
  Q: number;

  constructor(
    parameter: string,
    number: number,
    isOn: boolean,
    mode: AbletonEq8BandMode,
    freq: number,
    gain: number,
    q: number
  ) {
    this.Parameter = parameter;
    this.Number = number;
    this.IsOn = isOn;
    this.Mode = mode;
    this.Freq = freq;
    this.Gain = gain;
    this.Q = q;
  }

  toString(): string {
    return `Band: ${this.Number + 1}, ${this.Freq.toFixed(2)} Hz, Gain: ${this.Gain.toFixed(2)} dB, Q: ${this.Q.toFixed(2)}, Mode: ${AbletonEq8BandMode[this.Mode]}, ${this.IsOn ? "On" : "Off"}`;
  }
}

export class AbletonEq8 extends AbletonPlugin {
  Mode: AbletonEq8ChannelMode = AbletonEq8ChannelMode.Stereo;
  Bands: AbletonEq8Band[] = [];

  constructor(xElement: any) {
    super();

    // Parse Channel Mode from <Mode Value="...">
    this.Mode =
      (parseInt(
        xElement?.Mode?.["@_Value"] ?? "0",
        10
      ) as AbletonEq8ChannelMode) ?? AbletonEq8ChannelMode.Stereo;

    // --- Parse Bands ---
    const bandElements: any[] = [];
    // Look for elements named like Band.0, Band.1, ... Band.7 directly under xElement
    for (let i = 0; i < 8; i++) {
      const bandKey = `Bands.${i}`;
      if (xElement?.[bandKey]) {
        // Add the band index info if not present in the element itself
        const bandData = xElement[bandKey];
        bandData._index = i; // Store index for parseBand
        bandElements.push(bandData);
      }
    }

    // If still no bands found, log a warning
    if (bandElements.length === 0) {
      console.warn(
        "[AbletonEq8] Could not find band elements in the provided XML structure.",
        xElement
      );
    }

    for (let i = 0; i < bandElements.length; i++) {
      const bandElement = bandElements[i];
      const bandIndex = bandElement?._index ?? i; // Pass the index explicitly if not stored in the element earlier

      // Parse ParameterA and ParameterB for each band element, similar to C#
      const parsedBandA = this.parseBand(bandElement, bandIndex, "ParameterA");
      if (parsedBandA) {
        this.Bands.push(parsedBandA);
      }

      const parsedBandB = this.parseBand(bandElement, bandIndex, "ParameterB");
      if (parsedBandB) {
        this.Bands.push(parsedBandB);
      }
    }

    // Sort bands by number just in case parsing order wasn't guaranteed
    this.Bands.sort((a, b) => a.Number - b.Number);
  }

  toString(): string {
    return this.Bands.map(band => band.toString()).join("\n");
  }

  private parseBand(
    bandElement: any, // Allow any type from parser
    bandIndex: number, // Explicitly pass band index
    parameter: string // Parameter A or B
  ): AbletonEq8Band | null {
    if (!bandElement) return null;

    // Simplify access using optional chaining and nullish coalescing
    // Assumes structure like: bandElement.ParameterA.IsOn.Manual.@_Value
    // ParameterA seems to hold the primary band controls in Ableton's XML
    const param = bandElement?.[parameter];
    if (!param) {
      console.warn(
        `[AbletonEq8] Missing ${parameter} for band index ${bandIndex}`
      );
      return null;
    }

    const isOnStr = param.IsOn?.Manual?.["@_Value"] ?? "true"; // Default ON is true for EQ8 bands
    const modeStr = param.Mode?.Manual?.["@_Value"] ?? "3"; // Default mode is Bell
    const freqStr = param.Freq?.Manual?.["@_Value"] ?? "1000"; // Default Freq varies per band, use a common default or handle per band
    const gainStr = param.Gain?.Manual?.["@_Value"] ?? "0"; // Default Gain is 0 dB
    const qStr = param.Q?.Manual?.["@_Value"] ?? "1"; // Default Q is 1

    const isOn = String(isOnStr).toLowerCase() === "true";
    const mode = parseInt(modeStr, 10) as AbletonEq8BandMode;
    const freq = parseFloat(freqStr);
    const gain = parseFloat(gainStr); // Gain is already in dB in EQ8 XML
    const q = parseFloat(qStr);

    // Validate parsed numbers
    if (isNaN(mode) || isNaN(freq) || isNaN(gain) || isNaN(q)) {
      console.warn(
        `[AbletonEq8] Invalid number encountered during parsing band ${bandIndex}: Mode=${modeStr}, Freq=${freqStr}, Gain=${gainStr}, Q=${qStr}`
      );
      return null;
    }

    return new AbletonEq8Band(parameter, bandIndex, isOn, mode, freq, gain, q);
  }

  /**
   * Checks if the EQ is active due to have been changed from the default values.
   * @returns True if any band is active (on) and meets modification criteria (non-zero gain or specific filter types). False otherwise.
   */
  hasBeenModified(): boolean {
    // Default EQ8 state: All bands ON, Bell mode, Gain 0, Q 0.71 (approx), Freq varies.
    // We simplify by checking if any band is ON and has non-zero gain OR is a filter type.
    for (const band of this.Bands) {
      // Check if gain is significantly different from 0 dB
      if (band.IsOn && Math.abs(band.Gain) > 0.01) {
        return true;
      }
      // Check if an active band is a filter type (LowCut/HighCut)
      if (
        band.IsOn &&
        (band.Mode === AbletonEq8BandMode.LowCut48 ||
          band.Mode === AbletonEq8BandMode.LowCut12 ||
          band.Mode === AbletonEq8BandMode.HighCut12 ||
          band.Mode === AbletonEq8BandMode.HighCut48)
      ) {
        // Filters are considered modifications even with 0 gain
        return true;
      }
      // Add more checks if needed (e.g., Q changed significantly from default, Freq changed)
    }
    return false;
  }
}
