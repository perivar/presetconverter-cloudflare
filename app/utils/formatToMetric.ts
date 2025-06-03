// utils/metricFormatter.ts

/**
 * Interface representing the format of the metric.
 *
 * @property {number} value - The formatted value.
 * @property {string} shortUnit - The short form of the metric unit.
 * @property {string} longUnit - The long form of the metric unit.
 */
export interface MetricFormat {
  value: number;
  shortUnit: string;
  longUnit: string;
}

/**
 * Formats a number into the appropriate metric unit.
 *
 * @param {number} value - The number to be formatted.
 * @returns {MetricFormat} An object containing the formatted value and the corresponding metric units.
 */
export function formatToMetric(value: number): MetricFormat {
  const shortUnits = ["", "k", "M", "G", "T", "P", "E", "Z", "Y"];
  const longUnits = [
    "",
    "kilo",
    "mega",
    "giga",
    "tera",
    "peta",
    "exa",
    "zetta",
    "yotta",
  ];

  let unitIndex = 0;

  while (value >= 1000 && unitIndex < shortUnits.length - 1) {
    value /= 1000;
    unitIndex++;
  }

  return {
    value,
    shortUnit: shortUnits[unitIndex],
    longUnit: longUnits[unitIndex],
  };
}
