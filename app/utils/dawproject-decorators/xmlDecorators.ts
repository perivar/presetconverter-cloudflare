import "reflect-metadata";

// Metadata keys for storing decorator information
export const METADATA_KEYS = {
  ROOT_ELEMENT: Symbol("xml:rootElement"), // Key for root element name
  ATTRIBUTES: Symbol("xml:attributes"), // Key for attribute properties
  ELEMENTS: Symbol("xml:elements"), // Key for element properties
  IDREF: Symbol("xml:idref"), // Key for ID reference properties
  WRAPPER: Symbol("xml:wrapper"), // Key for collection wrapper elements
  ADAPTER: Symbol("xml:adapter"), // Key for type adapters
  ELEMENT_REF: Symbol("xml:elementRef"), // Key for polymorphic element references
};

/**
 * Decorator to specify the XML root element name for a class.
 * Applied at the class level to define the tag name used when serializing the object to XML.
 * @param options - Configuration object with the root element name.
 * @example
 * @XmlRootElement({ name: 'Note' })
 * class Note {}
 */
export function XmlRootElement(options: { name: string }) {
  return function (target: any) {
    Reflect.defineMetadata(METADATA_KEYS.ROOT_ELEMENT, options.name, target);
  };
}

/**
 * Decorator to mark a property as an XML attribute.
 * The property will be serialized as an attribute (e.g., name="value") in the XML element.
 * @param options - Optional configuration, including whether the attribute is required and custom name.
 * @example
 * @XmlAttribute({ required: true, name: 'vel' })
 * velocity: number;
 */
export function XmlAttribute(
  options: { required?: boolean; name?: string } = {}
) {
  return function (target: any, propertyKey: string) {
    const attributes: Array<{
      key: string;
      required?: boolean;
      name?: string;
    }> =
      Reflect.getMetadata(METADATA_KEYS.ATTRIBUTES, target.constructor) || [];
    attributes.push({ key: propertyKey, ...options });
    Reflect.defineMetadata(
      METADATA_KEYS.ATTRIBUTES,
      attributes,
      target.constructor
    );
  };
}

/**
 * Decorator to mark a property as an XML element.
 * The property will be serialized as a child element, with an optional custom tag name.
 * @param options - Configuration for element name, required status, and type (for deserialization).
 * @example
 * @XmlElement({ name: 'Volume', required: false, type: 'RealParameter' })
 * volume?: RealParameter;
 */
export function XmlElement(
  options: { name?: string; required?: boolean; type?: string } = {}
) {
  return function (target: any, propertyKey: string) {
    const elements: Array<{
      key: string;
      name?: string;
      required?: boolean;
      type?: string;
    }> = Reflect.getMetadata(METADATA_KEYS.ELEMENTS, target.constructor) || [];
    elements.push({ key: propertyKey, ...options });
    Reflect.defineMetadata(
      METADATA_KEYS.ELEMENTS,
      elements,
      target.constructor
    );
  };
}

/**
 * Decorator to mark a property as a polymorphic XML element reference.
 * Used for single objects or collections where the actual type can be a subclass of the declared type.
 * The type is determined by the XML element name or a type attribute during deserialization.
 * @param options - Optional configuration for the element name and base type.
 * @example
 * @XmlElementRef({ name: 'Content', baseType: 'Timeline' })
 * content?: Timeline;
 * @example
 * @XmlElementWrapper('Devices')
 * @XmlElementRef()
 * devices: Device[] = [];
 */
export function XmlElementRef(
  options: { name?: string; baseType?: string } = {}
) {
  return function (target: any, propertyKey: string) {
    const elementRefs: Array<{
      key: string;
      name?: string;
      baseType?: string;
    }> =
      Reflect.getMetadata(METADATA_KEYS.ELEMENT_REF, target.constructor) || [];
    elementRefs.push({ key: propertyKey, ...options });
    Reflect.defineMetadata(
      METADATA_KEYS.ELEMENT_REF,
      elementRefs,
      target.constructor
    );
  };
}

/**
 * Decorator to mark a property as an XML ID reference.
 * The property will be serialized as an attribute referencing another object's ID.
 * Assumes the referenced object has an 'id' property.
 * @example
 * @XmlIDREF
 * @XmlAttribute()
 * destination?: Channel;
 */
export function XmlIDREF(target: any, propertyKey: string) {
  const idrefs: string[] =
    Reflect.getMetadata(METADATA_KEYS.IDREF, target.constructor) || [];
  idrefs.push(propertyKey);
  Reflect.defineMetadata(METADATA_KEYS.IDREF, idrefs, target.constructor);
}

/**
 * Decorator to specify a wrapper element for a collection property.
 * The collection will be wrapped in an element with the specified name during serialization.
 * @param name - The name of the wrapper element.
 * @example
 * @XmlElementWrapper({ name: "Sends" })
 * @XmlElement({ name: "Send", type: "Send" })
 * sends: Send[] = [];
 */
export function XmlElementWrapper(options: {
  name: string;
  required?: boolean;
}) {
  return function (target: any, propertyKey: string) {
    const wrappers: Array<{ key: string; name: string; required?: boolean }> =
      Reflect.getMetadata(METADATA_KEYS.WRAPPER, target.constructor) || [];
    wrappers.push({ key: propertyKey, ...options });
    Reflect.defineMetadata(METADATA_KEYS.WRAPPER, wrappers, target.constructor);
  };
}

/**
 * Decorator to specify a custom type adapter for a property.
 * The adapter handles marshaling (to XML) and unmarshaling (from XML) of property values.
 * Useful for custom formats, like representing Infinity as 'inf'.
 * @param adapter - The adapter class with static marshal and unmarshal methods.
 * @example
 * @XmlTypeAdapter(DoubleAdapter)
 * @XmlAttribute()
 * value?: number;
 */
export function XmlTypeAdapter(adapter: {
  marshal: (value: any) => any;
  unmarshal: (value: any) => any;
}) {
  return function (target: any, propertyKey: string) {
    const adapters: Record<string, any> =
      Reflect.getMetadata(METADATA_KEYS.ADAPTER, target.constructor) || {};
    adapters[propertyKey] = adapter;
    Reflect.defineMetadata(METADATA_KEYS.ADAPTER, adapters, target.constructor);
  };
}
