import { registerPoint } from "../registry/pointRegistry";
import type { IEnumPoint } from "../types";
import { Point } from "./point";

const enumPointFactory = (xmlObject: any): EnumPoint => {
  const instance = new EnumPoint();
  instance.fromXmlObject(xmlObject);
  return instance;
};

@registerPoint("EnumPoint", enumPointFactory)
export class EnumPoint extends Point implements IEnumPoint {
  value: number;

  constructor(time?: number, value?: number) {
    super(time);
    // Make value optional for deserialization, fromXmlObject will set it
    this.value = value || 0; // Provide a default placeholder
  }

  toXmlObject(): any {
    const attributes = super.toXmlObject();

    // Add required value attribute
    if (this.value !== undefined) {
      attributes["@_value"] = this.value;
    } else {
      throw new Error("Required attribute 'value' missing for EnumPoint");
    }

    return { EnumPoint: attributes };
  }

  fromXmlObject(xmlObject: any): this {
    super.fromXmlObject(xmlObject);

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
