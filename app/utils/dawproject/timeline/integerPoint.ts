import type { IIntegerPoint } from "../types";
import { Point } from "./point";

export class IntegerPoint extends Point implements IIntegerPoint {
  value: number;

  constructor(time?: number, value?: number) {
    super(time); // time is now optional in Point
    // Make value optional for deserialization, fromXmlObject will set it
    this.value = value || 0; // Provide a default placeholder
  }

  toXmlObject(): any {
    const attributes = super.toXmlObject(); // Get attributes from Point
    attributes.value = this.value;
    return { IntegerPoint: attributes };
  }

  fromXmlObject(xmlObject: any): this {
    super.fromXmlObject(xmlObject); // Populate inherited attributes from Point

    this.value =
      xmlObject.value !== undefined ? parseInt(xmlObject.value, 10) : 0;

    return this;
  }
}
