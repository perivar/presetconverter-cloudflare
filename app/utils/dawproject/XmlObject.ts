export abstract class XmlObject {
  // Concrete subclasses will implement their own toXmlObject and fromXmlObject methods
  abstract toXmlObject(): any;
  abstract toXml(): string;
  static fromXml(xmlString: string): XmlObject {
    throw new Error("fromXml must be implemented by subclasses");
  }
  static fromXmlObject(xmlObject: any): XmlObject {
    throw new Error("fromXmlObject must be implemented by subclasses");
  }
}
