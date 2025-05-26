import { MultiFormatConverter } from "../converters/MultiFormatConverter";

/**
 * Represents the registry structure mapping fromType -> toType -> converter.
 */
type Registry = Record<
  string, // from type name string
  Record<
    string, // to type name string
    MultiFormatConverter<any, any>
  >
>;

let isRegistered = false;
const converterRegistry: Registry = {};

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
 * Registers a list of converters. Skips registration if already registered.
 * @param converters An array of converters to register.
 */
export function registerAllConverters(
  converters: MultiFormatConverter<any, any>[]
) {
  if (isRegistered) {
    console.debug("Converters already registered, skipping.");
    return;
  }
  isRegistered = true;

  converters.forEach(registerConverter);
  console.debug(`Registered ${converters.length} converters.`);
}

/**
 * Gets all registered converters that convert from a specific type.
 * @param fromType The type name to get converters for.
 * @returns An array of converters that convert from the specified type, or an empty array if none are found.
 */
export function getConvertersForFromType(
  fromType: string
): MultiFormatConverter<any, any>[] {
  if (!converterRegistry[fromType]) return [];
  return Object.values(converterRegistry[fromType]);
}

/**
 * Gets a specific converter based on the from and to types.
 * @param fromType The type name to convert from.
 * @param toType The type name to convert to.
 * @returns The matching converter, or undefined if not found.
 */
export function getConverter(
  fromType: string,
  toType: string
): MultiFormatConverter<any, any> | undefined {
  return converterRegistry[fromType]?.[toType];
}
