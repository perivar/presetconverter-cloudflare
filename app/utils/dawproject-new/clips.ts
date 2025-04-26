// dawproject/clips.ts
import type { Clip } from "./clip";
import type { Clips as ClipsType, TimeUnit, XsString } from "./project-schema";
import { Timeline } from "./timeline";

/**
 * Represents a lane containing multiple clips.
 * Corresponds to the 'clips' complex type in Project.xsd.
 * Inherits attributes and child elements from Timeline.
 */
export class Clips extends Timeline implements ClipsType {
  // Property corresponding to child elements

  /**
   * A collection of clips within this lane.
   * (Optional child element - unbounded)
   */
  public Clip: Clip[] = []; // Initialized as empty array for unbounded element

  /**
   * @param timeUnit - The time unit used for the timeline. (Optional attribute inherited from Timeline)
   * @param track - A reference to the track this timeline belongs to. (Optional attribute inherited from Timeline)
   * @param name - The name of the clips lane. (Optional attribute inherited from Nameable)
   * @param color - The color of the clips lane. (Optional attribute inherited from Nameable)
   * @param comment - A comment for the clips lane. (Optional attribute inherited from Nameable)
   */
  constructor(
    timeUnit?: TimeUnit,
    track?: XsString,
    name?: XsString,
    color?: XsString,
    comment?: XsString
  ) {
    super(timeUnit, track, name, color, comment);
  }
}
