import { MultiFormatConverter } from "../converters/MultiFormatConverter";

/**
 * Represents the central registry for storing and retrieving converters.
 * It is a nested structure where the first level keys are 'from' type names (strings),
 * the second level keys are 'to' type names (strings), and the values are
 * instances of `MultiFormatConverter`.
 */
export type ConverterRegistry = Record<
  string, // from type name string
  Record<
    string, // to type name string
    MultiFormatConverter<any, any>
  >
>;

/**
 * Represents a registration entry for one or more source types
 * that can be handled by a single converter instance.
 */
export type ConverterRegistration = {
  /**
   * An array of source type names (strings) that the converter can convert from.
   */
  fromTypes: string[];
  /**
   * The converter instance capable of performing the conversion.
   */
  converter: MultiFormatConverter<any, any>;
};

const converterRegistry: ConverterRegistry = {};

/**
 * Registers a single converter in the registry.
 * @param converter The converter to register.
 */
export function registerConverter(
  converter: MultiFormatConverter<any, any>
): void {
  const fromType = converter.from; // string, e.g. "AbletonEq8"
  const toType = converter.to; // string, e.g. "FabFilterProQ3"

  if (!converterRegistry[fromType]) {
    converterRegistry[fromType] = {};
  }
  converterRegistry[fromType][toType] = converter;
}

/**
 * Registers a list of converters.
 * Each registration can specify multiple `from` types for a single converter instance.
 * This function ensures converters are registered only once.
 * @param converters An array of ConverterRegistration objects.
 */
export function registerAllConverters(converters: ConverterRegistration[]) {
  // Clear existing registry to allow re-registration on HMR
  for (const fromType in converterRegistry) {
    delete converterRegistry[fromType];
  }

  converters.forEach(({ fromTypes, converter }) => {
    fromTypes.forEach(from => {
      // Clone the converter with an overridden `from`
      const clonedConverter: MultiFormatConverter<any, any> = {
        ...converter,
        from,
      };
      registerConverter(clonedConverter);
    });
  });

  console.debug("All converters registered.");
}

/**
 * Retrieves all registered converters that can convert from a specified type.
 * @param fromType The name of the source type (e.g., "AbletonEq8").
 * @returns An array of MultiFormatConverter instances that convert from the specified type, or an empty array if no converters are found for the given `fromType`.
 */
export function getConvertersForFromType(
  fromType: string
): MultiFormatConverter<any, any>[] {
  if (!converterRegistry[fromType]) return [];
  return Object.values(converterRegistry[fromType]);
}

/**
 * Retrieves a specific converter based on the source and target types.
 * @param fromType The name of the source type (e.g., "AbletonEq8").
 * @param toType The name of the target type (e.g., "FabFilterProQ3").
 * @returns The matching MultiFormatConverter instance, or `undefined` if no converter is found for the specified `fromType` and `toType` combination.
 */
export function getConverter(
  fromType: string,
  toType: string
): MultiFormatConverter<any, any> | undefined {
  return converterRegistry[fromType]?.[toType];
}
