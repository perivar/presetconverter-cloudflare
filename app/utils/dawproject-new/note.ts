// dawproject/note.ts
import type { Audio } from "./audio";
import type { ClipSlot } from "./clip-slot";
import type { Clips } from "./clips";
import type { Lanes } from "./lanes";
import type { Markers } from "./markers";
import type { Notes } from "./notes";
import type { Points } from "./points";
import type { Note as NoteType, XsInt, XsString } from "./project-schema";
import type { Timeline } from "./timeline";
import type { Video } from "./video";
import type { Warps } from "./warps";

// Union type for different kinds of child elements within Note
export type NoteChildElement =
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
 * Represents a single musical note.
 * Corresponds to the 'note' complex type in Project.xsd.
 */
export class Note implements NoteType {
  // Add XmlElement properties (inherited from the type definition)
  public "@_xmlns"?: string;
  [ns: `@_xmlns:${string}`]: string | undefined;

  // XML attributes are prefixed with '@_'

  /**
   * Time position within the parent clip (in beats or seconds).
   * (Required attribute - xs:string)
   */
  public "@_time": XsString;

  /**
   * Duration of the note (in beats or seconds).
   * (Required attribute - xs:string)
   */
  public "@_duration": XsString;

  /**
   * MIDI key number (0-127).
   * (Required attribute - xs:int)
   */
  public "@_key": XsInt;

  /**
   * MIDI channel (0-15 or 1-16).
   * (Required attribute - xs:int)
   */
  public "@_channel": XsInt;

  /**
   * Note-on velocity (0.0 - 1.0 as string).
   * (Optional attribute - xs:string)
   */
  public "@_vel"?: XsString;

  /**
   * Note-off velocity (0.0 - 1.0 as string).
   * (Optional attribute - xs:string)
   */
  public "@_rel"?: XsString;

  // Properties corresponding to child elements (only one can be present)

  /**
   * A nested timeline within the note.
   * (Optional child element - choice)
   */
  public Timeline?: Timeline;

  /**
   * A nested lanes container within the note.
   * (Optional child element - choice)
   */
  public Lanes?: Lanes;

  /**
   * A nested notes container within the note.
   * (Optional child element - choice)
   */
  public Notes?: Notes;

  /**
   * A nested clips container within the note.
   * (Optional child element - choice)
   */
  public Clips?: Clips;

  /**
   * A nested clip slot within the note.
   * (Optional child element - choice)
   */
  public ClipSlot?: ClipSlot;

  /**
   * A nested markers collection within the note.
   * (Optional child element - choice)
   */
  public Markers?: Markers; // Note: schema uses 'markers' lowercase

  /**
   * A nested warps collection within the note.
   * (Optional child element - choice)
   */
  public Warps?: Warps;

  /**
   * Nested audio content within the note.
   * (Optional child element - choice)
   */
  public Audio?: Audio;

  /**
   * Nested video content within the note.
   * (Optional child element - choice)
   */
  public Video?: Video;

  /**
   * Nested automation points within the note.
   * (Optional child element - choice)
   */
  public Points?: Points;

  /**
   * @param time - Time position within the parent clip (in beats or seconds). (Required attribute - xs:string)
   * @param duration - Duration of the note (in beats or seconds). (Required attribute - xs:string)
   * @param key - MIDI key number (0-127). (Required attribute - xs:int)
   * @param channel - MIDI channel (0-15 or 1-16). (Required attribute - xs:int)
   * @param vel - Note-on velocity (0.0 - 1.0 as string). (Optional attribute - xs:string)
   * @param rel - Note-off velocity (0.0 - 1.0 as string). (Optional attribute - xs:string)
   */
  constructor(
    time: XsString,
    duration: XsString,
    key: XsInt,
    channel: XsInt,
    vel?: XsString,
    rel?: XsString
  ) {
    this["@_time"] = time;
    this["@_duration"] = duration;
    this["@_key"] = key;
    this["@_channel"] = channel;
    this["@_vel"] = vel;
    this["@_rel"] = rel;
  }
}
