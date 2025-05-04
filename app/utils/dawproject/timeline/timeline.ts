import { Referenceable } from "../referenceable";
import type { ITimeline, ITrack } from "../types";
import { TimeUnit } from "./timeUnit";

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

  toXmlObject(): any {
    const attributes = super.toXmlObject(); // Get attributes from Referenceable
    if (this.track !== undefined) {
      attributes["@_track"] = this.track.id; // Use the track's ID as reference
    }
    if (this.timeUnit !== undefined) {
      attributes["@_timeUnit"] = this.timeUnit;
    }
    // Since Timeline is abstract, it doesn't return a root element itself.
    // Subclasses will wrap these attributes in their specific root tag.
    return attributes;
  }

  fromXmlObject(xmlObject: any): this {
    super.fromXmlObject(xmlObject); // Populate inherited attributes from Referenceable

    // For track references, we only store the ID - actual resolution should happen at a higher level
    const trackId = xmlObject["@_track"];
    this.track = trackId ? ({ id: trackId } as ITrack) : undefined;
    this.timeUnit = xmlObject["@_timeUnit"]
      ? (xmlObject["@_timeUnit"] as TimeUnit)
      : undefined; // Cast string to TimeUnit

    return this;
  }
}
