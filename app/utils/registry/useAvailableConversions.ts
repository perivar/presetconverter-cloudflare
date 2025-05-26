import { getConvertersForFromType } from "./converterRegistry";

/**
 * Hook to get a list of available conversion options for a given 'from' type.
 * This flattens the output formats of all relevant converters into a single list.
 * @param fromType The type name to find available conversions for.
 * @returns An array of available conversion options, each including metadata and a conversion function.
 * @example
 * const availableConversions = useAvailableConversions("AbletonEq8");
 * console.log(availableConversions);
 * // Output might look like:
 * // [
 * //   {
 * //     to: "FabFilterProQ3",
 * //     displayName: "Ableton EQ Eight to FabFilter Pro-Q 3 (FabFilter Preset)",
 * //     formatId: "fabfilter-proq3-ffp",
 * //     extension: "ffp",
 * //     convert: [Function]
 * //   },
 * //   {
 * //     to: "SteinbergFrequency",
 * //     displayName: "Ableton EQ Eight to Steinberg Frequency (VSTPreset)",
 * //     formatId: "steinberg-frequency-vstpreset",
 * //     extension: "vstpreset",
 * //     convert: [Function]
 * //   }
 * // ]
 */
export function useAvailableConversions(fromType: string) {
  // Get all converters that convert from this type
  const converters = getConvertersForFromType(fromType);

  // Flatten all output formats into one list with extra metadata
  return converters.flatMap(converter =>
    converter.outputFormats.map(output => ({
      to: converter.to,
      displayName: `${converter.displayName} (${output.displayName})`,
      formatId: output.formatId,
      extension: output.extension,
      // Convert expects a preset of the 'from' type, forward it here
      convert: (preset: any) => output.convert(preset),
    }))
  );
}
