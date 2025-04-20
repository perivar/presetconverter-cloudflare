import { XMLBuilder, XMLParser } from "fast-xml-parser";

import type { IBoolPoint } from "../types";
import { Point } from "./point";

export class BoolPoint extends Point implements IBoolPoint {
  value: boolean;

  constructor(time: number, value: boolean) {
    super(time);
    this.value = value;
  }

  toXmlObject(): any {
    const obj = super.getXmlAttributes(); // Get attributes from Point
    obj.value = this.value;
    return { BoolPoint: obj };
  }

  toXml(): string {
    const builder = new XMLBuilder({ attributeNamePrefix: "" });
    return builder.build(this.toXmlObject());
  }

  static fromXmlObject(xmlObject: any): BoolPoint {
    const instance = new BoolPoint(0, false); // Create instance with default values
    instance.populateFromXml(xmlObject); // Populate inherited attributes from Point
    instance.value =
      xmlObject.value !== undefined
        ? String(xmlObject.value).toLowerCase() === "true"
        : false;
    return instance;
  }

  static fromXml(xmlString: string): BoolPoint {
    const parser = new XMLParser({ attributeNamePrefix: "" });
    const jsonObj = parser.parse(xmlString);
    return BoolPoint.fromXmlObject(jsonObj.BoolPoint);
  }
}
