// dawproject/audio.ts
import { MediaFile } from "./media-file";
import type {
  Audio as AudioType,
  FileReference,
  TimeUnit,
  XsDecimal,
  XsInt,
  XsString,
} from "./project-schema";

/**
 * Represents audio content, referencing a media file and potentially containing warps.
 * Corresponds to the 'audio' complex type in Project.xsd.
 */
export class Audio extends MediaFile implements AudioType {
  /**
   * The algorithm used for time stretching or pitch shifting.
   * (Optional attribute)
   */
  public "@_algorithm"?: XsString;

  /**
   * The number of audio channels.
   * (Required attribute)
   */
  public "@_channels": XsInt;

  /**
   * The sample rate of the audio in Hz.
   * (Required attribute)
   */
  public "@_sampleRate": XsInt;

  /**
   * @param sampleRate - The sample rate of the audio in Hz. (Required attribute)
   * @param channels - The number of audio channels. (Required attribute)
   * @param duration - The duration of the media file. (Required attribute inherited from MediaFile)
   * @param file - A reference to the external media file. (Required child element inherited from MediaFile)
   * @param algorithm - The algorithm used for time stretching or pitch shifting. (Optional attribute)
   * @param timeUnit - The time unit used for the timeline. (Optional attribute inherited from Timeline)
   * @param track - A reference to the track this timeline belongs to. (Optional attribute inherited from Timeline)
   * @param name - The name of the audio clip. (Optional attribute inherited from Nameable)
   * @param color - The color of the audio clip. (Optional attribute inherited from Nameable)
   * @param comment - A comment for the audio clip. (Optional attribute inherited from Nameable)
   */
  constructor(
    sampleRate: XsInt,
    channels: XsInt,
    duration: XsDecimal,
    file: FileReference,
    algorithm?: XsString,
    timeUnit?: TimeUnit,
    track?: XsString,
    name?: XsString,
    color?: XsString,
    comment?: XsString
  ) {
    super(file, duration, timeUnit, track, name, color, comment);
    this["@_channels"] = channels;
    this["@_sampleRate"] = sampleRate;
    this["@_algorithm"] = algorithm;
  }
}
