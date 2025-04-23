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
    const attributes: any = {};
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
    this.name = xmlObject["@_name"] || undefined;
    this.color = xmlObject["@_color"] || undefined;
    this.comment = xmlObject["@_comment"] || undefined;
  }
}
