/**
 * Rounds a float to a specified number of digits after the decimal separator.
 *
 * @param value - The float value to round.
 * @param decimalPlaces - The number of digits to keep after the decimal separator.
 * @returns The rounded number.
 */
export function roundToNumber(
  value: number,
  decimalPlaces: number = 4
): number {
  const factor = Math.pow(10, decimalPlaces);
  return Math.round(value * factor) / factor;
}

/**
 * Gets the decimal separator used in the current locale.
 *
 * @returns The decimal separator as a string, typically a period (.) or a comma (,).
 */
export function getDecimalSeparator(): string {
  const numberWithDecimal = 1.1; // A sample number that contains a decimal
  // Format the number and extract the character at index 1, which is the decimal separator
  return Intl.NumberFormat().format(numberWithDecimal).charAt(1);
}

/**
 * Parses a string to a float using a specified decimal separator.
 *
 * @param value - The string value to parse, which may contain non-numeric characters.
 * @param decimalSeparator - The character used as the decimal separator in the input string.
 * @returns The parsed float value.
 */
export function parseFloatWithSeparator(
  value: string,
  decimalSeparator: string = "."
): number {
  // Create a regular expression to match any character that is not a digit or the specified decimal separator
  const digitsAndDecimalSeparatorOnly = new RegExp(
    `[^\\d${decimalSeparator}\\-]`,
    "g"
  );

  // Replace all non-digit and non-decimal separator characters with an empty string
  const onlyDigitsAndDecimalSeparator = value.replace(
    digitsAndDecimalSeparatorOnly,
    ""
  );

  // Replace the decimal separator with a dot (.) to standardize for parsing
  const normalizedValue = onlyDigitsAndDecimalSeparator.replace(
    decimalSeparator,
    "."
  );

  // Use parseFloat to convert the normalized string to a number
  return parseFloat(normalizedValue);
}

/**
 * Maps a value from one range to another while maintaining the ratio.
 * For example, converting a value from 0-1 range to -30 to +30 range.
 *
 * @param value - The value to convert
 * @param fromMin - The minimum value of the source range
 * @param fromMax - The maximum value of the source range
 * @param toMin - The minimum value of the target range
 * @param toMax - The maximum value of the target range
 * @returns The converted value in the target range
 */
export function convertAndMaintainRatio(
  value: number,
  fromMin: number,
  fromMax: number,
  toMin: number,
  toMax: number
): number {
  const fromRange = fromMax - fromMin;
  const toRange = toMax - toMin;
  const scaledValue = (value - fromMin) / fromRange;
  return toMin + scaledValue * toRange;
}
