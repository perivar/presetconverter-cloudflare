import { XMLBuilder, XMLParser } from "fast-xml-parser";

import { DoubleAdapter } from "../doubleAdapter";
import { INameable, Nameable } from "../nameable";

// import { Referenceable } from "./referenceable"; // Marker does not extend Referenceable in Python

export interface IMarker extends INameable {
  time: number;
}

export class Marker extends Nameable implements IMarker {
  // Corrected inheritance
  time: number;

  constructor(time: number, name?: string, color?: string, comment?: string) {
    super(name, color, comment);
    this.time = time;
  }

  toXmlObject(): any {
    const obj = super.getXmlAttributes(); // Get attributes from Nameable
    obj.time = DoubleAdapter.toXml(this.time) || "";
    return obj;
  }

  toXml(): string {
    const builder = new XMLBuilder({ attributeNamePrefix: "" });
    return builder.build({ Marker: this.toXmlObject() });
  }

  static fromXmlObject(xmlObject: any): Marker {
    const instance = new Marker(0); // Create instance with a default time
    instance.populateFromXml(xmlObject); // Populate inherited attributes from Nameable
    instance.time =
      xmlObject.time !== undefined
        ? DoubleAdapter.fromXml(xmlObject.time) || 0
        : 0;
    return instance;
  }

  static fromXml(xmlString: string): Marker {
    const parser = new XMLParser({ attributeNamePrefix: "" });
    const jsonObj = parser.parse(xmlString);
    return Marker.fromXmlObject(jsonObj.Marker);
  }
}
