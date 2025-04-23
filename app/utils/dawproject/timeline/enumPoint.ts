import { XMLBuilder, XMLParser } from "fast-xml-parser";

import type { IEnumPoint } from "../types";
import { XML_BUILDER_OPTIONS, XML_PARSER_OPTIONS } from "../xml/options";
import { Point } from "./point";

export class EnumPoint extends Point implements IEnumPoint {
  value: number;

  constructor(time: number, value: number) {
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
      throw new Error("Required attribute 'value' missing for EnumPoint");
    }

    return { EnumPoint: attributes };
  }

  toXml(): string {
    const builder = new XMLBuilder(XML_BUILDER_OPTIONS);
    return builder.build(this.toXmlObject());
  }

  static fromXmlObject(xmlObject: any): EnumPoint {
    // Create instance with temporary values
    const instance = new EnumPoint(0, 0);

    // Populate inherited attributes
    instance.populateFromXml(xmlObject);

    // Validate and populate required value attribute
    if (xmlObject["@_value"] === undefined) {
      throw new Error("Required attribute 'value' missing in XML");
    }

    instance.value = parseInt(xmlObject["@_value"], 10);
    if (isNaN(instance.value)) {
      throw new Error("Invalid enum value in XML");
    }

    return instance;
  }

  static fromXml(xmlString: string): EnumPoint {
    const parser = new XMLParser(XML_PARSER_OPTIONS);
    const jsonObj = parser.parse(xmlString);
    return EnumPoint.fromXmlObject(jsonObj.EnumPoint);
  }
}
