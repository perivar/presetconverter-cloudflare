// dawproject/clip-slot.ts
import type { Clip } from "./clip";
import type {
  ClipSlot as ClipSlotType,
  TimeUnit,
  XsBoolean,
  XsString,
} from "./project-schema";
import { Timeline } from "./timeline";

/**
 * Represents a slot in a scene that can trigger a clip.
 * Corresponds to the 'clipSlot' complex type in Project.xsd.
 * Inherits attributes and child elements from Timeline.
 */
export class ClipSlot extends Timeline implements ClipSlotType {
  // Property corresponding to child element

  /**
   * The clip associated with this slot.
   * (Optional child element)
   */
  public Clip?: Clip;

  // XML attribute is prefixed with '@_'

  /**
   * Indicates if the clip slot has a stop button/trigger.
   * (Optional attribute)
   */
  public "@_hasStop"?: XsBoolean;

  /**
   * @param hasStop - Indicates if the clip slot has a stop button/trigger. (Optional attribute)
   * @param timeUnit - The time unit used for the timeline. (Optional attribute inherited from Timeline)
   * @param track - A reference to the track this timeline belongs to. (Optional attribute inherited from Timeline)
   * @param name - The name of the clip slot. (Optional attribute inherited from Nameable)
   * @param color - The color of the clip slot. (Optional attribute inherited from Nameable)
   * @param comment - A comment for the clip slot. (Optional attribute inherited from Nameable)
   */
  constructor(
    hasStop?: XsBoolean,
    timeUnit?: TimeUnit,
    track?: XsString,
    name?: XsString,
    color?: XsString,
    comment?: XsString
  ) {
    super(timeUnit, track, name, color, comment);
    this["@_hasStop"] = hasStop;
  }
}
