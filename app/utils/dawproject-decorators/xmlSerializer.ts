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

/**
 * Builds an XML object structure from a TypeScript object using metadata.
 * @param obj - The object to serialize.
 * @returns The XML-compatible object structure.
 */
function buildXmlObject(obj: any): any {
  if (obj === null || obj === undefined) return undefined;
  if (typeof obj !== "object" || obj instanceof Date || obj instanceof RegExp)
    return obj;
  if (Array.isArray(obj))
    return obj.map(item => buildXmlObject(item)).filter(Boolean);

  const target = obj.constructor;
  const attributes =
    Reflect.getMetadata(METADATA_KEYS.ATTRIBUTES, target) || [];
  const elements = Reflect.getMetadata(METADATA_KEYS.ELEMENTS, target) || [];
  const elementRefs =
    Reflect.getMetadata(METADATA_KEYS.ELEMENT_REF, target) || [];
  const idrefs = Reflect.getMetadata(METADATA_KEYS.IDREF, target) || [];
  const wrappers = Reflect.getMetadata(METADATA_KEYS.WRAPPER, target) || [];
  const adapters = Reflect.getMetadata(METADATA_KEYS.ADAPTER, target) || {};

  const xmlObj: any = {};

  // Handle attributes
  for (const attrMeta of attributes) {
    const value = obj[attrMeta.key];
    if (value !== undefined) {
      const adapter = adapters[attrMeta.key];
      xmlObj[`@_${attrMeta.name || attrMeta.key}`] = adapter
        ? adapter.marshal(value)
        : value;
    } else if (attrMeta.required) {
      throw new Error(
        `Required attribute '${attrMeta.key}' missing in ${target.name}`
      );
    }
  }

  // Handle IDREFs (serialized as attributes)
  for (const idrefKey of idrefs) {
    const referencedObj = obj[idrefKey];
    const attrMeta = attributes.find((attr: any) => attr.key === idrefKey);
    if (!attrMeta) {
      throw new Error(
        `IDREF '${idrefKey}' must be annotated with @XmlAttribute in ${target.name}`
      );
    }
    if (referencedObj) {
      if (
        referencedObj.id === undefined ||
        typeof referencedObj.id !== "string"
      ) {
        throw new Error(
          `IDREF '${idrefKey}' in ${target.name} references an object without a valid string 'id' property`
        );
      }
      xmlObj[`@_${attrMeta.name || idrefKey}`] = referencedObj.id;
    } else if (attrMeta.required) {
      throw new Error(
        `Required IDREF '${idrefKey}' is missing in ${target.name}`
      );
    }
  }

  // Handle @XmlElement (fixed element names)
  for (const elementMeta of elements) {
    const key = elementMeta.key;
    const value = obj[key];
    const adapter = adapters[key];
    const marshaledValue = adapter ? adapter.marshal(value) : value;
    const wrapperMeta = wrappers.find((w: any) => w.key === key);

    if (marshaledValue !== undefined && marshaledValue !== null) {
      const elementName = elementMeta.name || key;
      if (Array.isArray(marshaledValue)) {
        const serializedArray = marshaledValue
          .map(item => buildXmlObject(item))
          .filter(Boolean);
        if (serializedArray.length > 0) {
          if (wrapperMeta) {
            xmlObj[wrapperMeta.name] = { [elementName]: serializedArray };
            // xmlObj[wrapperMeta.name] = serializedArray;
          } else {
            xmlObj[elementName] = serializedArray;
          }
        } else if (wrapperMeta?.required || elementMeta.required) {
          throw new Error(
            `Required collection '${key}' is empty in ${target.name}`
          );
        }
      } else {
        const serializedValue = buildXmlObject(marshaledValue);
        if (serializedValue !== undefined) {
          // xmlObj[elementName] = serializedValue;
          xmlObj[elementName] = serializedValue;
        } else if (elementMeta.required) {
          throw new Error(
            `Required element '${key}' missing in ${target.name}`
          );
        }
      }
    } else if (elementMeta.required) {
      throw new Error(`Required element '${key}' missing in ${target.name}`);
    }
  }

  // Handle @XmlElementRef (polymorphic element names)
  for (const elementRefMeta of elementRefs) {
    const key = elementRefMeta.key;
    const value = obj[key];
    const adapter = adapters[key];
    const marshaledValue = adapter ? adapter.marshal(value) : value;
    const wrapperMeta = wrappers.find((w: any) => w.key === key);

    if (marshaledValue !== undefined && marshaledValue !== null) {
      if (Array.isArray(marshaledValue)) {
        const serializedArray = marshaledValue
          .map(item => {
            const itemRootName = Reflect.getMetadata(
              METADATA_KEYS.ROOT_ELEMENT,
              item.constructor
            );
            if (!itemRootName) {
              throw new Error(
                `Missing @XmlRootElement on ${item.constructor.name} for @XmlElementRef`
              );
            }
            // return { [itemRootName]: buildXmlObject(item) };
            return buildXmlObject(item);
          })
          .filter(Boolean);

        if (serializedArray.length > 0) {
          const elementName = elementRefMeta.name || key;
          if (wrapperMeta) {
            // xmlObj[wrapperMeta.name] = { [elementName]: serializedArray };
            xmlObj[wrapperMeta.name] = serializedArray;
          } else {
            xmlObj[elementName] = serializedArray;
          }
        } else if (wrapperMeta?.required || elementRefMeta.required) {
          throw new Error(
            `Required collection '${key}' is empty in ${target.name}`
          );
        }
      } else {
        const itemRootName = Reflect.getMetadata(
          METADATA_KEYS.ROOT_ELEMENT,
          marshaledValue.constructor
        );
        if (!itemRootName) {
          throw new Error(
            `Missing @XmlRootElement on ${marshaledValue.constructor.name} for @XmlElementRef`
          );
        }
        const serializedValue = buildXmlObject(marshaledValue);
        if (serializedValue !== undefined) {
          xmlObj[itemRootName] = serializedValue;
        } else if (elementRefMeta.required) {
          throw new Error(
            `Required element '${key}' missing in ${target.name}`
          );
        }
      }
    } else if (elementRefMeta.required) {
      throw new Error(`Required element '${key}' missing in ${target.name}`);
    }
  }

  return xmlObj;
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
