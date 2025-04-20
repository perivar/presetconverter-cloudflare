import { XMLBuilder, XMLParser } from "fast-xml-parser";

import { Arrangement } from "../arrangement";
import { Channel } from "../channel";
import { DoubleAdapter } from "../doubleAdapter";
import { INameable, Nameable } from "../nameable";
import { IReferenceable, Referenceable } from "../referenceable";
import { Scene } from "../scene";
import { Track } from "../track";
import { Audio } from "./audio";
import { Clips } from "./clips";
import { ClipSlot } from "./clipSlot";
import { Markers } from "./markers";
import { Notes } from "./notes";
import { Points } from "./points";
import { ITimeline, Timeline } from "./timeline";
import { TimeUnit } from "./timeUnit";
import { Video } from "./video";
import { Warps } from "./warps";

export interface IClip extends INameable {
  time: number;
  duration?: number;
  contentTimeUnit?: TimeUnit;
  playStart?: number;
  playStop?: number;
  loopStart?: number;
  loopEnd?: number;
  fadeTimeUnit?: TimeUnit;
  fadeInTime?: number;
  fadeOutTime?: number;
  content?: ITimeline;
  reference?: IReferenceable; // Assuming reference is an IDREF string or Referenceable instance
}

export class Clip extends Nameable implements IClip {
  time: number;
  duration?: number;
  contentTimeUnit?: TimeUnit;
  playStart?: number;
  playStop?: number;
  loopStart?: number;
  loopEnd?: number;
  fadeTimeUnit?: TimeUnit;
  fadeInTime?: number;
  fadeOutTime?: number;
  content?: Timeline;
  reference?: Referenceable; // Assuming reference is an IDREF string or Referenceable instance

  constructor(
    time: number,
    duration?: number,
    contentTimeUnit?: TimeUnit,
    playStart?: number,
    playStop?: number,
    loopStart?: number,
    loopEnd?: number,
    fadeTimeUnit?: TimeUnit,
    fadeInTime?: number,
    fadeOutTime?: number,
    content?: Timeline,
    reference?: Referenceable,
    name?: string,
    color?: string,
    comment?: string
  ) {
    super(name, color, comment);
    this.time = time;
    this.duration = duration;
    this.contentTimeUnit = contentTimeUnit;
    this.playStart = playStart;
    this.playStop = playStop;
    this.loopStart = loopStart;
    this.loopEnd = loopEnd;
    this.fadeTimeUnit = fadeTimeUnit;
    this.fadeInTime = fadeInTime;
    this.fadeOutTime = fadeOutTime;
    this.content = content;
    this.reference = reference;
  }

  toXmlObject(): any {
    const obj: any = {
      Clip: {
        ...super.getXmlAttributes(), // Get attributes from Nameable
        time: DoubleAdapter.toXml(this.time) || "",
      },
    };

    if (this.duration !== undefined) {
      obj.Clip.duration = DoubleAdapter.toXml(this.duration) || "";
    }
    if (this.contentTimeUnit !== undefined) {
      obj.Clip.contentTimeUnit = this.contentTimeUnit;
    }
    if (this.playStart !== undefined) {
      obj.Clip.playStart = DoubleAdapter.toXml(this.playStart) || "";
    }
    if (this.playStop !== undefined) {
      obj.Clip.playStop = DoubleAdapter.toXml(this.playStop) || "";
    }
    if (this.loopStart !== undefined) {
      obj.Clip.loopStart = DoubleAdapter.toXml(this.loopStart) || "";
    }
    if (this.loopEnd !== undefined) {
      obj.Clip.loopEnd = DoubleAdapter.toXml(this.loopEnd) || "";
    }
    if (this.fadeTimeUnit !== undefined) {
      obj.Clip.fadeTimeUnit = this.fadeTimeUnit;
    }
    if (this.fadeInTime !== undefined) {
      obj.Clip.fadeInTime = DoubleAdapter.toXml(this.fadeInTime) || "";
    }
    if (this.fadeOutTime !== undefined) {
      obj.Clip.fadeOutTime = DoubleAdapter.toXml(this.fadeOutTime) || "";
    }

    // Append content if present
    if (this.content !== undefined) {
      // Assuming content is a Timeline subclass and has a toXmlObject method
      const contentObj = this.content.toXmlObject();
      const tagName = Object.keys(contentObj)[0];
      obj.Clip[tagName] = contentObj[tagName];
    }

    // Reference handling
    if (this.reference !== undefined) {
      // Assuming reference is a Referenceable instance and has an id
      obj.Clip.reference = this.reference.id;
    }

    return obj;
  }

  toXml(): string {
    const builder = new XMLBuilder({ attributeNamePrefix: "" });
    return builder.build(this.toXmlObject());
  }

  static fromXmlObject(xmlObject: any): Clip {
    const instance = new Clip(0); // Create instance with a default time
    instance.populateFromXml(xmlObject); // Populate inherited attributes

    instance.time =
      xmlObject.time !== undefined
        ? DoubleAdapter.fromXml(xmlObject.time) || 0
        : 0;
    instance.duration =
      xmlObject.duration !== undefined
        ? DoubleAdapter.fromXml(xmlObject.duration)
        : undefined;
    instance.contentTimeUnit = xmlObject.contentTimeUnit
      ? (xmlObject.contentTimeUnit as TimeUnit)
      : undefined;
    instance.playStart =
      xmlObject.playStart !== undefined
        ? DoubleAdapter.fromXml(xmlObject.playStart)
        : undefined;
    instance.playStop =
      xmlObject.playStop !== undefined
        ? DoubleAdapter.fromXml(xmlObject.playStop)
        : undefined;
    instance.loopStart =
      xmlObject.loopStart !== undefined
        ? DoubleAdapter.fromXml(xmlObject.loopStart)
        : undefined;
    instance.loopEnd =
      xmlObject.loopEnd !== undefined
        ? DoubleAdapter.fromXml(xmlObject.loopEnd)
        : undefined;
    instance.fadeTimeUnit = xmlObject.fadeTimeUnit
      ? (xmlObject.fadeTimeUnit as TimeUnit)
      : undefined;
    instance.fadeInTime =
      xmlObject.fadeInTime !== undefined
        ? DoubleAdapter.fromXml(xmlObject.fadeInTime)
        : undefined;
    instance.fadeOutTime =
      xmlObject.fadeOutTime !== undefined
        ? DoubleAdapter.fromXml(xmlObject.fadeOutTime)
        : undefined;

    // Handling content and reference
    // Need a mechanism to determine the correct subclass of Timeline
    // based on the XML element tag (e.g., Timeline, Lanes, Notes, Clips, etc.)
    const timelineTypeMap: { [key: string]: (obj: any) => any } = {
      Clips: Clips.fromXmlObject,
      Notes: Notes.fromXmlObject,
      Audio: Audio.fromXmlObject,
      Video: Video.fromXmlObject,
      Markers: Markers.fromXmlObject,
      Arrangement: Arrangement.fromXmlObject,
      Scene: Scene.fromXmlObject,
      Track: Track.fromXmlObject,
      Channel: Channel.fromXmlObject,
      ClipSlot: ClipSlot.fromXmlObject,
      Points: Points.fromXmlObject,
      Warps: Warps.fromXmlObject,
      // Add other Timeline subclasses here
    };

    for (const tagName in xmlObject) {
      if (timelineTypeMap[tagName]) {
        try {
          instance.content = timelineTypeMap[tagName](
            xmlObject[tagName]
          ) as Timeline; // Cast to Timeline
          break; // Assuming only one content element
        } catch (e) {
          console.error(
            `Error deserializing nested timeline content ${tagName} in Clip:`,
            e
          );
        }
      }
    }

    const referenceId = xmlObject.reference;
    if (referenceId) {
      instance.reference = Referenceable.getById(referenceId); // Assuming Referenceable has a static getById
    }

    return instance;
  }

  static fromXml(xmlString: string): Clip {
    const parser = new XMLParser({ attributeNamePrefix: "" });
    const jsonObj = parser.parse(xmlString);
    return Clip.fromXmlObject(jsonObj.Clip);
  }
}
