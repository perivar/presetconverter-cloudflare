// DoubleAdapter for handling infinite values
export class DoubleAdapter {
  /**
   * Converts a number to a string, representing Infinity as 'inf' and -Infinity as '-inf'.
   * @param value - The number to marshal.
   * @returns The string representation.
   */
  static marshal(value: number | undefined): string | undefined {
    if (value === Infinity) return "inf";
    if (value === -Infinity) return "-inf";
    return value !== undefined ? value.toString() : undefined;
  }

  /**
   * Converts a string to a number, parsing 'inf' as Infinity and '-inf' as -Infinity.
   * @param value - The string to unmarshal.
   * @returns The number or undefined.
   */
  static unmarshal(value: string | undefined): number | undefined {
    if (value === "inf") return Infinity;
    if (value === "-inf") return -Infinity;
    return value !== undefined ? parseFloat(value) : undefined;
  }
}
