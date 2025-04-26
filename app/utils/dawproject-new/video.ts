// dawproject/video.ts
import { FileReference } from "./file-reference";
import { MediaFile } from "./media-file";
import type {
  TimeUnit,
  Video as VideoType,
  XsDecimal,
  XsInt,
  XsString,
} from "./project-schema";

/**
 * Represents video content, referencing a media file.
 * Corresponds to the 'video' complex type in Project.xsd.
 * Inherits attributes and child elements from MediaFile.
 */
export class Video extends MediaFile implements VideoType {
  // XML attributes are prefixed with '@_'

  /**
   * The algorithm used for video processing (Note: This attribute seems unusual for video based on typical video file properties, but is defined in the XSD).
   * (Optional attribute - xs:string)
   */
  public "@_algorithm"?: XsString;

  /**
   * The number of video channels (Note: This attribute seems unusual for video based on typical video file properties, but is defined in the XSD).
   * (Required attribute - xs:int)
   */
  public "@_channels": XsInt;

  /**
   * The sample rate of the video (Note: This attribute seems unusual for video based on typical video file properties, but is defined in the XSD).
   * (Required attribute - xs:int)
   */
  public "@_sampleRate": XsInt;

  // Property corresponding to child element

  /**
   * A reference to the external media file containing the video content.
   * (Optional child element)
   */
  public MediaFile?: MediaFile; // Reference to the video file

  /**
   * @param file - A reference to the external media file. (Required child element inherited from MediaFile)
   * @param duration - The duration of the media file. (Required attribute inherited from MediaFile - xs:double)
   * @param channels - The number of video channels. (Required attribute - xs:int)
   * @param sampleRate - The sample rate of the video. (Required attribute - xs:int)
   * @param algorithm - The algorithm used for video processing. (Optional attribute - xs:string)
   * @param timeUnit - The time unit used for the timeline. (Optional attribute inherited from Timeline)
   * @param track - A reference to the track this timeline belongs to. (Optional attribute inherited from Timeline - xs:IDREF)
   * @param name - The name of the video clip. (Optional attribute inherited from Nameable)
   * @param color - The color of the video clip. (Optional attribute inherited from Nameable)
   * @param comment - A comment for the video clip. (Optional attribute inherited from Nameable)
   */
  constructor(
    file: FileReference,
    duration: XsDecimal,
    channels: XsInt,
    sampleRate: XsInt,
    algorithm?: XsString,
    timeUnit?: TimeUnit,
    track?: XsString,
    name?: XsString,
    color?: XsString,
    comment?: XsString
  ) {
    super(file, duration, timeUnit, track, name, color, comment);
    this["@_algorithm"] = algorithm;
    this["@_channels"] = channels;
    this["@_sampleRate"] = sampleRate;
  }
}
