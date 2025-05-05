import { registerPoint } from "../registry/pointRegistry";
import type { IIntegerPoint } from "../types";
import { Point } from "./point";

const integerPointFactory = (xmlObject: any): IntegerPoint => {
  const instance = new IntegerPoint();
  instance.fromXmlObject(xmlObject);
  return instance;
};

@registerPoint("IntegerPoint", integerPointFactory)
export class IntegerPoint extends Point implements IIntegerPoint {
  value: number;

  constructor(time?: number, value?: number) {
    super(time); // time is now optional in Point
    // Make value optional for deserialization, fromXmlObject will set it
    this.value = value || 0; // Provide a default placeholder
  }

  toXmlObject(): any {
    const attributes = super.toXmlObject();

    // Add required value attribute
    if (this.value !== undefined) {
      attributes["@_value"] = this.value;
    } else {
      throw new Error("Required attribute 'value' missing for IntegerPoint");
    }

    return { IntegerPoint: attributes };
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
