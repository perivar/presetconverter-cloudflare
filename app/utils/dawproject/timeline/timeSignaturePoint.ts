import { registerPoint } from "../registry/pointRegistry";
import type { ITimeSignaturePoint } from "../types";
import { Point } from "./point";

const timeSignaturePointFactory = (xmlObject: any): TimeSignaturePoint => {
  const instance = new TimeSignaturePoint();
  instance.fromXmlObject(xmlObject);
  return instance;
};

@registerPoint("TimeSignaturePoint", timeSignaturePointFactory)
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

    // Add required numerator attribute
    if (this.numerator !== undefined) {
      attributes["@_numerator"] = this.numerator;
    } else {
      throw new Error(
        "Required attribute 'numerator' missing for TimeSignaturePoint"
      );
    }

    // Add required denominator attribute
    if (this.denominator !== undefined) {
      attributes["@_denominator"] = this.denominator;
    } else {
      throw new Error(
        "Required attribute 'denominator' missing for TimeSignaturePoint"
      );
    }

    return { TimeSignaturePoint: attributes };
  }

  fromXmlObject(xmlObject: any): this {
    super.fromXmlObject(xmlObject);

    // Validate and populate required numerator attribute
    if (!xmlObject["@_numerator"]) {
      throw new Error("Required attribute 'numerator' missing in XML");
    }
    this.numerator = parseInt(xmlObject["@_numerator"], 10);
    if (isNaN(this.numerator)) {
      throw new Error("Invalid numerator value in XML");
    }

    // Validate and populate required denominator attribute
    if (!xmlObject["@_denominator"]) {
      throw new Error("Required attribute 'denominator' missing in XML");
    }
    this.denominator = parseInt(xmlObject["@_denominator"], 10);
    if (isNaN(this.denominator)) {
      throw new Error("Invalid denominator value in XML");
    }

    return this;
  }
}
