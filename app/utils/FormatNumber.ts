/**
 * Formats a number as a zero-padded string with a fixed number of digits.
 *
 * @param n - The number to format.
 * @param digits - The total number of digits in the output string. Defaults to 2.
 * @returns A string representation of the number, padded with leading zeros if necessary.
 *
 * @example
 * formatNumber(5);       // "05"
 * formatNumber(42);      // "42"
 * formatNumber(7, 3);    // "007"
 */
export function formatNumber(n: number, digits: number = 2): string {
  return n.toString().padStart(digits, "0");
}
