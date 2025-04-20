import { INameable } from "./types";

export abstract class Nameable implements INameable {
  /** Name/label of this object. */
  name?: string;
  /** Color of this object in HTML-style format. (#rrggbb) */
  color?: string;
  /** Comment/description of this object. */
  comment?: string;

  constructor(name?: string, color?: string, comment?: string) {
    this.name = name;
    this.color = color;
    this.comment = comment;
  }

  protected getXmlAttributes(): any {
    const attributes: any = {};
    if (this.name !== undefined) {
      attributes.name = this.name;
    }
    if (this.color !== undefined) {
      attributes.color = this.color;
    }
    if (this.comment !== undefined) {
      attributes.comment = this.comment;
    }
    return attributes;
  }

  protected populateFromXml(xmlObject: any): void {
    this.name = xmlObject.name || undefined;
    this.color = xmlObject.color || undefined;
    this.comment = xmlObject.comment || undefined;
  }

  // Concrete subclasses will implement their own toXmlObject and fromXmlObject methods
  abstract toXmlObject(): any;
  static fromXmlObject(xmlObject: any): Nameable {
    throw new Error("fromXmlObject must be implemented by subclasses");
  }
}
