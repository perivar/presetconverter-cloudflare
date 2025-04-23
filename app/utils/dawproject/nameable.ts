import { INameable } from "./types";
import { XmlObject } from "./XmlObject";

export abstract class Nameable extends XmlObject implements INameable {
  /** Name/label of this object. */
  name?: string;
  /** Color of this object in HTML-style format. (#rrggbb) */
  color?: string;
  /** Comment/description of this object. */
  comment?: string;

  constructor(name?: string, color?: string, comment?: string) {
    super();
    this.name = name;
    this.color = color;
    this.comment = comment;
  }

  protected getXmlAttributes(): any {
    // Create object for attributes
    const attributes: any = {};

    // Add optional attributes
    if (this.name !== undefined) {
      attributes["@_name"] = this.name;
    }
    if (this.color !== undefined) {
      attributes["@_color"] = this.color;
    }
    if (this.comment !== undefined) {
      attributes["@_comment"] = this.comment;
    }

    return attributes;
  }

  protected populateFromXml(xmlObject: any): void {
    // Populate optional attributes
    if (xmlObject["@_name"] !== undefined) {
      this.name = xmlObject["@_name"];
    }
    if (xmlObject["@_color"] !== undefined) {
      this.color = xmlObject["@_color"];
    }
    if (xmlObject["@_comment"] !== undefined) {
      this.comment = xmlObject["@_comment"];
    }
  }
}
