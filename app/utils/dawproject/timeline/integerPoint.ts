import { XMLBuilder, XMLParser } from "fast-xml-parser";

import { IIntegerPoint } from "../types";
import { Point } from "./point";

export class IntegerPoint extends Point implements IIntegerPoint {
  value: number;

  constructor(time: number, value: number) {
    super(time);
    this.value = value;
  }

  toXmlObject(): any {
    const obj = super.getXmlAttributes(); // Get attributes from Point
    obj.value = this.value;
    return { IntegerPoint: obj };
  }

  toXml(): string {
    const builder = new XMLBuilder({ attributeNamePrefix: "" });
    return builder.build(this.toXmlObject());
  }

  static fromXmlObject(xmlObject: any): IntegerPoint {
    const instance = new IntegerPoint(0, 0); // Create instance with default values
    instance.populateFromXml(xmlObject); // Populate inherited attributes from Point
    instance.value =
      xmlObject.value !== undefined ? parseInt(xmlObject.value, 10) : 0;
    return instance;
  }

  static fromXml(xmlString: string): IntegerPoint {
    const parser = new XMLParser({ attributeNamePrefix: "" });
    const jsonObj = parser.parse(xmlString);
    return IntegerPoint.fromXmlObject(jsonObj.IntegerPoint);
  }
}
