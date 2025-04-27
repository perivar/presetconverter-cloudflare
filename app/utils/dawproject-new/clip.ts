// dawproject/clip.ts
import { Audio } from "./audio";
import { ClipSlot } from "./clip-slot";
import { Clips } from "./clips";
import { Lanes } from "./lanes";
import type { Markers } from "./markers";
import { Nameable } from "./nameable";
import { Notes } from "./notes";
import type { Points } from "./points";
import type {
  Clip as ClipType,
  TimeUnit,
  XsDouble,
  XsString,
} from "./project-schema";
import { Timeline } from "./timeline";
import { Video } from "./video";
import { Warps } from "./warps";

// Define union type for possible child elements as per XSD choice
export type ClipContent =
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
 * Represents a clip on a timeline lane.
 * Corresponds to the 'clip' complex type in Project.xsd.
 * Inherits attributes and child elements from Nameable.
 */
export class Clip extends Nameable implements ClipType {
  // XML attributes are prefixed with '@_'

  /**
   * The start time of the clip relative to its parent timeline.
   * (Required attribute - xs:double)
   */
  public "@_time": XsDouble;

  /**
   * The duration of the clip.
   * (Optional attribute - xs:double)
   */
  public "@_duration"?: XsDouble;

  /**
   * The time unit used for the clip's content (e.g., beats, seconds).
   * (Optional attribute - timeUnit enum)
   */
  public "@_contentTimeUnit"?: TimeUnit;

  /**
   * The start time for playback within the clip's content.
   * (Optional attribute - xs:double)
   */
  public "@_playStart"?: XsDouble;

  /**
   * The stop time for playback within the clip's content.
   * (Optional attribute - xs:double)
   */
  public "@_playStop"?: XsDouble;

  /**
   * The start time for looping within the clip's content.
   * (Optional attribute - xs:double)
   */
  public "@_loopStart"?: XsDouble;

  /**
   * The end time for looping within the clip's content.
   * (Optional attribute - xs:double)
   */
  public "@_loopEnd"?: XsDouble;

  /**
   * The time unit used for fade times.
   * (Optional attribute - timeUnit enum)
   */
  public "@_fadeTimeUnit"?: TimeUnit;

  /**
   * The duration of the fade-in.
   * (Optional attribute - xs:double)
   */
  public "@_fadeInTime"?: XsDouble;

  /**
   * The duration of the fade-out.
   * (Optional attribute - xs:double)
   */
  public "@_fadeOutTime"?: XsDouble;

  /**
   * A reference to another element (e.g., a shared clip definition).
   * (Optional attribute - xs:IDREF)
   */
  public "@_reference"?: XsString;

  // Property corresponding to child element choice

  /**
   * The content of the clip (e.g., notes, audio, automation).
   * (Optional child element - choice)
   */
  public Timeline?: Timeline;
  public Lanes?: Lanes;
  public Notes?: Notes;
  public Clips?: Clips;
  public ClipSlot?: ClipSlot;
  public Markers?: Markers;
  public Warps?: Warps;
  public Audio?: Audio;
  public Video?: Video;
  public Points?: Points;

  /**
   * @param time - The start time of the clip relative to its parent timeline. (Required attribute - xs:double)
   * @param duration - The duration of the clip. (Optional attribute - xs:double)
   * @param name - The name of the clip. (Optional attribute inherited from Nameable)
   * @param color - The color of the clip. (Optional attribute inherited from Nameable)
   * @param comment - A comment for the clip. (Optional attribute inherited from Nameable)
   * @param contentTimeUnit - The time unit used for the clip's content. (Optional attribute - timeUnit enum)
   * @param playStart - The start time for playback within the clip's content. (Optional attribute - xs:double)
   * @param playStop - The stop time for playback within the clip's content. (Optional attribute - xs:double)
   * @param loopStart - The start time for looping within the clip's content. (Optional attribute - xs:double)
   * @param loopEnd - The end time for looping within the clip's content. (Optional attribute - xs:double)
   * @param fadeTimeUnit - The time unit used for fade times. (Optional attribute - timeUnit enum)
   * @param fadeInTime - The duration of the fade-in. (Optional attribute - xs:double)
   * @param fadeOutTime - The duration of the fade-out. (Optional attribute - xs:double)
   * @param reference - A reference to another element. (Optional attribute - xs:IDREF)
   */
  constructor(
    time: XsDouble,
    duration?: XsDouble,
    name?: XsString,
    color?: XsString,
    comment?: XsString,
    contentTimeUnit?: TimeUnit,
    playStart?: XsDouble,
    playStop?: XsDouble,
    loopStart?: XsDouble,
    loopEnd?: XsDouble,
    fadeTimeUnit?: TimeUnit,
    fadeInTime?: XsDouble,
    fadeOutTime?: XsDouble,
    reference?: XsString
  ) {
    super(name, color, comment);
    this["@_time"] = time;
    this["@_duration"] = duration;
    this["@_contentTimeUnit"] = contentTimeUnit;
    this["@_playStart"] = playStart;
    this["@_playStop"] = playStop;
    this["@_loopStart"] = loopStart;
    this["@_loopEnd"] = loopEnd;
    this["@_fadeTimeUnit"] = fadeTimeUnit;
    this["@_fadeInTime"] = fadeInTime;
    this["@_fadeOutTime"] = fadeOutTime;
    this["@_reference"] = reference;
  }

  /**
   * Sets the clip's content, ensuring only one content type is active.
   * This matches the XSD choice restriction where only one child element can be present.
   */
  public setContent(content: ClipContent): void {
    // Clear existing content
    this.Timeline = undefined;
    this.Lanes = undefined;
    this.Notes = undefined;
    this.Clips = undefined;
    this.ClipSlot = undefined;
    this.Markers = undefined;
    this.Warps = undefined;
    this.Audio = undefined;
    this.Video = undefined;
    this.Points = undefined;

    // Helper function to safely cast content
    const isInstance = <T>(obj: any, className: string): obj is T => {
      return obj && obj.constructor && obj.constructor.name === className;
    };

    // Set the new content
    if (isInstance<Timeline>(content, "Timeline")) {
      this.Timeline = content;
    } else if (isInstance<Lanes>(content, "Lanes")) {
      this.Lanes = content;
    } else if (isInstance<Notes>(content, "Notes")) {
      this.Notes = content;
    } else if (isInstance<Clips>(content, "Clips")) {
      this.Clips = content;
    } else if (isInstance<ClipSlot>(content, "ClipSlot")) {
      this.ClipSlot = content;
    } else if (isInstance<Markers>(content, "Markers")) {
      this.Markers = content;
    } else if (isInstance<Warps>(content, "Warps")) {
      this.Warps = content;
    } else if (isInstance<Audio>(content, "Audio")) {
      this.Audio = content;
    } else if (isInstance<Video>(content, "Video")) {
      this.Video = content;
    } else if (isInstance<Points>(content, "Points")) {
      this.Points = content;
    } else {
      throw new Error("Invalid content type for Clip");
    }
  }
}
