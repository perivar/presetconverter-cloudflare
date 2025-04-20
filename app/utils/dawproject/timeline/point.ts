import { DoubleAdapter } from "../doubleAdapter";

export interface IPoint {
  time: number;
}

export abstract class Point implements IPoint {
  time: number;

  constructor(time: number) {
    this.time = time;
  }

  protected getXmlAttributes(): any {
    const attributes: any = {};
    attributes.time = DoubleAdapter.toXml(this.time) || "";
    return attributes;
  }

  protected populateFromXml(xmlObject: any): void {
    this.time =
      xmlObject.time !== undefined
        ? DoubleAdapter.fromXml(xmlObject.time) || 0
        : 0;
  }

  // Concrete subclasses will implement their own toXmlObject and fromXmlObject methods
  abstract toXmlObject(): any;
  static fromXmlObject(xmlObject: any): Point {
    throw new Error("fromXmlObject must be implemented by subclasses");
  }
}
