import { VstPreset } from "./VstPreset";

export interface FabfilterProQBand {
  Frequency: number;
  Gain: number;
  Q: number;
  Enabled: boolean;
}

// Fabfilter Q factor typically ranges from 0.025 to 40
// 0.312098175
const FABFILTER_Q_SCALING_FACTOR = 1 / Math.log10(40 / 0.025);
/**
 * Base class for reading and writing Fabfilter Pro Q (1 or 2) Preset files.
 */
export abstract class FabfilterProQBase extends VstPreset {
  constructor() {
    super();
  }

  abstract initFromParameters(parameters?: number[], isIEEE?: boolean): void;
  abstract Bands: FabfilterProQBand[];

  // Abstract method for writing Fabfilter Pro Q preset files.
  abstract writeFFP(): Uint8Array | undefined;

  // Abstract method for reading Fabfilter Pro Q preset files.
  abstract readFFP(data: Uint8Array, doReadHeader: boolean): boolean;

  /**
   * Converts a float value between 0 and 1 to the Fabfilter float equivalent.
   * @param value - The value to convert.
   * @returns Converted frequency float.
   */
  static ieeeFloatToFrequencyFloat(ieeeFloat: number): number {
    // return 11.5507311008828 * ieeeFloat + 3.32193432374016;
    return 11.550746344 * ieeeFloat + Math.log2(10);
  }

  // log and inverse log
  // a ^ x = b
  // x = log(b) / log(a)

  /**
   * Converts a frequency to the Fabfilter equivalent using logarithmic scaling.
   * @param value - The frequency to convert.
   * @returns The converted frequency.
   */
  static freqConvert(value: number): number {
    // =LOG(A1)/LOG(2) (default = 1000 Hz)
    // return Math.log10(value) / Math.log10(2);
    return Math.log2(value);
  }

  /**
   * Converts a Fabfilter frequency value back to the original frequency.
   * @param value - The Fabfilter frequency value.
   * @returns The original frequency.
   */
  static freqConvertBack(value: number): number {
    // =POWER(2; frequency)
    return Math.pow(2, value);
  }

  /**
   * Converts a Q factor value using logarithmic scaling.
   * @param value - The Q factor to convert.
   * @returns The converted Q factor.
   */
  static qConvert(value: number): number {
    // =LOG(F1)*0,312098175+0,5 (default = 1)
    return Math.log10(value) * FABFILTER_Q_SCALING_FACTOR + 0.5;
  }

  /**
   * Converts a Fabfilter Q factor value back to the original Q factor.
   * @param value - The Fabfilter Q factor value.
   * @returns The original Q factor.
   */
  static qConvertBack(value: number): number {
    // =POWER(10;((B3-0,5)/0,312098175))
    return Math.pow(10, (value - 0.5) / FABFILTER_Q_SCALING_FACTOR);
  }
}
