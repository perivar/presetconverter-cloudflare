import { XMLBuilder, XMLParser } from "fast-xml-parser";

import type { IClips, ITrack } from "../types";
import { Clip } from "./clip";
import { Timeline } from "./timeline";
import { TimeUnit } from "./timeUnit";

export class Clips extends Timeline implements IClips {
  clips: Clip[];

  constructor(
    clips?: Clip[],
    track?: ITrack,
    timeUnit?: TimeUnit,
    name?: string,
    color?: string,
    comment?: string
  ) {
    super(track, timeUnit, name, color, comment);
    this.clips = clips || [];
  }

  toXmlObject(): any {
    const obj: any = {
      Clips: {
        ...super.getXmlAttributes(), // Get attributes from Timeline
      },
    };

    // Append child elements for each clip
    if (this.clips && this.clips.length > 0) {
      obj.Clips.Clip = this.clips.map(clip => clip.toXmlObject().Clip); // Assuming Clip has toXmlObject and returns { Clip: ... }
    }

    return obj;
  }

  toXml(): string {
    const builder = new XMLBuilder({ attributeNamePrefix: "" });
    return builder.build(this.toXmlObject());
  }

  static fromXmlObject(xmlObject: any): Clips {
    const instance = new Clips(); // Create instance of Clips
    instance.populateFromXml(xmlObject); // Populate inherited attributes from Timeline

    // Process child elements of type Clip
    const clips: Clip[] = [];
    if (xmlObject.Clip) {
      const clipArray = Array.isArray(xmlObject.Clip)
        ? xmlObject.Clip
        : [xmlObject.Clip];
      clipArray.forEach((clipObj: any) => {
        clips.push(Clip.fromXmlObject(clipObj)); // Assuming Clip has a static fromXmlObject
      });
    }
    instance.clips = clips;

    return instance;
  }

  static fromXml(xmlString: string): Clips {
    const parser = new XMLParser({ attributeNamePrefix: "" });
    const jsonObj = parser.parse(xmlString);
    return Clips.fromXmlObject(jsonObj.Clips);
  }
}
