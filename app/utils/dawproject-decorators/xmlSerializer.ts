import {
  X2jOptions,
  XMLBuilder,
  XmlBuilderOptions,
  XMLParser,
} from "fast-xml-parser";

import { METADATA_KEYS } from "./xmlDecorators";

// Parser configuration with namespace support
const parserOptions: Partial<X2jOptions> = {
  attributeNamePrefix: "@_",
  ignoreAttributes: false,
  allowBooleanAttributes: true,
  parseAttributeValue: true, // Parse numbers, booleans, etc.
  trimValues: true,
};

// Builder configuration with namespace support
const builderOptions: Partial<XmlBuilderOptions> = {
  attributeNamePrefix: "@_",
  ignoreAttributes: false,
  format: true,
  suppressEmptyNode: true,
  processEntities: true,
};

const parser = new XMLParser(parserOptions);
const builder = new XMLBuilder(builderOptions);

/**
 * Serializes a TypeScript object to an XML string based on JAXB-like metadata.
 * @param obj - The object to serialize.
 * @returns The XML string representation.
 * @throws Error if required fields are missing or metadata is incomplete.
 */
export function serializeToXml(obj: any): string {
  if (!obj) throw new Error("Object to serialize is null or undefined");
  const rootName = Reflect.getMetadata(
    METADATA_KEYS.ROOT_ELEMENT,
    obj.constructor
  );
  if (!rootName) throw new Error("Missing @XmlRootElement on class");

  const xmlObject = buildXmlObject(obj);
  const finalXmlObject = { [rootName]: xmlObject };
  return builder.build(finalXmlObject);
}

// Helper function to check if value is primitive
const isPrimitive = (value: any): boolean =>
  typeof value !== "object" ||
  value instanceof Number ||
  value instanceof String ||
  value instanceof Boolean;

/**
 * Builds an XML object structure from a TypeScript object using metadata.
 * @param obj - The object to serialize.
 * @returns The XML-compatible object structure.
 */
function buildXmlObject(obj: any): any {
  if (obj === null || obj === undefined) return null;
  if (typeof obj !== "object" || obj instanceof Date || obj instanceof RegExp)
    return obj;

  const target = obj.constructor;
  const attributes =
    Reflect.getMetadata(METADATA_KEYS.ATTRIBUTES, target) || [];
  const elements = Reflect.getMetadata(METADATA_KEYS.ELEMENTS, target) || [];
  const elementRefs =
    Reflect.getMetadata(METADATA_KEYS.ELEMENT_REF, target) || [];
  const idrefs = Reflect.getMetadata(METADATA_KEYS.IDREF, target) || [];
  const wrappers = Reflect.getMetadata(METADATA_KEYS.WRAPPER, target) || [];
  const adapters = Reflect.getMetadata(METADATA_KEYS.ADAPTER, target) || {};

  // Handle primitive types
  if (isPrimitive(obj)) {
    return obj;
  }

  // Handle arrays
  if (Array.isArray(obj)) {
    return obj
      .map(item => {
        if (item !== null && item !== undefined) {
          const processedItem = buildXmlObject(item);
          if (isPrimitive(item)) {
            return processedItem;
          }
          const typeName = item.constructor?.name || "Unknown";
          return { [typeName]: processedItem };
        }
        return null;
      })
      .filter(item => item !== null);
  }

  // Handle objects
  const result: any = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined && value !== null) {
      const processedValue = buildXmlObject(value);

      const attrMeta = attributes.find((attr: any) => attr.key === key);
      const elementMeta = elements.find((el: any) => el.key === key);

      if (attrMeta) {
        const adapter = adapters[attrMeta.key];
        const finalValue = adapter
          ? adapter.marshal(processedValue)
          : processedValue;

        if (isPrimitive(finalValue)) {
          // result[key] = finalValue;
          result[`@_${attrMeta.name || key}`] = finalValue;
          continue;
        }
        const typeName = value.constructor?.name || "Unknown";
        if (Array.isArray(value)) {
          // Dont add typeName for Arrays
          // result[key] = finalValue;
          // TODO: this produces @_contentType, @_destination and @_track
          result[`@_${attrMeta.name || key}`] = finalValue;
        } else {
          // result[key] = { [typeName]: finalValue };
          result[`@_${attrMeta.name || key}`] = { [typeName]: finalValue };
        }
      } else if (elementMeta) {
        const finalValue = processedValue;

        if (isPrimitive(finalValue)) {
          result[elementMeta.name] = finalValue;
          continue;
        }
        const typeName = value.constructor?.name || "Unknown";
        if (Array.isArray(value)) {
          // Dont add typeName for Arrays
          result[elementMeta.name] = finalValue;
        } else {
          result[elementMeta.name] = { [typeName]: finalValue };
        }
      } else {
        const finalValue = processedValue;

        if (isPrimitive(finalValue)) {
          result[key] = finalValue;
          continue;
        }
        const typeName = value.constructor?.name || "Unknown";
        if (Array.isArray(value)) {
          // Dont add typeName for Arrays
          result[key] = finalValue;
        } else {
          result[key] = { [typeName]: finalValue };
        }
      }
    }
  }

  return result;
}

/**
 * Deserializes an XML string into a TypeScript object.
 * @param xml - The XML string.
 * @param rootClass - The root class constructor.
 * @returns An instance of the root class.
 * @throws Error if XML or metadata is invalid.
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

  const idMap = new Map<string, any>();
  const instance = buildObjectFromXmlNode(parsed[rootName], rootClass, idMap);
  resolveIdRefs(instance, idMap);
  return instance;
}

/**
 * Builds an object from an XML node using metadata.
 */
function buildObjectFromXmlNode<T>(
  xmlNode: any,
  targetClass: new (...args: any[]) => T,
  idMap: Map<string, any>
): T {
  if (
    xmlNode === null ||
    xmlNode === undefined ||
    typeof xmlNode !== "object"
  ) {
    return xmlNode;
  }
  if (Array.isArray(xmlNode))
    return xmlNode.map(item =>
      buildObjectFromXmlNode(item, targetClass, idMap)
    ) as any;

  const instance = new targetClass();
  const attributesMeta =
    Reflect.getMetadata(METADATA_KEYS.ATTRIBUTES, targetClass) || [];
  const elementsMeta =
    Reflect.getMetadata(METADATA_KEYS.ELEMENTS, targetClass) || [];
  const elementRefsMeta =
    Reflect.getMetadata(METADATA_KEYS.ELEMENT_REF, targetClass) || [];
  const idrefsMeta =
    Reflect.getMetadata(METADATA_KEYS.IDREF, targetClass) || [];
  const wrappersMeta =
    Reflect.getMetadata(METADATA_KEYS.WRAPPER, targetClass) || [];
  const adaptersMeta =
    Reflect.getMetadata(METADATA_KEYS.ADAPTER, targetClass) || {};
  const idMeta =
    attributesMeta.find((attr: any) => attr.isId) ||
    attributesMeta.find((attr: any) => attr.key === "id");

  // Attributes
  for (const attrMeta of attributesMeta) {
    const attrXmlName = `@_${attrMeta.name || attrMeta.key}`;
    const value = xmlNode[attrXmlName];
    if (value !== undefined) {
      const adapter = adaptersMeta[attrMeta.key];
      (instance as any)[attrMeta.key] = adapter
        ? adapter.unmarshal(value)
        : value;
      if (idMeta && idMeta.key === attrMeta.key)
        idMap.set(value.toString(), instance);
    } else if (attrMeta.required) {
      throw new Error(
        `Required attribute '${attrMeta.name || attrMeta.key}' missing in ${targetClass.name}`
      );
    }
  }

  // Elements and ElementRefs
  const elementMap = new Map(
    [...elementsMeta, ...elementRefsMeta].map(el => [el.key, el])
  );
  for (const [propKey, elementMeta] of elementMap.entries()) {
    const elementName = elementMeta.name || propKey;
    const wrapperMeta = wrappersMeta.find((w: any) => w.key === propKey);
    const adapter = adaptersMeta[propKey];
    const expectedType =
      elementMeta.type ||
      Reflect.getMetadata("design:type", targetClass.prototype, propKey);
    const elementValue = wrapperMeta
      ? xmlNode[wrapperMeta.name]?.[elementName]
      : xmlNode[elementName];

    if (elementValue !== undefined && elementValue !== null) {
      if (Array.isArray(elementValue)) {
        const deserializedArray = elementValue
          .map(item =>
            expectedType && !isPrimitiveConstructor(expectedType)
              ? buildObjectFromXmlNode(item, expectedType, idMap)
              : convertToPrimitiveType(item, expectedType)
          )
          .filter(Boolean);
        (instance as any)[propKey] = adapter
          ? adapter.unmarshal(deserializedArray)
          : deserializedArray;
      } else {
        const value =
          expectedType && !isPrimitiveConstructor(expectedType)
            ? buildObjectFromXmlNode(elementValue, expectedType, idMap)
            : convertToPrimitiveType(elementValue, expectedType);
        (instance as any)[propKey] = adapter ? adapter.unmarshal(value) : value;
      }
    } else if (elementMeta.required) {
      throw new Error(
        `Required element '${elementName}' missing in ${targetClass.name}`
      );
    }
  }

  // IDREFs
  for (const idrefKey of idrefsMeta) {
    const attrMeta = attributesMeta.find((attr: any) => attr.key === idrefKey);
    if (!attrMeta)
      throw new Error(
        `IDREF '${idrefKey}' must be annotated with @XmlAttribute`
      );
    const attrXmlName = `@_${attrMeta.name || idrefKey}`;
    const idrefValue = xmlNode[attrXmlName];
    if (idrefValue !== undefined)
      (instance as any)[idrefKey] = { __idref__: idrefValue };
    else if (attrMeta.required)
      throw new Error(
        `Required IDREF '${idrefKey}' missing in ${targetClass.name}`
      );
  }

  return instance;
}

/**
 * Resolves IDREFs in the object graph using the idMap.
 */
function resolveIdRefs(obj: any, idMap: Map<string, any>) {
  const visited = new Set();
  function traverse(currentObj: any) {
    if (
      !currentObj ||
      typeof currentObj !== "object" ||
      visited.has(currentObj)
    )
      return;
    visited.add(currentObj);
    for (const key in currentObj) {
      const value = currentObj[key];
      if (value && value.__idref__) {
        const resolved = idMap.get(value.__idref__.toString());
        currentObj[key] = resolved !== undefined ? resolved : null;
      } else if (typeof value === "object") traverse(value);
    }
  }
  traverse(obj);
}

/**
 * Checks if a constructor is for a primitive type.
 */
function isPrimitiveConstructor(ctor: any): boolean {
  return ctor === String || ctor === Number || ctor === Boolean;
}

/**
 * Converts a value to the expected primitive type.
 */
function convertToPrimitiveType(value: any, type: any): any {
  if (type === String) return String(value);
  if (type === Number) return Number(value);
  if (type === Boolean) {
    if (typeof value === "string") return value.toLowerCase() === "true";
    return Boolean(value);
  }
  return value;
}
