import type { IClipSlot, ITrack } from "../types";
import { Clip } from "./clip";
import { Timeline } from "./timeline";
import { TimeUnit } from "./timeUnit";

export class ClipSlot extends Timeline implements IClipSlot {
  clip?: Clip;
  hasStop?: boolean;

  constructor(
    clip?: Clip,
    hasStop?: boolean,
    track?: ITrack,
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
        ...super.toXmlObject(), // populate inherited attributes from Timeline
      },
    };

    if (this.clip) {
      obj.ClipSlot.Clip = this.clip.toXmlObject().Clip;
    }

    if (this.hasStop !== undefined) {
      obj.ClipSlot.hasStop = this.hasStop;
    }

    return obj;
  }

  fromXmlObject(xmlObject: any): this {
    super.fromXmlObject(xmlObject); // Populate inherited attributes

    if (xmlObject.Clip) {
      this.clip = new Clip().fromXmlObject(xmlObject.Clip);
    }

    this.hasStop =
      xmlObject.hasStop !== undefined
        ? String(xmlObject.hasStop).toLowerCase() === "true"
        : undefined;

    return this;
  }
}
