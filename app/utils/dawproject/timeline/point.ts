import { DoubleAdapter } from "../doubleAdapter";
import type { IPoint } from "../types";
import { XmlObject } from "../XmlObject";

export abstract class Point extends XmlObject implements IPoint {
  time: number;

  constructor(time: number) {
    super();
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
}
