import {
  X2jOptions,
  XMLBuilder,
  XmlBuilderOptions,
  XMLParser,
} from "fast-xml-parser";

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
function buildXmlObject(obj: any): any {
  if (obj === null || obj === undefined) {
    return undefined;
  }

  // Handle primitive types directly
  if (typeof obj !== "object" || obj instanceof Date || obj instanceof RegExp) {
    return obj;
  }

  // Handle arrays
  if (Array.isArray(obj)) {
    return obj.map(item => buildXmlObject(item));
  }

  const target = obj.constructor;

  // Retrieve metadata - getMetadata correctly handles inheritance now
  const attributes =
    Reflect.getMetadata(METADATA_KEYS.ATTRIBUTES, target) || [];
  const elements = Reflect.getMetadata(METADATA_KEYS.ELEMENTS, target) || [];
  const elementRefs =
    Reflect.getMetadata(METADATA_KEYS.ELEMENT_REF, target) || [];
  const idrefs = Reflect.getMetadata(METADATA_KEYS.IDREF, target) || [];
  const wrappers = Reflect.getMetadata(METADATA_KEYS.WRAPPER, target) || [];
  const adapters = Reflect.getMetadata(METADATA_KEYS.ADAPTER, target) || {};

  const xmlObj: any = {};

  // Prefix all attributes found in the class with @_ to match fast-xml-parser
  for (const attrMeta of attributes) {
    const value = obj[attrMeta.key];
    if (value !== undefined) {
      // check if there is a data adapter defined for this attribute
      // If there is, use it to marshal the value
      const adapter = adapters[attrMeta.key];
      const marshaledValue = adapter ? adapter.marshal(value) : value;
      xmlObj[`@_${attrMeta.name || attrMeta.key}`] = marshaledValue;
    } else {
      // If value is undefined, check if the attribute metadata marks it as required
      if (attrMeta?.required) {
        // Throw error if a required attribute is missing
        throw new Error(
          `Required attribute '${attrMeta.key}' is missing on object of type ${target.name}`
        );
      }
    }
  }

  // Process ID references (serialized as attributes)
  for (const idrefKey of idrefs) {
    const referencedObj = obj[idrefKey];
    if (referencedObj && referencedObj.id !== undefined) {
      // Assuming the corresponding attribute decorator is also present for the name
      const attrMeta = attributes.find((attr: any) => attr.key === idrefKey);
      if (attrMeta) {
        xmlObj[`@_${attrMeta.name || idrefKey}`] = referencedObj.id;
      } else {
        // Fallback if no attribute decorator is found, though it should be there for IDREF
        xmlObj[`@_${idrefKey}`] = referencedObj.id;
      }
    } else {
      // If the referenced object/ID is missing, check if the corresponding attribute was required
      const correspondingAttrMeta = attributes.find(
        (attr: any) => attr.key === idrefKey
      );
      if (correspondingAttrMeta?.required) {
        throw new Error(
          `Required ID reference attribute '${idrefKey}' is missing or referenced object has no ID on object of type ${target.name}`
        );
      }
    }
  }

  // Process elements and element references
  const elementMap = new Map(
    [...elements, ...elementRefs].map(el => [el.key, el])
  );

  for (const [key, elementMeta] of elementMap.entries()) {
    const value = obj[key];

    // check if there is a data adapter defined for this attribute
    // If there is, use it to marshal the value
    const adapter = adapters[key];
    const marshaledValue = adapter ? adapter.marshal(value) : value;

    if (marshaledValue !== undefined && marshaledValue !== null) {
      const elementName = elementMeta.name || key;
      const wrapperMeta = wrappers.find((w: any) => w.key === key);

      if (Array.isArray(marshaledValue)) {
        const serializedArray = marshaledValue
          .map(item => buildXmlObject(item))
          .filter(item => item !== undefined); // Filter out undefined items

        if (serializedArray.length > 0) {
          if (wrapperMeta) {
            // Wrapped collection
            if (!xmlObj[wrapperMeta.name]) {
              xmlObj[wrapperMeta.name] = {}; // Create the wrapper object if it doesn't exist
            }
            // Assign the array of serialized items under the element name within the wrapper
            xmlObj[wrapperMeta.name][elementName] = serializedArray;
          } else {
            // Unwrapped collection (each item is a direct child element)
            // Assign the array of serialized items directly under the element name
            xmlObj[elementName] = serializedArray;
          }
        } else if (wrapperMeta?.required) {
          throw new Error(
            `Required wrapped collection '${key}' is empty on object of type ${target.name}`
          );
        } else if (elementMeta.required) {
          throw new Error(
            `Required collection '${key}' is empty on object of type ${target.name}`
          );
        }
      } else {
        // Single element or element reference
        const serializedValue = buildXmlObject(marshaledValue);
        if (serializedValue !== undefined) {
          xmlObj[elementName] = serializedValue;
        } else if (elementMeta.required) {
          throw new Error(
            `Required element '${key}' is missing on object of type ${target.name}`
          );
        }
      }
    } else if (elementMeta.required) {
      throw new Error(
        `Required element '${key}' is missing on object of type ${target.name}`
      );
    }
  }

  return xmlObj;
}

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

  const xmlObject = buildXmlObject(obj);

  // fast-xml-parser expects the root element as the key of the top-level object
  const finalXmlObject = {
    [rootName]: xmlObject,
  };

  return builder.build(finalXmlObject);
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

  const rootNode = parsed[rootName];
  if (!rootNode) {
    throw new Error(
      `Root element '${rootName}' not found in parsed XML object`
    );
  }
  const idMap = new Map<string, any>(); // For resolving IDREFs later
  const instance = buildObjectFromXmlNode(rootNode, rootClass, idMap);
  // TODO: Add a second pass to resolve IDREFs using the idMap
  resolveIdRefs(instance, idMap); // Call the IDREF resolution function
  return instance;
}

/**
 * Recursively builds a TypeScript object from a parsed XML node.
 * Uses decorator metadata to map XML attributes and elements to class properties.
 * @param xmlNode - The parsed XML node (JavaScript object).
 * @param targetClass - The class constructor for the object to create.
 * @param idMap - A map to store objects with IDs for later IDREF resolution.
 * @returns An instance of the targetClass populated with data.
 */
function buildObjectFromXmlNode<T>(
  xmlNode: any,
  targetClass: new (...args: any[]) => T,
  idMap: Map<string, any>
): T {
  // Handle cases where the node might be a primitive value directly
  if (
    xmlNode === null ||
    xmlNode === undefined ||
    typeof xmlNode !== "object"
  ) {
    // If the target is expected to be a primitive (e.g., string content), return it.
    // This needs careful handling based on how @XmlValue or text content is defined.
    // For now, if it's not an object, return it as is. Adapters should handle type conversion.
    return xmlNode;
  }

  // Handle arrays explicitly if the parser returns them (e.g., for unwrapped collections)
  // This part might need adjustment based on parser behavior for repeated elements.
  if (Array.isArray(xmlNode)) {
    // This scenario shouldn't typically happen if xmlNode is supposed to map to a single class instance.
    // It might occur if the XML structure has repeated elements at the top level being mapped.
    // Consider how to handle this - maybe expect a specific decorator?
    console.warn(
      "Attempting to build object from an array node directly.",
      xmlNode
    );
    // For now, return the array as is, assuming downstream logic or adapters handle it.
    return xmlNode as any; // This is likely incorrect for class instantiation
  }

  const instance = new targetClass();

  // Retrieve metadata
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
  // Find the metadata for the attribute conventionally named 'id' or marked as ID
  // Option 1: Convention - property key is 'id'
  const idAttrMeta = attributesMeta.find((attr: any) => attr.key === "id");
  // Option 2: Check for a potential 'isId' flag in metadata (if @XmlId decorator adds it)
  // const idAttrMeta = attributesMeta.find((attr: any) => attr.isId === true);
  const idAttributeKey = idAttrMeta ? idAttrMeta.key : undefined; // Store the key ('id') if found

  // --- Process Attributes ---
  for (const attrMeta of attributesMeta) {
    const attrXmlName = `@_${attrMeta.name || attrMeta.key}`;
    let value = xmlNode[attrXmlName];

    if (value !== undefined) {
      const adapter = adaptersMeta[attrMeta.key];
      if (adapter) {
        value = adapter.unmarshal(value); // Apply adapter for unmarshaling
      }
      // TODO: Add type coercion based on expected property type if needed (e.g., string to number)
      (instance as any)[attrMeta.key] = value;

      // If this attribute is the ID, store the instance in the map
      if (idAttributeKey === attrMeta.key && value !== undefined) {
        idMap.set(value.toString(), instance); // Store instance by its ID
      }
    } else if (attrMeta.required) {
      console.error(
        "Missing required attribute:",
        attrMeta,
        "in node:",
        xmlNode,
        "for class:",
        targetClass.name
      );
      throw new Error(
        `Required attribute '${attrMeta.name || attrMeta.key}' missing for class ${
          targetClass.name
        }`
      );
    }
  }

  // --- Process Elements and Element References ---
  const allElementMeta = [...elementsMeta, ...elementRefsMeta];
  const elementMap = new Map(allElementMeta.map(el => [el.key, el])); // Map by property key

  for (const [propKey, elementMeta] of elementMap.entries()) {
    const elementName = elementMeta.name || propKey;
    const wrapperMeta = wrappersMeta.find((w: any) => w.key === propKey);
    const adapter = adaptersMeta[propKey];
    const expectedType = Reflect.getMetadata(
      "design:type",
      targetClass.prototype,
      propKey
    ); // Get expected type

    const elementValue = wrapperMeta
      ? xmlNode[wrapperMeta.name]?.[elementName]
      : xmlNode[elementName];

    if (elementValue !== undefined && elementValue !== null) {
      if (Array.isArray(elementValue)) {
        // Handle collection of elements
        const deserializedArray = elementValue
          .map(itemNode => {
            if (!expectedType) {
              console.warn(
                `Missing type information for array element ${propKey} in ${targetClass.name}`
              );
              return itemNode; // Cannot deserialize without type info
            }
            // Determine the class of items in the array (needs metadata or convention)
            // Assuming elementMeta.type holds the constructor for array items
            const itemClass = elementMeta.type; // This assumes @XmlElement/@XmlElementRef has a 'type' option
            if (!itemClass) {
              console.warn(
                `Missing item type for array ${propKey} in ${targetClass.name}. Cannot deserialize complex objects.`
              );
              // If no itemClass, assume primitives/simple objects handled by adapters or direct assignment
              return adapter ? adapter.unmarshal(itemNode) : itemNode;
            }
            const builtItem = buildObjectFromXmlNode(
              itemNode,
              itemClass,
              idMap
            );
            return adapter ? adapter.unmarshal(builtItem) : builtItem; // Apply adapter after building object if needed
          })
          .filter(item => item !== undefined && item !== null); // Filter out null/undefined items

        (instance as any)[propKey] = deserializedArray;
      } else {
        // Handle single element
        if (!expectedType) {
          console.warn(
            `Missing type information for element ${propKey} in ${targetClass.name}`
          );
          (instance as any)[propKey] = adapter
            ? adapter.unmarshal(elementValue)
            : elementValue;
        } else {
          // Check if expectedType is a primitive or a class constructor
          if (isPrimitiveConstructor(expectedType)) {
            (instance as any)[propKey] = adapter
              ? adapter.unmarshal(elementValue)
              : convertToPrimitiveType(elementValue, expectedType);
          } else {
            // It's a complex type (class)
            const builtValue = buildObjectFromXmlNode(
              elementValue,
              expectedType,
              idMap
            );
            (instance as any)[propKey] = adapter
              ? adapter.unmarshal(builtValue)
              : builtValue;
          }
        }
      }
    } else if (elementMeta.required) {
      console.error(
        "Missing required element:",
        elementMeta,
        "in node:",
        xmlNode,
        "for class:",
        targetClass.name
      );
      throw new Error(
        `Required element '${elementName}' missing for class ${targetClass.name}`
      );
    }
  }

  // --- Process ID References (Store IDs for later resolution) ---
  // We store the ID string found in the XML attribute, not the object itself yet.
  for (const idrefKey of idrefsMeta) {
    const attrMeta = attributesMeta.find((attr: any) => attr.key === idrefKey);
    if (attrMeta) {
      const attrXmlName = `@_${attrMeta.name || idrefKey}`;
      const idrefValue = xmlNode[attrXmlName];
      if (idrefValue !== undefined) {
        // Store the key and the ID value to be resolved later
        (instance as any)[idrefKey] = { __idref__: idrefValue };
      } else if (attrMeta.required) {
        console.error(
          "Missing required IDREF attribute:",
          attrMeta,
          "in node:",
          xmlNode,
          "for class:",
          targetClass.name
        );
        throw new Error(
          `Required ID reference attribute '${attrMeta.name || idrefKey}' missing for class ${targetClass.name}`
        );
      }
    } else {
      console.warn(
        `IDREF key '${idrefKey}' does not have a corresponding @XmlAttribute decorator in ${targetClass.name}. Cannot deserialize.`
      );
    }
  }

  return instance;
}

// Helper function to check if a constructor is for a primitive type
function isPrimitiveConstructor(ctor: any): boolean {
  return ctor === String || ctor === Number || ctor === Boolean;
}

// Helper function to convert value to primitive type
function convertToPrimitiveType(value: any, type: any): any {
  if (type === String) return String(value);
  if (type === Number) return Number(value);
  if (type === Boolean) return Boolean(value); // Consider 'true'/'false' strings?
  return value;
}

// --- IDREF Resolution ---
// This needs to be called *after* the initial object graph is built.
function resolveIdRefs(obj: any, idMap: Map<string, any>) {
  if (!obj || typeof obj !== "object") {
    return;
  }

  // Use a set to keep track of visited objects to prevent infinite loops in cyclic graphs
  const visited = new Set();

  function traverse(currentObj: any) {
    if (
      !currentObj ||
      typeof currentObj !== "object" ||
      visited.has(currentObj)
    ) {
      return;
    }
    visited.add(currentObj);

    for (const key in currentObj) {
      if (Object.prototype.hasOwnProperty.call(currentObj, key)) {
        const value = currentObj[key];

        // Check if this property holds an IDREF placeholder
        if (value && typeof value === "object" && value.__idref__) {
          const idToResolve = value.__idref__;
          const resolvedObject = idMap.get(idToResolve.toString());
          if (resolvedObject) {
            currentObj[key] = resolvedObject; // Replace placeholder with actual object
          } else {
            // Optional: Decide how to handle unresolved IDREFs. Throw error or leave as is?
            console.warn(
              `Could not resolve IDREF '${idToResolve}' for property '${key}' in object:`,
              currentObj
            );
            // Keep the placeholder or set to null/undefined?
            // currentObj[key] = null; // Or keep placeholder for debugging
          }
        } else if (typeof value === "object") {
          // Recursively traverse nested objects and arrays
          traverse(value);
        }
      }
    }
  }

  traverse(obj); // Start traversal from the root object
}
