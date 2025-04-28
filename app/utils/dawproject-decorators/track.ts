import { Channel } from "./channel";
import { ContentType } from "./contentType";
import { Lane } from "./lane";
import { XmlAttribute, XmlElement, XmlRootElement } from "./xmlDecorators";

/** Represents a sequencer track. */
@XmlRootElement({ name: "Track" })
export class Track extends Lane {
  /** Role of this track in timelines & arranger. Can be multiple (comma-separated). */
  @XmlAttribute({ required: false })
  // @XmlList() // XmlList is not directly supported by the current decorators
  contentType?: ContentType[]; // Representing as array, will need custom handling for space-separated string

  /** If this track is loaded/active of not. */
  @XmlAttribute({ required: false })
  loaded?: boolean;

  /** Mixer channel used for the output of this track. */
  @XmlElement({ name: "Channel", required: false, type: "Channel" })
  channel?: Channel;

  /** Child tracks, typically used to represent group/folder tracks with contentType="tracks". */
  @XmlElement({ name: "Track", type: "Track" }) // Self-reference
  tracks: Track[] = [];
}
