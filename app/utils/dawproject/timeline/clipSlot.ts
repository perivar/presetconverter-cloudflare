import { XMLBuilder, XMLParser } from "fast-xml-parser";

import type { IClipSlot } from "../types";
import { Clip } from "./clip";
import { Timeline } from "./timeline";
import { TimeUnit } from "./timeUnit";

export class ClipSlot extends Timeline implements IClipSlot {
  clip?: Clip;
  hasStop?: boolean;

  constructor(
    clip?: Clip,
    hasStop?: boolean,
    track?: string,
    timeUnit?: TimeUnit,
    name?: string,
    color?: string,
    comment?: string
  ) {
    super(track, timeUnit, name, color, comment);
    this.clip = clip;
    this.hasStop = hasStop;
  }

  toXmlObject(): any {
    const obj: any = {
      ClipSlot: {
        ...super.getXmlAttributes(), // Populate inherited attributes
      },
    };

    if (this.clip) {
      obj.ClipSlot.Clip = this.clip.toXmlObject().Clip; // Assuming Clip has toXmlObject and returns { Clip: ... }
    }

    if (this.hasStop !== undefined) {
      obj.ClipSlot.hasStop = this.hasStop;
    }

    return obj;
  }

  toXml(): string {
    const builder = new XMLBuilder({ attributeNamePrefix: "" });
    return builder.build(this.toXmlObject());
  }

  static fromXmlObject(xmlObject: any): ClipSlot {
    const instance = new ClipSlot(); // Create instance of ClipSlot
    instance.populateFromXml(xmlObject); // Populate inherited attributes

    if (xmlObject.Clip) {
      instance.clip = Clip.fromXmlObject(xmlObject.Clip); // Assuming Clip has a static fromXmlObject
    }

    instance.hasStop =
      xmlObject.hasStop !== undefined
        ? String(xmlObject.hasStop).toLowerCase() === "true"
        : undefined;

    return instance;
  }

  static fromXml(xmlString: string): ClipSlot {
    const parser = new XMLParser({ attributeNamePrefix: "" });
    const jsonObj = parser.parse(xmlString);
    return ClipSlot.fromXmlObject(jsonObj.ClipSlot);
  }
}
