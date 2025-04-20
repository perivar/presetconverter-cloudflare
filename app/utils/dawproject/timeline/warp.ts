import { XMLBuilder, XMLParser } from "fast-xml-parser";

import { DoubleAdapter } from "../doubleAdapter";
import type { IWarp } from "../types";
import { XmlObject } from "../XmlObject";

export class Warp extends XmlObject implements IWarp {
  time: number;
  contentTime: number;

  constructor(time: number, contentTime: number) {
    super();
    this.time = time;
    this.contentTime = contentTime;
  }

  toXmlObject(): any {
    const obj: any = {
      Warp: {
        time: DoubleAdapter.toXml(this.time) || "",
        contentTime: DoubleAdapter.toXml(this.contentTime) || "",
      },
    };
    return obj;
  }

  toXml(): string {
    const builder = new XMLBuilder({ attributeNamePrefix: "" });
    return builder.build(this.toXmlObject());
  }

  static fromXmlObject(xmlObject: any): Warp {
    const time =
      xmlObject.time !== undefined
        ? DoubleAdapter.fromXml(xmlObject.time) || 0
        : 0;
    const contentTime =
      xmlObject.contentTime !== undefined
        ? DoubleAdapter.fromXml(xmlObject.contentTime) || 0
        : 0;
    return new Warp(time, contentTime);
  }

  static fromXml(xmlString: string): Warp {
    const parser = new XMLParser({ attributeNamePrefix: "" });
    const jsonObj = parser.parse(xmlString);
    return Warp.fromXmlObject(jsonObj.Warp);
  }
}
