// dawproject/media-file.ts
import { FileReference } from "./file-reference";
import type {
  MediaFile as MediaFileType,
  TimeUnit,
  XsDouble,
  XsString,
} from "./project-schema";
import { Timeline } from "./timeline";

/**
 * Represents a reference to an external media file.
 * Corresponds to the 'mediaFile' complex type in Project.xsd.
 * Inherits attributes and child elements from Timeline.
 */
export class MediaFile extends Timeline implements MediaFileType {
  // XML attribute is prefixed with '@_'

  /**
   * The duration of the media file.
   * (Required attribute - xs:double)
   */
  public "@_duration": XsDouble; // Using XsDecimal as per project.ts type definition

  // Property corresponding to child element

  /**
   * A reference to the external media file.
   * (Required child element)
   */
  public File: FileReference;

  /**
   * @param file - A reference to the external media file. (Required child element)
   * @param duration - The duration of the media file. (Required attribute - xs:double)
   * @param timeUnit - The time unit used for the timeline. (Optional attribute inherited from Timeline)
   * @param track - A reference to the track this timeline belongs to. (Optional attribute inherited from Timeline - xs:IDREF)
   * @param name - The name of the media file. (Optional attribute inherited from Nameable)
   * @param color - The color of the media file. (Optional attribute inherited from Nameable)
   * @param comment - A comment for the media file. (Optional attribute inherited from Nameable)
   */
  constructor(
    file: FileReference,
    duration: XsDouble,
    timeUnit?: TimeUnit,
    track?: XsString,
    name?: XsString,
    color?: XsString,
    comment?: XsString
  ) {
    super(timeUnit, track, name, color, comment);
    this["@_duration"] = duration;
    this.File = file;
  }
}
