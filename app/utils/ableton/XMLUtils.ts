import {
  XMLBuilder,
  XMLParser,
  XMLValidator,
  type ValidationError,
} from "fast-xml-parser";

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  parseAttributeValue: false, // do not convert strings to number automatically
  parseTagValue: false, // do not convert strings to number automatically
});

const builder = new XMLBuilder({
  format: true,
  ignoreAttributes: false,
});

/**
 * Parses an XML string into a JavaScript object.
 * @param xmlData - The raw XML string to parse.
 * @returns Parsed JS object.
 */
export function parseXml(xmlData: string): any {
  return parser.parse(xmlData);
}

/**
 * Converts a JavaScript object back into a formatted XML string.
 * @param obj - The JS object to convert.
 * @returns XML string.
 */
export function toXmlString(obj: any): string {
  return builder.build(obj);
}

/**
 * Validates an XML string for well-formedness.
 * @param xmlString - The raw XML string to validate.
 * @returns `true` if valid, or a `ValidationError` object if invalid.
 */
export function validateXml(xmlString: string): true | ValidationError {
  return XMLValidator.validate(xmlString, {
    allowBooleanAttributes: true,
  });
}

/**
 * Result of {@link splitPath}.
 */
export interface SplitPathResult {
  /** Segments up to—but not including—the last occurrence of {@link splitOn}. */
  before: string[];
  /** Segments after the last occurrence of {@link splitOn}, with {@link removeSuffix} trimmed. */
  after: string[];
}

/**
 * Splits a path array on the **last** occurrence of `splitOn`.
 *
 * - `before` → every segment **before** the last `splitOn`.
 * - `after`  → every segment **after** the last `splitOn`,
 *              with the trailing `removeSuffix` removed if present.
 *
 * If `splitOn` is **not found**, both `before` and `after`
 * are set to clones of the original array (mirrors original C# fallback).
 *
 * @param pathArray   Full path broken into segments.
 * @param splitOn     Marker to split on (last occurrence wins).
 * @param removeSuffix Segment to drop from the end of the `after` array if present.
 * @returns An object: `{ before, after }`.
 *
 * @example
 * const path = [
 *   "AudioEffectGroupDevice", "Branches", "AudioEffectBranch",
 *   "DeviceChain", "AudioToAudioDeviceChain", "Devices",
 *   "PluginDevice", "ParameterList", "PluginFloatParameter",
 *   "ParameterValue", "AutomationTarget"
 * ];
 *
 * const { before, after } = splitPath(path, "Devices", "AutomationTarget");
 * // before = [
 * //   "AudioEffectGroupDevice", "Branches", "AudioEffectBranch",
 * //   "DeviceChain", "AudioToAudioDeviceChain"
 * // ]
 * // after  = [
 * //   "PluginDevice", "ParameterList",
 * //   "PluginFloatParameter", "ParameterValue"
 * // ]
 */
export function splitPath(
  pathArray: string[],
  splitOn: string,
  removeSuffix: string
): SplitPathResult {
  const lastIdx = pathArray.lastIndexOf(splitOn);

  if (lastIdx === -1) {
    // Return original array twice if marker absent
    const clone = [...pathArray];
    return { before: clone, after: clone };
  }

  const before = pathArray.slice(0, lastIdx);
  let after = pathArray.slice(lastIdx + 1);

  if (after[after.length - 1] === removeSuffix) {
    after = after.slice(0, -1);
  }

  return { before, after };
}

/**
 * Retrieves a nested element from a Fast‑XML‑Parser object using a compact,
 * XPath‑like string that supports **array indexes** (`Tag[n]`) and an optional
 * **id filter** (`Tag[@id='…']`) on the **final** segment.
 *
 * Segment grammar
 * ---------------
 *  • `Tag`              → first occurrence (index 0 if array)
 *  • `Tag[n]`           → **1‑based** index `n` (XPath‑style)
 *  • `Tag[@id='value']` → **only** on last segment, matches `@_id` attribute
 *
 * @param obj      Parsed XML object (created with `{ ignoreAttributes: false }`).
 * @param pathStr  Path such as `"Root/Child[2]"` or `"Root/Child[@id='foo']"`.
 * @returns        The matched element, or `undefined` if the path cannot be resolved.
 *
 * @example
 * import { XMLParser } from "fast-xml-parser";
 *
 * const xml = `<Root><Item id="a"/><Item id="b"/></Root>`;
 * const parsed = new XMLParser({ ignoreAttributes: false }).parse(xml);
 *
 * getElementByPath(parsed, "Root/Item[2]");           // ⇒ <Item id="b">
 * getElementByPath(parsed, "Root/Item[@id='a']");     // ⇒ <Item id="a">
 */
export function getElementByPath(obj: any, pathStr: string): any {
  interface Step {
    tag: string;
    index?: number; // zero‑based, if [n] was supplied
    id?: string; // only for last step
  }

  /** Parse one path segment into { tag, index?, id? }. */
  const parseSegment = (segment: string, isLast: boolean): Step => {
    // Tag[n]  -----------------------------------------
    const idx = segment.match(/^([^\[]+)\[(\d+)]$/);
    if (idx) return { tag: idx[1], index: parseInt(idx[2], 10) - 1 };

    // Tag[@id='value']  (only valid on last segment) ---
    if (isLast) {
      const id = segment.match(/^([^\[]+)\[@id=['"](.+)['"]\]$/);
      if (id) return { tag: id[1], id: id[2] };
    }

    // Plain Tag ---------------------------------------
    return { tag: segment };
  };

  const steps: Step[] = pathStr
    .split("/")
    .map((seg, i, arr) => parseSegment(seg, i === arr.length - 1));

  let node: any = obj;

  for (const { tag, index, id } of steps) {
    if (node == null || typeof node !== "object") return undefined;

    const next = node[tag];
    if (next == null) return undefined;

    // Normalise to array so we can handle both cases seamlessly
    const list = Array.isArray(next) ? next : [next];

    if (id !== undefined) {
      node = list.find((el: any) => el?.["@_id"] === id);
    } else if (index !== undefined) {
      node = list[index];
    } else {
      node = list[0];
    }
  }

  return node; // typed as `any`, never `unknown`
}

/**
 * Converts the inner text content of an XML element (expected to be a hex string)
 * into a Uint8Array.
 * Handles whitespace removal before conversion.
 *
 * @param xElement The parsed XML element object (from fast-xml-parser).
 * @returns A Uint8Array containing the byte representation of the hex string,
 *          or an empty Uint8Array if the element is null/undefined or has no text content.
 */
export function getInnerValueAsByteArray(
  xBuffer: string | null | undefined
): Uint8Array {
  if (!xBuffer) {
    return new Uint8Array(0);
  }

  // Remove whitespace (spaces, newlines, carriage returns, tabs)
  const hexString = xBuffer.replace(/\s/g, "");

  // Ensure the string has an even number of characters for byte conversion
  if (hexString.length % 2 !== 0) {
    console.error("Hex string has odd length, cannot convert to byte array.");
    return new Uint8Array(0);
  }

  const byteArray = new Uint8Array(hexString.length / 2);
  for (let i = 0; i < byteArray.length; i++) {
    // Convert each pair of hex characters to a byte
    const byteValue = parseInt(hexString.substring(i * 2, i * 2 + 2), 16);
    if (isNaN(byteValue)) {
      console.error(
        `Invalid hex character sequence at position ${i * 2}: ${hexString.substring(i * 2, 2)}`
      );
      return new Uint8Array(0); // Return empty array on error
    }
    byteArray[i] = byteValue;
  }

  return byteArray;
}

/**
 * Helper to get an attribute value from a fast-xml-parser element.
 *
 * @param element The parsed XML element object.
 * @param attrName The name of the attribute to retrieve (without the '@_ prefix').
 * @param fallback The fallback value to return if the element or attribute is not found.
 * @returns The attribute value as a string, or the fallback value if not found.
 */
export function getAttr(
  element: any,
  attrName: string,
  fallback: string
): string {
  if (element && typeof element === "object") {
    const attr = element[`@_${attrName}`];
    // Check for null or undefined explicitly
    if (attr !== undefined && attr !== null) {
      return String(attr);
    }
  }
  return fallback;
}

/**
 * Helper to get the 'Value' attribute from a specific child element within the XML data.
 *
 * @param xmlData The parsed XML object.
 * @param varName The name of the child element to look for.
 * @param fallback The fallback value to return if the child element or 'Value' attribute is not found.
 * @returns The value of the 'Value' attribute as a string, or the fallback value if not found.
 */
export function getValue(
  xmlData: any,
  varName: string,
  fallback: string
): string {
  if (!xmlData) return fallback;
  // fast-xml-parser structure: xmlData might contain the varName directly
  const element = xmlData[varName];
  // Pass the found element (or undefined) to getAttr
  return getAttr(element, "Value", fallback);
}

/**
 * Helper to get the 'Id' attribute from a specific child element within the XML data.
 *
 * @param xmlData The parsed XML object.
 * @param varName The name of the child element to look for.
 * @param fallback The fallback value to return if the child element or 'Id' attribute is not found.
 * @returns The value of the 'Id' attribute as a string, or the fallback value if not found.
 */
export function getId(xmlData: any, varName: string, fallback: string): string {
  if (!xmlData) return fallback;
  const element = xmlData[varName];
  return getAttr(element, "Id", fallback);
}

/**
 * Converts a string value to a specified type based on the provided type string.
 * Supports 'string', 'float', 'int', and 'bool'.
 *
 * @param valType The target type as a string ('string', 'float', 'int', 'bool').
 * @param val The string value to convert.
 * @returns The converted value, or the original string if the type is unsupported.
 */
export function getValueType(valType: string, val: string): any {
  switch (valType) {
    case "string":
      return val;
    case "float":
      const floatVal = parseFloat(val);
      return isNaN(floatVal) ? 0.0 : floatVal;
    case "int":
      const intVal = parseInt(val, 10);
      return isNaN(intVal) ? 0 : intVal;
    case "bool":
      return val?.toLowerCase() === "true";
    default:
      // Log.Warning(`Unsupported value type: ${valType}. Returning string.`);
      return val;
  }
}

/**
 * Gets a parameter value from the XML data, handling potential nested structures.
 * It looks for a child element specified by `varName`, then retrieves its 'Manual' attribute's value,
 * and finally converts this value to the specified `varType`.
 *
 * @param xmlData The parsed XML object.
 * @param varName The name of the child element containing the parameter data.
 * @param varType The target type for the parameter value ('string', 'float', 'int', 'bool').
 * @param fallback The fallback value to return if the element or value is not found.
 * @returns The parameter value converted to the specified type, or the fallback value converted to the target type if not found.
 */
export function getParam(
  xmlData: any,
  varName: string,
  varType: string,
  fallback: string
): any {
  // Find the specific child element
  const xElement = xmlData ? xmlData[varName] : undefined;

  if (xElement) {
    // Get the 'Manual' value from the child element
    const manualValue = getValue(xElement, "Manual", fallback);

    return getValueType(varType, manualValue);
  } else {
    // If the element doesn't exist, return the fallback converted to the target type
    return getValueType(varType, fallback);
  }
}
