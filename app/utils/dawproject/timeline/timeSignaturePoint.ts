import type { ITimeSignaturePoint } from "../types";
import { Point } from "./point";

export class TimeSignaturePoint extends Point implements ITimeSignaturePoint {
  numerator: number;
  denominator: number;

  constructor(time?: number, numerator?: number, denominator?: number) {
    super(time); // time is now optional in Point
    // Make numerator and denominator optional for deserialization, fromXmlObject will set them
    this.numerator = numerator || 0; // Provide a default placeholder
    this.denominator = denominator || 0; // Provide a default placeholder
  }

  toXmlObject(): any {
    const attributes = super.toXmlObject(); // Get attributes from Point
    attributes.numerator = this.numerator;
    attributes.denominator = this.denominator;
    return { TimeSignaturePoint: attributes };
  }

  fromXmlObject(xmlObject: any): this {
    super.fromXmlObject(xmlObject); // Populate inherited attributes from Point
    this.numerator =
      xmlObject.numerator !== undefined ? parseInt(xmlObject.numerator, 10) : 0;
    this.denominator =
      xmlObject.denominator !== undefined
        ? parseInt(xmlObject.denominator, 10)
        : 0;
    return this;
  }
}
