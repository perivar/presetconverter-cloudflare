// app/utils/dawproject-new/DoubleAdapter.ts

/**
 * Adapter for serializing and deserializing double values with a fixed precision.
 */
export class DoubleAdapter {
  private precision: number;

  constructor(precision: number = 6) {
    this.precision = precision;
  }

  /**
   * Formats a number to a string with the configured precision.
   * @param value The number to format.
   * @returns The formatted string.
   */
  public serialize(value: number): string {
    return value.toFixed(this.precision);
  }

  /**
   * Parses a string to a number.
   * @param value The string to parse.
   * @returns The parsed number.
   */
  public deserialize(value: string): number {
    return parseFloat(value);
  }
}
