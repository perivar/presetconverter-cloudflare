import { DoubleAdapter } from "../doubleAdapter";
import { Interpolation } from "../interpolation";
import { registerPoint } from "../registry/pointRegistry";
import type { IRealPoint } from "../types";
import { Point } from "./point";

const realPointFactory = (xmlObject: any): RealPoint => {
  const instance = new RealPoint();
  instance.fromXmlObject(xmlObject);
  return instance;
};

@registerPoint("RealPoint", realPointFactory)
export class RealPoint extends Point implements IRealPoint {
  value: number;
  interpolation?: Interpolation;

  constructor(time?: number, value?: number, interpolation?: Interpolation) {
    super(time); // time is now optional in Point
    // Make value optional for deserialization, fromXmlObject will set it
    this.value = value || 0; // Provide a default placeholder
    this.interpolation = interpolation;
  }

  toXmlObject(): any {
    const attributes = super.toXmlObject(); // Get attributes from Point

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

  fromXmlObject(xmlObject: any): this {
    super.fromXmlObject(xmlObject); // Populate inherited attributes from Point

    // Validate and populate required value attribute
    if (!xmlObject["@_value"]) {
      throw new Error("Required attribute 'value' missing in XML");
    }
    const pointValue = DoubleAdapter.fromXml(xmlObject["@_value"]);
    if (pointValue === undefined) {
      throw new Error("Invalid value in XML");
    }
    this.value = pointValue;

    // Populate optional interpolation attribute
    if (xmlObject["@_interpolation"] !== undefined) {
      this.interpolation = xmlObject["@_interpolation"] as Interpolation;
    }

    return this;
  }
}
