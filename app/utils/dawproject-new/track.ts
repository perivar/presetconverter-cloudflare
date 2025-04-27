// dawproject/track.ts
import { Channel } from "./channel";
import { Lane } from "./lane";
import type {
  ContentType,
  Track as TrackType,
  XsBoolean,
  XsString,
} from "./project-schema";

/**
 * Represents a track in the project structure.
 * Corresponds to the 'track' complex type in Project.xsd.
 * Inherits attributes and child elements from Lane.
 */
export class Track extends Lane implements TrackType {
  // Properties corresponding to child elements

  /**
   * The mixer channel associated with this track.
   * (Optional child element)
   */
  public Channel?: Channel;

  /**
   * A collection of nested tracks.
   * (Optional child element - unbounded)
   */
  public Track: Track[] = []; // Initialized as empty array for unbounded element

  /**
   * A space-separated list of content types (e.g., "audio notes").
   * (Optional attribute - list of contentType)
   */
  public "@_contentType"?: XsString;

  /**
   * Indicates if the track was successfully loaded.
   * (Optional attribute - xs:boolean)
   */
  public "@_loaded"?: XsBoolean;

  /**
   * @param name - The name of the track. (Optional attribute inherited from Nameable)
   * @param color - The color of the track. (Optional attribute inherited from Nameable)
   * @param comment - A comment for the track. (Optional attribute inherited from Nameable)
   * @param channel - The mixer channel associated with this track. (Optional child element)
   * @param contentTypes - A set of content types for the track. (Optional attribute - list of contentType)
   * @param loaded - Indicates if the track was successfully loaded. (Optional attribute - xs:boolean)
   */
  constructor(
    name?: XsString,
    color?: XsString,
    comment?: XsString,
    channel?: Channel,
    contentTypes?: Set<ContentType>,
    loaded?: XsBoolean
  ) {
    super(name, color, comment); // Call Lane constructor (handles id, @_xmlns, name, color, comment)
    this.Channel = channel;
    this["@_loaded"] = loaded;

    // Convert contentTypes set to space-separated string for the attribute
    if (contentTypes) {
      this["@_contentType"] = Array.from(contentTypes).join(" ");
    }
  }
}
