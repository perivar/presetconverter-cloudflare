import { DoubleAdapter } from "../doubleAdapter";
import type { IPoint } from "../types";
import { XmlObject } from "../XmlObject";

export abstract class Point extends XmlObject implements IPoint {
  time: number;

  constructor(time: number) {
    super();
    this.time = time;
  }

  // Abstract method from XmlObject that must be implemented by concrete classes
  abstract toXmlObject(): any;

  // Abstract method from XmlObject that must be implemented by concrete classes
  abstract toXml(): string;

  protected getXmlAttributes(): any {
    // Create object for attributes
    const attributes: any = {};

    // Add required time attribute
    if (this.time !== undefined) {
      attributes["@_time"] = DoubleAdapter.toXml(this.time) || "";
    } else {
      throw new Error("Required attribute 'time' missing for Point");
    }

    return attributes;
  }

  protected populateFromXml(xmlObject: any): void {
    // Validate and populate required time attribute
    if (!xmlObject["@_time"]) {
      throw new Error("Required attribute 'time' missing in XML");
    }

    const timeValue = DoubleAdapter.fromXml(xmlObject["@_time"]);
    if (timeValue === undefined) {
      throw new Error("Invalid time value in XML");
    }

    this.time = timeValue;
  }
}
