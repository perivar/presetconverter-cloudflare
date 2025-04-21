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
      attributes.track = this.track;
    }
    if (this.timeUnit !== undefined) {
      attributes.timeUnit = this.timeUnit;
    }
    return attributes;
  }

  protected populateFromXml(xmlObject: any): void {
    super.populateFromXml(xmlObject); // Populate inherited attributes from Referenceable
    this.track = xmlObject.track || undefined;
    this.timeUnit = xmlObject.timeUnit
      ? (xmlObject.timeUnit as TimeUnit)
      : undefined; // Cast string to TimeUnit
  }

  static fromXmlObject(xmlObject: any): Timeline {
    throw new Error("fromXmlObject must be implemented by derived class");
  }
}
