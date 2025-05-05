import { Referenceable } from "../referenceable";
import { Track } from "../track";
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

    const trackId = xmlObject["@_track"];
    if (trackId) {
      const track = Referenceable.getById(trackId);
      // Check if the retrieved object is a Track before assigning
      if (track instanceof Track) {
        this.track = track;
      } else {
        console.warn(
          `Retrieved object with ID ${trackId} is not a Track and cannot be assigned as a track.`
        );
        this.track = undefined;
      }
    }

    this.timeUnit = xmlObject["@_timeUnit"]
      ? (xmlObject["@_timeUnit"] as TimeUnit)
      : undefined; // Cast string to TimeUnit

    return this;
  }
}
