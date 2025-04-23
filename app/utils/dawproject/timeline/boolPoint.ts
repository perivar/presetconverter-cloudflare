import { XMLBuilder, XMLParser } from "fast-xml-parser";

import type { IBoolPoint } from "../types";
import { XML_BUILDER_OPTIONS, XML_PARSER_OPTIONS } from "../xml/options";
import { Point } from "./point";

export class BoolPoint extends Point implements IBoolPoint {
  value: boolean;

  constructor(time: number, value: boolean) {
    super(time);
    this.value = value;
  }

  toXmlObject(): any {
    // Get inherited attributes first
    const attributes = super.getXmlAttributes(); // Get attributes from Point

    // Add required value attribute
    if (this.value !== undefined) {
      attributes["@_value"] = this.value;
    } else {
      throw new Error("Required attribute 'value' missing for BoolPoint");
    }

    return { BoolPoint: attributes };
  }

  toXml(): string {
    const builder = new XMLBuilder(XML_BUILDER_OPTIONS);
    return builder.build(this.toXmlObject());
  }

  static fromXmlObject(xmlObject: any): BoolPoint {
    // Create instance with temporary values
    const instance = new BoolPoint(0, false);

    // Populate inherited attributes
    instance.populateFromXml(xmlObject);

    // Validate and populate required value attribute
    if (xmlObject["@_value"] === undefined) {
      throw new Error("Required attribute 'value' missing in XML");
    }

    instance.value = String(xmlObject["@_value"]).toLowerCase() === "true";

    return instance;
  }

  static fromXml(xmlString: string): BoolPoint {
    const parser = new XMLParser(XML_PARSER_OPTIONS);
    const jsonObj = parser.parse(xmlString);
    return BoolPoint.fromXmlObject(jsonObj.BoolPoint);
  }
}
