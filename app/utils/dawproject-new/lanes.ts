// dawproject/lanes.ts
import type { Audio } from "./audio";
// Import all possible child element types
import type { ClipSlot } from "./clip-slot";
import type { Clips } from "./clips";
import type { Markers } from "./markers";
import type { Notes } from "./notes";
import type { Points } from "./points";
import type { Lanes as LanesType, TimeUnit, XsString } from "./project-schema";
import { Timeline } from "./timeline";
import type { Video } from "./video";
import type { Warps } from "./warps";

// Union type for different kinds of child elements within Lanes
export type LanesChildElement =
  | Timeline
  | Lanes
  | Notes
  | Clips
  | ClipSlot
  | Markers
  | Warps
  | Audio
  | Video
  | Points;

/**
 * Represents a container for multiple lanes, often associated with a track.
 * Corresponds to the 'lanes' complex type in Project.xsd.
 * Inherits attributes and child elements from Timeline.
 */
export class Lanes extends Timeline implements LanesType {
  // Properties corresponding to child elements (part of a choice, can be multiple types)

  /**
   * A collection of nested timelines.
   * (Optional child element - unbounded choice)
   */
  public Timeline: Timeline[] = []; // Initialized as empty array for unbounded element

  /**
   * A collection of nested lanes containers.
   * (Optional child element - unbounded choice)
   */
  public Lanes: Lanes[] = []; // Initialized as empty array for unbounded element

  /**
   * A collection of notes lanes.
   * (Optional child element - unbounded choice)
   */
  public Notes: Notes[] = []; // Initialized as empty array for unbounded element

  /**
   * A collection of clips lanes.
   * (Optional child element - unbounded choice)
   */
  public Clips: Clips[] = []; // Initialized as empty array for unbounded element

  /**
   * A collection of clip slots.
   * (Optional child element - unbounded choice)
   */
  public ClipSlot: ClipSlot[] = []; // Initialized as empty array for unbounded element

  /**
   * A collection of markers.
   * (Optional child element - unbounded choice)
   */
  public markers: Markers[] = []; // Initialized as empty array for unbounded element (Note: schema uses lowercase 'markers')

  /**
   * A collection of warps.
   * (Optional child element - unbounded choice)
   */
  public Warps: Warps[] = []; // Initialized as empty array for unbounded element

  /**
   * A collection of audio clips.
   * (Optional child element - unbounded choice)
   */
  public Audio: Audio[] = []; // Initialized as empty array for unbounded element

  /**
   * A collection of video clips.
   * (Optional child element - unbounded choice)
   */
  public Video: Video[] = []; // Initialized as empty array for unbounded element

  /**
   * A collection of automation points.
   * (Optional child element - unbounded choice)
   */
  public Points: Points[] = []; // Initialized as empty array for unbounded element

  /**
   * @param timeUnit - The time unit used for the timeline. (Optional attribute inherited from Timeline)
   * @param track - A reference to the track this timeline belongs to. (Optional attribute inherited from Timeline - xs:IDREF)
   * @param name - The name of the lanes container. (Optional attribute inherited from Nameable)
   * @param color - The color of the lanes container. (Optional attribute inherited from Nameable)
   * @param comment - A comment for the lanes container. (Optional attribute inherited from Nameable)
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
