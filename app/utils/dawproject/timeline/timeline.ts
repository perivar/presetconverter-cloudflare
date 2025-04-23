import { Referenceable } from "../referenceable";
import type { ITimeline, ITrack } from "../types";
import { TimeUnit } from "./timeUnit";

export interface TimelineConstructor {
  new (...args: any[]): Timeline;
  fromXmlObject(xmlObject: any): Timeline;
}

export abstract class Timeline extends Referenceable implements ITimeline {
  track?: ITrack;
  timeUnit?: TimeUnit;

  constructor(
    track?: ITrack,
    timeUnit?: TimeUnit,
    name?: string,
    color?: string,
    comment?: string
  ) {
    super(name, color, comment);
    this.track = track;
    this.timeUnit = timeUnit;
  }

  protected getXmlAttributes(): any {
    const attributes = super.getXmlAttributes(); // Get attributes from Referenceable
    if (this.track !== undefined) {
      attributes["@_track"] = this.track.id; // Use the track's ID as reference
    }
    if (this.timeUnit !== undefined) {
      attributes["@_timeUnit"] = this.timeUnit;
    }
    return attributes;
  }

  protected populateFromXml(xmlObject: any): void {
    super.populateFromXml(xmlObject); // Populate inherited attributes from Referenceable
    // For track references, we only store the ID - actual resolution should happen at a higher level
    const trackId = xmlObject["@_track"];
    this.track = trackId ? ({ id: trackId } as ITrack) : undefined;
    this.timeUnit = xmlObject["@_timeUnit"]
      ? (xmlObject["@_timeUnit"] as TimeUnit)
      : undefined; // Cast string to TimeUnit
  }

  static fromXmlObject(xmlObject: any): Timeline {
    throw new Error("fromXmlObject must be implemented by derived class");
  }
}
