import { XMLBuilder, XMLParser } from "fast-xml-parser";

import { DoubleAdapter } from "../doubleAdapter";
import { Interpolation } from "../interpolation";
import { IPoint, Point } from "./point";

export interface IRealPoint extends IPoint {
  value: number;
  interpolation?: Interpolation;
}

export class RealPoint extends Point implements IRealPoint {
  value: number;
  interpolation?: Interpolation;

  constructor(time: number, value: number, interpolation?: Interpolation) {
    super(time);
    this.value = value;
    this.interpolation = interpolation;
  }

  toXmlObject(): any {
    const obj = super.getXmlAttributes(); // Get attributes from Point
    obj.value = DoubleAdapter.toXml(this.value) || "";
    if (this.interpolation !== undefined) {
      obj.interpolation = this.interpolation;
    }
    return { RealPoint: obj };
  }

  toXml(): string {
    const builder = new XMLBuilder({ attributeNamePrefix: "" });
    return builder.build(this.toXmlObject());
  }

  static fromXmlObject(xmlObject: any): RealPoint {
    const instance = new RealPoint(0, 0); // Create instance with default values
    instance.populateFromXml(xmlObject); // Populate inherited attributes from Point
    instance.value =
      xmlObject.value !== undefined
        ? DoubleAdapter.fromXml(xmlObject.value) || 0
        : 0;
    instance.interpolation = xmlObject.interpolation
      ? (xmlObject.interpolation as Interpolation)
      : undefined; // Cast string to Interpolation
    return instance;
  }

  static fromXml(xmlString: string): RealPoint {
    const parser = new XMLParser({ attributeNamePrefix: "" });
    const jsonObj = parser.parse(xmlString);
    return RealPoint.fromXmlObject(jsonObj.RealPoint);
  }
}
