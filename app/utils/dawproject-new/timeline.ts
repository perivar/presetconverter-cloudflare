// dawproject/timeline.ts
import type {
  Timeline as TimelineType,
  TimeUnit,
  XsString,
} from "./project-schema";
import { Referenceable } from "./referenceable";

/**
 * Represents a base class for timelines that contain timed events.
 * Corresponds to the 'timeline' abstract complex type in Project.xsd.
 * Inherits attributes and child elements from Referenceable.
 */
export abstract class Timeline extends Referenceable implements TimelineType {
  /**
   * The time unit used for the timeline (e.g., beats, seconds).
   * (Optional attribute - timeUnit enum)
   */
  public "@_timeUnit"?: TimeUnit;

  /**
   * A reference to the track this timeline belongs to.
   * (Optional attribute - xs:IDREF)
   */
  public "@_track"?: XsString;

  /**
   * @param timeUnit - The time unit used for the timeline. (Optional attribute - timeUnit enum)
   * @param track - A reference to the track this timeline belongs to. (Optional attribute - xs:IDREF)
   * @param name - The name of the timeline. (Optional attribute inherited from Nameable)
   * @param color - The color of the timeline. (Optional attribute inherited from Nameable)
   * @param comment - A comment for the timeline. (Optional attribute inherited from Nameable)
   */
  constructor(
    timeUnit?: TimeUnit,
    track?: XsString,
    name?: XsString,
    color?: XsString,
    comment?: XsString
  ) {
    super(name, color, comment);
    this["@_timeUnit"] = timeUnit;
    this["@_track"] = track;
  }
}
