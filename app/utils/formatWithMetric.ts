import { formatToMetric } from "./formatToMetric";

/**
 * Formats a number into the appropriate metric unit with a custom formatter.
 *
 * @param {number | undefined} value - The number to be formatted.
 * @param {string} baseUnit - The base unit of the number.
 * @param {number} multiplier - The multiplier to apply to the value. If the value is already kilo, send a multiplier of 1000
 * @param {(value: number) => string} numberFormatter - The formatter function to apply to the value.
 * @returns {string} The formatted string.
 */
export function formatWithMetric(
  value: number | undefined,
  baseUnit: string,
  multiplier: number,
  formatter?: Intl.NumberFormat
): string {
  if (value === undefined) return "0";

  if (!formatter) {
    formatter = new Intl.NumberFormat(undefined, {
      style: "decimal",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  const metric = formatToMetric(multiplier * value);
  const formatted = formatter.format(metric.value);

  return `${formatted} ${metric.shortUnit}${baseUnit}`;
}
