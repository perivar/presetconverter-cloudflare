import { XMLBuilder, XMLParser } from "fast-xml-parser";

import { DoubleAdapter } from "../doubleAdapter";
import { Interpolation } from "../interpolation";
import type { IRealPoint } from "../types";
import { XML_BUILDER_OPTIONS, XML_PARSER_OPTIONS } from "../xml/options";
import { Point } from "./point";

export class RealPoint extends Point implements IRealPoint {
  value: number;
  interpolation?: Interpolation;

  constructor(time: number, value: number, interpolation?: Interpolation) {
    super(time);
    this.value = value;
    this.interpolation = interpolation;
  }

  toXmlObject(): any {
    // Get inherited attributes first
    const attributes = super.getXmlAttributes(); // Get attributes from Point

    // Add required value attribute
    if (this.value !== undefined) {
      attributes["@_value"] = DoubleAdapter.toXml(this.value) || "";
    } else {
      throw new Error("Required attribute 'value' missing for RealPoint");
    }

    // Add optional interpolation attribute
    if (this.interpolation !== undefined) {
      attributes["@_interpolation"] = this.interpolation;
    }

    return { RealPoint: attributes };
  }

  toXml(): string {
    const builder = new XMLBuilder(XML_BUILDER_OPTIONS);
    return builder.build(this.toXmlObject());
  }

  static fromXmlObject(xmlObject: any): RealPoint {
    // Create instance with temporary values
    const instance = new RealPoint(0, 0);

    // Populate inherited attributes
    instance.populateFromXml(xmlObject);

    // Validate and populate required value attribute
    if (!xmlObject["@_value"]) {
      throw new Error("Required attribute 'value' missing in XML");
    }

    const pointValue = DoubleAdapter.fromXml(xmlObject["@_value"]);
    if (pointValue === undefined) {
      throw new Error("Invalid value in XML");
    }
    instance.value = pointValue;

    // Populate optional interpolation attribute
    if (xmlObject["@_interpolation"] !== undefined) {
      instance.interpolation = xmlObject["@_interpolation"] as Interpolation;
    }

    return instance;
  }

  static fromXml(xmlString: string): RealPoint {
    const parser = new XMLParser(XML_PARSER_OPTIONS);
    const jsonObj = parser.parse(xmlString);
    return RealPoint.fromXmlObject(jsonObj.RealPoint);
  }
}
