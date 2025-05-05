import { registerPoint } from "../registry/pointRegistry";
import type { IBoolPoint } from "../types";
import { Point } from "./point";

const boolPointFactory = (xmlObject: any): BoolPoint => {
  const instance = new BoolPoint();
  instance.fromXmlObject(xmlObject);
  return instance;
};

@registerPoint("BoolPoint", boolPointFactory)
export class BoolPoint extends Point implements IBoolPoint {
  value: boolean;

  constructor(time?: number, value?: boolean) {
    super(time); // time is now optional in Point
    // Make value optional for deserialization, fromXmlObject will set it
    this.value = value || false; // Provide a default placeholder
  }

  toXmlObject(): any {
    const attributes = super.toXmlObject(); // Get attributes from Point

    // Add required value attribute
    if (this.value !== undefined) {
      attributes["@_value"] = this.value;
    } else {
      throw new Error("Required attribute 'value' missing for BoolPoint");
    }

    return { BoolPoint: attributes };
  }

  fromXmlObject(xmlObject: any): this {
    super.fromXmlObject(xmlObject);

    // Validate and populate required value attribute
    if (xmlObject["@_value"] === undefined) {
      throw new Error("Required attribute 'value' missing in XML");
    }
    this.value = String(xmlObject["@_value"]).toLowerCase() === "true";

    return this;
  }
}
