import {
  X2jOptions,
  XMLBuilder,
  XmlBuilderOptions,
  XMLParser,
} from "fast-xml-parser";

import "reflect-metadata";

import { Application } from "./application";
import { Arrangement } from "./arrangement";
import { BoolParameter } from "./boolParameter";
import { Channel } from "./channel";
import { AuPlugin } from "./device/auPlugin";
import { ClapPlugin } from "./device/clapPlugin";
import { Compressor } from "./device/compressor";
import { EqBand } from "./device/eqBand";
import { Equalizer } from "./device/equalizer";
import { Limiter } from "./device/limiter";
import { NoiseGate } from "./device/noiseGate";
import { Vst2Plugin } from "./device/vst2Plugin";
import { Vst3Plugin } from "./device/vst3Plugin";
import { EnumParameter } from "./enumParameter";
import { FileReference } from "./fileReference";
import { IntegerParameter } from "./integerParameter";
import { MetaData } from "./metaData";
import { Project } from "./project";
import { RealParameter } from "./realParameter";
import { Scene } from "./scene";
import { Send } from "./send";
import { AutomationTarget } from "./timeline/automationTarget";
import { Lanes } from "./timeline/lanes";
import { Marker } from "./timeline/marker";
import { Markers } from "./timeline/markers";
import { Points } from "./timeline/points";
import { TimeSignatureParameter } from "./timeSignatureParameter";
import { Transport } from "./transport";
import { METADATA_KEYS } from "./xmlDecorators";

// Parser configuration for deserialization
const parserOptions: Partial<X2jOptions> = {
  ignoreAttributes: false,
  attributeNamePrefix: "@_", // Prefix for XML attributes
  allowBooleanAttributes: true,
  parseAttributeValue: true, // Parse numbers, booleans, etc.
  trimValues: true,
  // Custom attribute value processor to prevent 'version' from being parsed as a number
  attributeValueProcessor: (name, value, jPath) => {
    // jPath is like 'Project.@_version'
    if (jPath === "Project.@_version") {
      return String(value); // Ensure it's treated as a string
    }
    // Return undefined to let the default processor handle other attributes
    return undefined;
  },
};

// Builder configuration for serialization
const builderOptions: Partial<XmlBuilderOptions> = {
  attributeNamePrefix: "@_",
  ignoreAttributes: false,
  suppressBooleanAttributes: false,
  format: true, // Pretty-print XML
  // indentBy: "    ",
  suppressEmptyNode: true,
};

const parser = new XMLParser(parserOptions);
const builder = new XMLBuilder(builderOptions);

/**
 * Retrieves the class hierarchy for a given class or instance, including parent classes.
 * Used to collect metadata from inherited decorators (e.g., for Channel extending Lane).
 * @param instanceOrClass - The class constructor or instance to analyze.
 * @returns An array of constructors in the inheritance chain (child to parent).
 */
function getClassHierarchy(instanceOrClass: any): any[] {
  const hierarchy: any[] = [];
  let current = instanceOrClass.prototype
    ? instanceOrClass
    : instanceOrClass.constructor;
  while (current && current !== Object) {
    hierarchy.push(current);
    current = Object.getPrototypeOf(current.prototype)?.constructor;
  }
  return hierarchy;
}

/**
 * Transforms a TypeScript object into a structure suitable for XML serialization.
 * Uses decorator metadata to map properties to XML attributes, elements, ID references,
 * wrapped collections, and apply type adapters (e.g., for inf/-inf).
 * @param obj - The object to transform.
 * @param classOrInstance - The class constructor or instance for metadata lookup.
 * @returns The transformed object with attributes prefixed (e.g., `@_value`) and elements structured.
 */
function transformForSerialization(obj: any, classOrInstance: any): any {
  if (!obj || typeof obj !== "object") return obj;

  // Handle arrays (e.g., sends: Send[])
  if (Array.isArray(obj)) {
    return obj.map(item => transformForSerialization(item, item.constructor));
  }

  // Collect metadata from class hierarchy
  const hierarchy = getClassHierarchy(classOrInstance);
  const attributes = hierarchy
    .flatMap(cls => Reflect.getMetadata(METADATA_KEYS.ATTRIBUTES, cls) || [])
    .filter(
      (value, index, self) =>
        self.findIndex(item => item.key === value.key) === index
    ); // Keep only first occurrence by key
  const elements = hierarchy
    .flatMap(cls => Reflect.getMetadata(METADATA_KEYS.ELEMENTS, cls) || [])
    .filter(
      (value, index, self) =>
        self.findIndex(item => item.key === value.key) === index
    ); // Keep only first occurrence by key
  const idrefs = hierarchy
    .flatMap(cls => Reflect.getMetadata(METADATA_KEYS.IDREF, cls) || [])
    .filter((value, index, self) => self.indexOf(value) === index);
  const wrappers = hierarchy.flatMap(
    cls => Reflect.getMetadata(METADATA_KEYS.WRAPPER, cls) || []
  );
  const elementRefs = hierarchy.flatMap(
    cls => Reflect.getMetadata(METADATA_KEYS.ELEMENT_REF, cls) || []
  );
  const adapters = hierarchy.reduce(
    (acc, cls) => ({
      ...acc,
      ...(Reflect.getMetadata(METADATA_KEYS.ADAPTER, cls) || {}),
    }),
    {}
  );

  const result: any = {};

  // Process attributes (e.g., @XmlAttribute value, unit)
  for (const attr of attributes) {
    const key = attr.key;
    if (key in obj && obj[key] !== undefined && obj[key] !== null) {
      let value = obj[key];
      if (adapters[key]) {
        value = adapters[key].marshal(value); // Apply type adapter (e.g., DoubleAdapter for inf)
      }
      result[`@_${key}`] = value;
    } else if (attr.required) {
      // throw new Error(
      //   `Required attribute '${key}' is missing in ${classOrInstance.name}`
      // );
    }
  }

  // Process elements (e.g., @XmlElement volume, pan, @XmlElementRef content)
  for (const elem of elements) {
    const key = elem.key;
    const elemName = elem.name || key;
    if (key in obj && obj[key] !== undefined && obj[key] !== null) {
      const value = obj[key];
      const wrapper = wrappers.find(w => w.key === key);
      if (wrapper) {
        if (wrapper.required && (value === undefined || value === null)) {
          throw new Error(
            `Required wrapped element '${wrapper.name}' is missing in ${classOrInstance.name}`
          );
        }
        if (Array.isArray(value)) {
          // Handle wrapped collections (e.g., <Sends><Send>...</Send></Sends>)
          result[wrapper.name] = {
            [elemName]: value.map(item =>
              transformForSerialization(item, item.constructor)
            ),
          };
        }
      } else {
        // Handle single elements (e.g., <Volume>...</Volume>)
        result[elemName] = transformForSerialization(value, value.constructor);
      }
    } else if (elem.required) {
      throw new Error(
        `Required element '${elemName}' is missing in ${classOrInstance.name}`
      );
    }
  }

  // Process element references (@XmlElementRef)
  for (const elemRef of elementRefs) {
    const key = elemRef.key;
    if (key in obj && obj[key] !== undefined && obj[key] !== null) {
      const value = obj[key];
      const wrapper = wrappers.find(w => w.key === key);
      if (wrapper) {
        if (wrapper.required && (value === undefined || value === null)) {
          throw new Error(
            `Required wrapped element '${wrapper.name}' is missing in ${classOrInstance.name}`
          );
        }
        if (Array.isArray(value)) {
          // Handle wrapped collections with element references
          result[wrapper.name] = value.map(item => {
            const itemRootName = Reflect.getMetadata(
              METADATA_KEYS.ROOT_ELEMENT,
              item.constructor
            );
            const itemTransformed = transformForSerialization(
              item,
              item.constructor
            );
            // If the item's root element name is the same as the wrapper name,
            // just return the transformed item directly to avoid duplication.
            if (itemRootName && itemRootName === wrapper.name) {
              return itemTransformed;
            }
            // Otherwise, wrap it in an element with the appropriate name.
            return {
              [itemRootName || elemRef.name || item.constructor.name]:
                itemTransformed,
            };
          });
        }
      } else {
        // Handle single element references
        const valueRootName = Reflect.getMetadata(
          METADATA_KEYS.ROOT_ELEMENT,
          value.constructor
        );
        const valueTransformed = transformForSerialization(
          value,
          value.constructor
        );
        result[valueRootName || elemRef.name || value.constructor.name] =
          valueTransformed;
      }
    }
  }

  // Process ID references (e.g., @XmlIDREF destination)
  for (const idref of idrefs) {
    if (idref in obj && obj[idref] !== undefined && obj[idref] !== null) {
      // Assumes referenced object has an 'id' property
      result[`@_${idref}`] = obj[idref]?.id;
    }
  }

  return result;
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
  const transformed = transformForSerialization(obj, obj.constructor);
  const xmlObj = { [rootName]: transformed };
  return builder.build(xmlObj);
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

  // Class registry for element types (avoid eval in production)
  const classRegistry: Record<string, new (...args: any[]) => any> = {
    Application,
    Arrangement,
    BoolParameter,
    Channel,
    AuPlugin,
    ClapPlugin,
    Compressor,
    Equalizer,
    Limiter,
    NoiseGate,
    Vst2Plugin,
    Vst3Plugin,
    EnumParameter,
    FileReference,
    IntegerParameter,
    Lanes,
    Marker,
    Markers,
    MetaData,
    Points,
    Project,
    RealParameter,
    Scene,
    Send,
    TimeSignatureParameter,
    Transport,
    EqBand,
    AutomationTarget,
  };

  /**
   * Transforms a parsed XML object back into a structure suitable for TypeScript classes.
   * Uses decorator metadata to map XML attributes and elements to class properties,
   * applying type adapters and handling wrapped collections and ID references.
   * @param obj - The parsed XML object.
   * @param classOrInstance - The class constructor or instance for metadata lookup.
   * @returns The transformed object with properties restored (e.g., value instead of @_value).
   */
  function transformForDeserialization(obj: any, classOrInstance: any): any {
    if (!obj || typeof obj !== "object") return obj;

    // Handle arrays
    if (Array.isArray(obj)) {
      return obj.map(item =>
        transformForDeserialization(item, classOrInstance)
      );
    }

    // Collect metadata from class hierarchy
    const hierarchy = getClassHierarchy(classOrInstance);
    const attributes = hierarchy.flatMap(
      cls => Reflect.getMetadata(METADATA_KEYS.ATTRIBUTES, cls) || []
    );
    const elements = hierarchy.flatMap(
      cls => Reflect.getMetadata(METADATA_KEYS.ELEMENTS, cls) || []
    );
    const idrefs = hierarchy.flatMap(
      cls => Reflect.getMetadata(METADATA_KEYS.IDREF, cls) || []
    );
    const wrappers = hierarchy.flatMap(
      cls => Reflect.getMetadata(METADATA_KEYS.WRAPPER, cls) || []
    );
    const elementRefs = hierarchy.flatMap(
      cls => Reflect.getMetadata(METADATA_KEYS.ELEMENT_REF, cls) || []
    );
    const adapters = hierarchy.reduce(
      (acc, cls) => ({
        ...acc,
        ...(Reflect.getMetadata(METADATA_KEYS.ADAPTER, cls) || {}),
      }),
      {}
    );

    const result: any = {};

    // Process attributes (e.g., @_value -> value)
    for (const attr of attributes) {
      const key = attr.key;
      const xmlKey = `@_${key}`;
      if (xmlKey in obj) {
        let value = obj[xmlKey];
        // Get expected type using reflection metadata
        const expectedType = Reflect.getMetadata(
          "design:type",
          classOrInstance.prototype, // Target the prototype for metadata
          key
        );

        if (adapters[key]) {
          // Apply custom type adapter first if available
          value = adapters[key].unmarshal(value);
        } else if (expectedType) {
          // Perform standard type conversion based on reflected type
          if (expectedType === String && typeof value !== "string") {
            value = String(value);
          } else if (expectedType === Number && typeof value !== "number") {
            const num = Number(value);
            if (!isNaN(num)) {
              value = num;
            }
          } else if (expectedType === Boolean && typeof value !== "boolean") {
            // Handle boolean conversion (common with allowBooleanAttributes)
            if (typeof value === "string") {
              value = value.toLowerCase() === "true";
            } else {
              value = Boolean(value);
            }
          }
          // Add other type checks (e.g., Date) if needed
        }

        console.log(
          `Processing attribute '${key}' for ${classOrInstance.name}: value =`,
          value,
          `(typeof ${typeof value})`
        );
        result[key] = value; // Assign the processed value
      } else if (attr.required) {
        // throw new Error(
        //   `Required attribute '${key}' is missing in ${classOrInstance.name}`
        // );
      }
    }

    // Process elements (e.g., Volume -> volume) and element references (e.g., Content -> content)
    for (const key in obj) {
      if (key.startsWith("@_")) continue; // Skip attributes

      const elem = elements.find(e => (e.name || e.key) === key);
      const elemRef = elementRefs.find(
        er =>
          (er.name || er.key) === key ||
          (classRegistry[key] &&
            elementRefs.some(er => er.key === er.name || er.key === key))
      ); // Basic check for element references by name or class name

      if (elem) {
        const elemName = elem.name || elem.key;
        const wrapper = wrappers.find(w => w.key === elem.key);

        if (wrapper) {
          if (
            wrapper.required &&
            (!obj[wrapper.name] || !obj[wrapper.name][elemName])
          ) {
            throw new Error(
              `Required wrapped element '${wrapper.name}' is missing in ${classOrInstance.name}`
            );
          }
          if (obj[wrapper.name] && obj[wrapper.name][elemName]) {
            // Handle wrapped collections
            const type = elem.type ? classRegistry[elem.type] : undefined;
            result[elem.key] = Array.isArray(obj[wrapper.name][elemName])
              ? obj[wrapper.name][elemName].map((item: any) =>
                  transformForDeserialization(item, type)
                )
              : [
                  transformForDeserialization(
                    obj[wrapper.name][elemName],
                    type
                  ),
                ];
          }
        } else {
          // Handle single elements
          const type = elem.type ? classRegistry[elem.type] : undefined;
          result[elem.key] = transformForDeserialization(obj[key], type);
        }
      } else if (elemRef) {
        const wrapper = wrappers.find(w => w.key === elemRef.key);
        if (wrapper) {
          if (
            wrapper.required &&
            (!obj[wrapper.name] || !obj[wrapper.name][key])
          ) {
            throw new Error(
              `Required wrapped element '${wrapper.name}' is missing in ${classOrInstance.name}`
            );
          }
          if (obj[wrapper.name] && obj[wrapper.name][key]) {
            // Handle wrapped collections with element references
            const type = classRegistry[key]; // Determine type from element name
            result[elemRef.key] = Array.isArray(obj[wrapper.name][key])
              ? obj[wrapper.name][key].map((item: any) =>
                  transformForDeserialization(item, type)
                )
              : [transformForDeserialization(obj[wrapper.name][key], type)];
          }
        } else {
          // Handle single element references
          const type = classRegistry[key]; // Determine type from element name
          result[elemRef.key] = transformForDeserialization(obj[key], type);
        }
      }
    }

    // Process ID references (e.g., @_destination -> destination)
    for (const idref of idrefs) {
      const xmlKey = `@_${idref}`;
      if (xmlKey in obj) {
        result[idref] = { id: obj[xmlKey] }; // Placeholder for reference resolution
      }
    }

    return result;
  }

  const transformed = transformForDeserialization(parsed[rootName], rootClass);

  function mapToClass(obj: any, clazz: new (...args: any[]) => any): any {
    if (!obj) return undefined;

    // Handle arrays
    if (Array.isArray(obj)) {
      return obj.map(item => mapToClass(item, clazz));
    }

    // Instantiate the class
    const instance = new clazz();

    // Get metadata for validation and mapping
    const hierarchy = getClassHierarchy(clazz);
    const attributes = hierarchy.flatMap(
      cls => Reflect.getMetadata(METADATA_KEYS.ATTRIBUTES, cls) || []
    );
    const elements = hierarchy.flatMap(
      cls => Reflect.getMetadata(METADATA_KEYS.ELEMENTS, cls) || []
    );
    // Also get elementRefs metadata
    const elementRefs = hierarchy.flatMap(
      cls => Reflect.getMetadata(METADATA_KEYS.ELEMENT_REF, cls) || []
    );

    // Map properties from the transformed object (obj) to the instance
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const elementMeta = elements.find((elem: any) => elem.key === key);
        const elementRefMeta = elementRefs.find((ref: any) => ref.key === key);

        if (elementMeta) {
          // Element: Recursively map to the correct class type
          const elementType = elementMeta.type
            ? classRegistry[elementMeta.type]
            : undefined;
          if (Array.isArray(obj[key])) {
            // Handle arrays (e.g., wrapped collections)
            instance[key] = obj[key].map((item: any) =>
              mapToClass(item, elementType || Object)
            );
          } else if (elementType) {
            // Handle single element with known type
            instance[key] = mapToClass(obj[key], elementType);
          } else {
            // Assign as is if type unknown or not an array
            instance[key] = obj[key];
          }
        } else if (elementRefMeta) {
          // Element Reference: Recursively map (needs robust type detection)
          // Placeholder logic - assumes obj[key] holds the transformed data for the referenced object(s)
          if (Array.isArray(obj[key])) {
            // Map array items (needs better type detection than Object)
            instance[key] = obj[key].map((item: any) =>
              mapToClass(item, Object)
            ); // Use Object for now
          } else if (typeof obj[key] === "object" && obj[key] !== null) {
            // Map single object (needs better type detection than Object)
            instance[key] = mapToClass(obj[key], Object); // Use Object for now
          } else {
            // Assign primitive value if any
            instance[key] = obj[key];
          }
        } else {
          // Not a decorated element or elementRef.
          // Assume it's an attribute or simple property processed by transformForDeserialization.
          let valueToAssign = obj[key];

          // Check reflected type for attributes/simple properties and convert if necessary
          const attributeMeta = attributes.find(
            (attr: any) => attr.key === key
          );
          if (attributeMeta) {
            const expectedType = Reflect.getMetadata(
              "design:type",
              clazz.prototype, // Target the prototype
              key
            );
            if (expectedType === String && typeof valueToAssign !== "string") {
              valueToAssign = String(valueToAssign);
            } else if (
              expectedType === Number &&
              typeof valueToAssign !== "number"
            ) {
              const num = Number(valueToAssign);
              if (!isNaN(num)) {
                valueToAssign = num;
              }
            }
            // Add other type checks if needed
          }

          // Assign the processed value to the instance.
          instance[key] = valueToAssign;
        }
      }
    }

    return instance;
  }

  return mapToClass(transformed, rootClass);
}
