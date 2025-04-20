import { XMLBuilder, XMLParser } from "fast-xml-parser";

import type { IEnumPoint } from "../types";
import { Point } from "./point";

export class EnumPoint extends Point implements IEnumPoint {
  value: number;

  constructor(time: number, value: number) {
    super(time);
    this.value = value;
  }

  toXmlObject(): any {
    const obj = super.getXmlAttributes(); // Get attributes from Point
    obj.value = this.value;
    return { EnumPoint: obj };
  }

  toXml(): string {
    const builder = new XMLBuilder({ attributeNamePrefix: "" });
    return builder.build(this.toXmlObject());
  }

  static fromXmlObject(xmlObject: any): EnumPoint {
    const instance = new EnumPoint(0, 0); // Create instance with default values
    instance.populateFromXml(xmlObject); // Populate inherited attributes from Point
    instance.value =
      xmlObject.value !== undefined ? parseInt(xmlObject.value, 10) : 0;
    return instance;
  }

  static fromXml(xmlString: string): EnumPoint {
    const parser = new XMLParser({ attributeNamePrefix: "" });
    const jsonObj = parser.parse(xmlString);
    return EnumPoint.fromXmlObject(jsonObj.EnumPoint);
  }
}
