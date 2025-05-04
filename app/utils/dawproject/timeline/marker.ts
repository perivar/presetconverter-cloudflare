import { DoubleAdapter } from "../doubleAdapter";
import { Nameable } from "../nameable";
import type { IMarker } from "../types";

export class Marker extends Nameable implements IMarker {
  time: number;

  constructor(time?: number, name?: string, color?: string, comment?: string) {
    super(name, color, comment);
    // Make time optional for deserialization, fromXmlObject will set it
    this.time = time || 0; // Provide a default placeholder
  }

  toXmlObject(): any {
    const attributes = super.toXmlObject(); // Get attributes from Nameable
    attributes.time = DoubleAdapter.toXml(this.time) || "";
    return attributes;
  }

  fromXmlObject(xmlObject: any): this {
    super.fromXmlObject(xmlObject); // Populate inherited attributes from Nameable
    this.time =
      xmlObject.time !== undefined
        ? DoubleAdapter.fromXml(xmlObject.time) || 0
        : 0;
    return this;
  }
}
