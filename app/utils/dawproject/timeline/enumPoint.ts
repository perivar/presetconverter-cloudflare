import type { IEnumPoint } from "../types";
import { Point } from "./point";

export class EnumPoint extends Point implements IEnumPoint {
  value: number;

  constructor(time?: number, value?: number) {
    super(time); // time is now optional in Point
    // Make value optional for deserialization, fromXmlObject will set it
    this.value = value || 0; // Provide a default placeholder
  }

  toXmlObject(): any {
    const attributes = super.toXmlObject(); // Get attributes from Point

    // Add required value attribute
    if (this.value !== undefined) {
      attributes["@_value"] = this.value;
    } else {
      throw new Error("Required attribute 'value' missing for EnumPoint");
    }

    return { EnumPoint: attributes };
  }

  fromXmlObject(xmlObject: any): this {
    super.fromXmlObject(xmlObject); // Populate inherited attributes from Point

    // Validate and populate required value attribute
    if (xmlObject["@_value"] === undefined) {
      throw new Error("Required attribute 'value' missing in XML");
    }

    this.value = parseInt(xmlObject["@_value"], 10);
    if (isNaN(this.value)) {
      throw new Error("Invalid enum value in XML");
    }

    return this;
  }
}
