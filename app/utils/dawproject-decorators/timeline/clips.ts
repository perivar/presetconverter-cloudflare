import { Track } from "../track"; // Added import
import {
  XmlAttribute, // Added import
  XmlElement, // Added import
  XmlIDREF, // Added import
  XmlRootElement,
} from "../xmlDecorators";
import { Clip } from "./clip";
import { Timeline } from "./timeline";

/** Represents a timeline of clips. */
@XmlRootElement({ name: "Clips" })
export class Clips extends Timeline {
  /** Clips of this timeline. */
  @XmlElement({ name: "Clip", type: "Clip" })
  clips: Clip[] = [];

  /** Reference to the track this timeline belongs to. */
  @XmlAttribute({ required: false })
  @XmlIDREF
  track?: Track; // Added track property
}
