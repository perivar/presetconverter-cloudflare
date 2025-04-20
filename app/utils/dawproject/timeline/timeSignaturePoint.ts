import { XMLBuilder, XMLParser } from "fast-xml-parser";

import type { ITimeSignaturePoint } from "../types";
import { Point } from "./point";

export class TimeSignaturePoint extends Point implements ITimeSignaturePoint {
  numerator: number;
  denominator: number;

  constructor(time: number, numerator: number, denominator: number) {
    super(time);
    this.numerator = numerator;
    this.denominator = denominator;
  }

  toXmlObject(): any {
    const obj = super.getXmlAttributes(); // Get attributes from Point
    obj.numerator = this.numerator;
    obj.denominator = this.denominator;
    return { TimeSignaturePoint: obj };
  }

  toXml(): string {
    const builder = new XMLBuilder({ attributeNamePrefix: "" });
    return builder.build(this.toXmlObject());
  }

  static fromXmlObject(xmlObject: any): TimeSignaturePoint {
    const instance = new TimeSignaturePoint(0, 0, 0); // Create instance with default values
    instance.populateFromXml(xmlObject); // Populate inherited attributes from Point
    instance.numerator =
      xmlObject.numerator !== undefined ? parseInt(xmlObject.numerator, 10) : 0;
    instance.denominator =
      xmlObject.denominator !== undefined
        ? parseInt(xmlObject.denominator, 10)
        : 0;
    return instance;
  }

  static fromXml(xmlString: string): TimeSignaturePoint {
    const parser = new XMLParser({ attributeNamePrefix: "" });
    const jsonObj = parser.parse(xmlString);
    return TimeSignaturePoint.fromXmlObject(jsonObj.TimeSignaturePoint);
  }
}
