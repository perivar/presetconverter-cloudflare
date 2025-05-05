import { DoubleAdapter } from "../doubleAdapter";
import type { IWarp } from "../types";
import { XmlObject } from "../XmlObject";

export class Warp extends XmlObject implements IWarp {
  time: number;
  contentTime: number;

  constructor(time?: number, contentTime?: number) {
    super();
    // Make required fields optional for deserialization, fromXmlObject will set them
    this.time = time || 0; // Provide a default placeholder
    this.contentTime = contentTime || 0; // Provide a default placeholder
  }

  toXmlObject(): any {
    const obj: any = {
      Warp: {
        "@_time": DoubleAdapter.toXml(this.time) || "",
        "@_contentTime": DoubleAdapter.toXml(this.contentTime) || "",
      },
    };
    return obj;
  }

  fromXmlObject(xmlObject: any): this {
    this.time =
      xmlObject["@_time"] !== undefined
        ? DoubleAdapter.fromXml(xmlObject["@_time"]) || 0
        : 0;
    this.contentTime =
      xmlObject["@_contentTime"] !== undefined
        ? DoubleAdapter.fromXml(xmlObject["@_contentTime"]) || 0
        : 0;

    return this;
  }
}
