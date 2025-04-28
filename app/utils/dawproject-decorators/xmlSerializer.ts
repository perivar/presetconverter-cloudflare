import {
  X2jOptions,
  XMLBuilder,
  XmlBuilderOptions,
  XMLParser,
} from "fast-xml-parser";

import "reflect-metadata";

import { METADATA_KEYS } from "./xmlDecorators";

// Parser configuration for deserialization
const parserOptions: Partial<X2jOptions> = {
  attributeNamePrefix: "@_", // Prefix for XML attributes
  ignoreAttributes: false,
  // allowBooleanAttributes: true,
  // parseAttributeValue: true, // Parse numbers, booleans, etc.
  // trimValues: true,
};

// Builder configuration for serialization
const builderOptions: Partial<XmlBuilderOptions> = {
  attributeNamePrefix: "@_",
  ignoreAttributes: false,
  // suppressBooleanAttributes: false,
  format: true, // Pretty-print XML
  // indentBy: "    ",
  suppressEmptyNode: true,
};

const parser = new XMLParser(parserOptions);
const builder = new XMLBuilder(builderOptions);

/**
 * Serializes a TypeScript object to an XML string.
 * Uses decorator metadata to determine the XML structure, including root element name,
 * attributes, elements, wrapped collections, and type adapters.
 * @param obj - The object to serialize.
 * @returns The XML string representation of the object.
 * @throws Error if required attributes or elements are missing.
 * @example
 * const channel = new Channel();
 * channel.volume = new RealParameter();
 * channel.volume.value = Infinity;
 * const xml = serializeToXml(channel);
 */
export function serializeToXml(obj: any): string {
  if (!obj) throw new Error("Object to serialize is null or undefined");
  const rootName = Reflect.getMetadata(
    METADATA_KEYS.ROOT_ELEMENT,
    obj.constructor
  );
  if (!rootName) throw new Error("Missing @XmlRootElement on class");

  return builder.build(obj);
}

/**
 * Deserializes an XML string into a TypeScript object.
 * Uses decorator metadata to reconstruct the object, mapping XML attributes and elements
 * to class properties, applying type adapters, and handling ID references.
 * @param xml - The XML string to deserialize.
 * @param rootClass - The class constructor for the root object.
 * @returns An instance of the specified class populated with deserialized data.
 * @throws Error if the XML is invalid, required fields are missing, or root class lacks @XmlRootElement.
 * @example
 * const xml = '<Channel>...</Channel>';
 * const channel = deserializeFromXml<Channel>(xml, Channel);
 */
export function deserializeFromXml<T>(
  xml: string,
  rootClass: new (...args: any[]) => T
): T {
  if (!xml) throw new Error("XML string is empty");
  const rootName = Reflect.getMetadata(METADATA_KEYS.ROOT_ELEMENT, rootClass);
  if (!rootName) throw new Error("Missing @XmlRootElement on root class");
  const parsed = parser.parse(xml);
  if (!parsed[rootName])
    throw new Error(`Root element '${rootName}' not found in XML`);

  return parsed;
}
