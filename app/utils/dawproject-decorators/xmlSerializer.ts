import {
  X2jOptions,
  XMLBuilder,
  XmlBuilderOptions,
  XMLParser,
} from "fast-xml-parser";

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
import { Clip } from "./timeline/clip";
import { Clips } from "./timeline/clips";
import { ClipSlot } from "./timeline/clipSlot";
import { Lanes } from "./timeline/lanes";
import { Marker } from "./timeline/marker";
import { Markers } from "./timeline/markers";
import { Points } from "./timeline/points";
import { Warp } from "./timeline/warp";
import { Warps } from "./timeline/warps";
import { TimeSignatureParameter } from "./timeSignatureParameter";
import { Track } from "./track";
import { Transport } from "./transport";
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

// Class registry to map XML element names to class constructors
const classRegistry: Record<string, new (...args: any[]) => any> = {
  Application,
  Arrangement,
  AuPlugin,
  AutomationTarget,
  BoolParameter,
  Channel,
  ClapPlugin,
  Clip,
  Clips,
  ClipSlot,
  Compressor,
  EnumParameter,
  EqBand,
  Equalizer,
  FileReference,
  IntegerParameter,
  Lanes,
  Limiter,
  Marker,
  Markers,
  MetaData,
  NoiseGate,
  Points,
  Project,
  RealParameter,
  Scene,
  Send,
  TimeSignatureParameter,
  Track,
  Transport,
  Vst2Plugin,
  Vst3Plugin,
  Warp,
  Warps,
};

// Serialization function: Converts an object to an XML string
export function serializeToXml(obj: any): string {
  const rootName = Reflect.getMetadata(
    METADATA_KEYS.ROOT_ELEMENT,
    obj.constructor
  );
  if (!rootName) {
    throw new Error("No @XmlRootElement defined for the class");
  }
  const xmlObj = buildXmlObject(obj);
  const xml = builder.build({ [rootName]: xmlObj });
  return xml;
}

// Helper function to build the XML object structure
function buildXmlObject(obj: any): any {
  const xmlObj: any = {};

  // Handle attributes
  const attributes =
    Reflect.getMetadata(METADATA_KEYS.ATTRIBUTES, obj.constructor) || [];
  for (const attr of attributes) {
    let value = obj[attr.key];
    if (value !== undefined) {
      const adapter = Reflect.getMetadata(
        METADATA_KEYS.ADAPTER,
        obj.constructor
      )?.[attr.key];
      if (adapter) {
        value = adapter.marshal(value);
      }
      xmlObj[`@_${attr.name || attr.key}`] = value;
    } else if (attr.required) {
      throw new Error(`Required attribute ${attr.key} is missing`);
    }
  }

  // Handle elements
  const elements =
    Reflect.getMetadata(METADATA_KEYS.ELEMENTS, obj.constructor) || [];
  for (const elem of elements) {
    const value = obj[elem.key];
    if (value !== undefined) {
      const adapter = Reflect.getMetadata(
        METADATA_KEYS.ADAPTER,
        obj.constructor
      )?.[elem.key];
      if (adapter) {
        xmlObj[elem.name || elem.key] = adapter.marshal(value);
      } else if (Array.isArray(value)) {
        const wrapper = Reflect.getMetadata(
          METADATA_KEYS.WRAPPER,
          obj.constructor
        )?.find((w: any) => w.key === elem.key);
        if (wrapper) {
          const wrappedItems = value.map((item: any) => buildXmlObject(item));
          xmlObj[wrapper.name] = { [elem.name || elem.key]: wrappedItems };
        } else {
          xmlObj[elem.name || elem.key] = value.map((item: any) =>
            buildXmlObject(item)
          );
        }
      } else if (typeof value === "object" && value !== null) {
        xmlObj[elem.name || elem.key] = buildXmlObject(value);
      } else {
        xmlObj[elem.name || elem.key] = value;
      }
    } else if (elem.required) {
      throw new Error(`Required element ${elem.key} is missing`);
    }
  }

  // Handle IDREF
  const idrefs =
    Reflect.getMetadata(METADATA_KEYS.IDREF, obj.constructor) || [];
  for (const idref of idrefs) {
    const referencedObj = obj[idref];
    if (referencedObj && referencedObj.id !== undefined) {
      xmlObj[`@_${idref}`] = referencedObj.id;
    }
  }

  // Handle ElementRef (polymorphic properties)
  const elementRefs =
    Reflect.getMetadata(METADATA_KEYS.ELEMENT_REF, obj.constructor) || [];
  for (const elemRef of elementRefs) {
    const value = obj[elemRef.key];
    if (value !== undefined) {
      if (Array.isArray(value)) {
        const wrappedItems = value.map((item: any) => {
          const itemRootName = Reflect.getMetadata(
            METADATA_KEYS.ROOT_ELEMENT,
            item.constructor
          );
          return { [itemRootName]: buildXmlObject(item) };
        });
        xmlObj[elemRef.name || elemRef.key] = wrappedItems;
      } else {
        const itemRootName = Reflect.getMetadata(
          METADATA_KEYS.ROOT_ELEMENT,
          value.constructor
        );
        xmlObj[itemRootName] = buildXmlObject(value);
      }
    }
  }

  return xmlObj;
}

// Deserialization function: Converts an XML string to an object of type T
export function deserializeFromXml<T>(
  xml: string,
  rootClass: new (...args: any[]) => T
): T {
  const parsedObj = parser.parse(xml);

  const rootKeys = Object.keys(parsedObj);
  if (rootKeys.length !== 1) {
    throw new Error("Invalid XML: multiple root elements");
  }
  const rootElementName = rootKeys[0];
  const rootData = parsedObj[rootElementName];

  const expectedRootName = Reflect.getMetadata(
    METADATA_KEYS.ROOT_ELEMENT,
    rootClass
  );
  if (rootElementName !== expectedRootName) {
    throw new Error(
      `Expected root element ${expectedRootName}, but got ${rootElementName}`
    );
  }

  return deserializeFromXmlObject(rootData, rootClass);
}

// Helper function to deserialize from an XML object
function deserializeFromXmlObject<T>(
  xmlObj: any,
  cls: new (...args: any[]) => T
): T {
  const instance = new cls();

  // Set attributes
  const attributes = Reflect.getMetadata(METADATA_KEYS.ATTRIBUTES, cls) || [];
  for (const attr of attributes) {
    const attrName = `@_${attr.name || attr.key}`;
    if (attrName in xmlObj) {
      let value = xmlObj[attrName];
      const adapter = Reflect.getMetadata(METADATA_KEYS.ADAPTER, cls)?.[
        attr.key
      ];
      if (adapter) {
        value = adapter.unmarshal(value);
      }
      (instance as any)[attr.key] = value;
    } else if (attr.required) {
      throw new Error(`Required attribute ${attr.key} is missing`);
    }
  }

  // Set elements
  const elements = Reflect.getMetadata(METADATA_KEYS.ELEMENTS, cls) || [];
  for (const elem of elements) {
    const elemName = elem.name || elem.key;
    if (elemName in xmlObj) {
      const value = xmlObj[elemName];
      const adapter = Reflect.getMetadata(METADATA_KEYS.ADAPTER, cls)?.[
        elem.key
      ];
      if (adapter) {
        (instance as any)[elem.key] = adapter.unmarshal(value);
      } else if (Array.isArray(value)) {
        const wrapper = Reflect.getMetadata(METADATA_KEYS.WRAPPER, cls)?.find(
          (w: any) => w.key === elem.key
        );
        if (wrapper) {
          const wrappedData = xmlObj[wrapper.name];
          if (wrappedData && elemName in wrappedData) {
            const items = wrappedData[elemName];
            (instance as any)[elem.key] = items.map((item: any) =>
              deserializeItem(item, elem.type)
            );
          }
        } else {
          (instance as any)[elem.key] = value.map((item: any) =>
            deserializeItem(item, elem.type)
          );
        }
      } else {
        (instance as any)[elem.key] = deserializeItem(value, elem.type);
      }
    } else if (elem.required) {
      throw new Error(`Required element ${elem.key} is missing`);
    }
  }

  // Handle ElementRef (polymorphic properties)
  const elementRefs = Reflect.getMetadata(METADATA_KEYS.ELEMENT_REF, cls) || [];
  for (const elemRef of elementRefs) {
    const elemName = elemRef.name || elemRef.key;
    if (elemName in xmlObj) {
      const value = xmlObj[elemName];
      if (Array.isArray(value)) {
        (instance as any)[elemRef.key] = value.map((item: any) => {
          const itemKeys = Object.keys(item);
          if (itemKeys.length === 1) {
            const actualElemName = itemKeys[0];
            const actualClass = classRegistry[actualElemName];
            if (actualClass) {
              return deserializeFromXmlObject(
                item[actualElemName],
                actualClass
              );
            }
            throw new Error(
              `No class registered for element ${actualElemName}`
            );
          }
          throw new Error(`Invalid structure for element ${elemName}`);
        });
      } else if (typeof value === "object" && value !== null) {
        const actualElemName = Object.keys(value)[0] || elemName;
        const actualClass = classRegistry[actualElemName];
        if (actualClass) {
          (instance as any)[elemRef.key] = deserializeFromXmlObject(
            value[actualElemName] || value,
            actualClass
          );
        } else {
          throw new Error(`No class registered for element ${actualElemName}`);
        }
      }
    }
  }

  return instance;
}

// Helper function to deserialize individual items
function deserializeItem(item: any, type?: string): any {
  if (typeof item === "object" && item !== null && type) {
    const cls = classRegistry[type];
    if (cls) {
      return deserializeFromXmlObject(item, cls);
    } else {
      throw new Error(`No class registered for type ${type}`);
    }
  }
  return item;
}
