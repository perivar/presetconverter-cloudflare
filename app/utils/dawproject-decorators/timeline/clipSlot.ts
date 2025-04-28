import { XmlAttribute, XmlElement, XmlRootElement } from "../xmlDecorators";
import { Clip } from "./clip";
import { Timeline } from "./timeline";

/** Represent a clip launcher slot within a Scene which can contain a Clip. */
@XmlRootElement({ name: "ClipSlot" })
export class ClipSlot extends Timeline {
  /** Whether launching this slot should stop the track playback when this slot is empty. */
  @XmlAttribute({ required: false })
  hasStop?: boolean;

  /** Contained clip. */
  @XmlElement({ name: "Clip", required: false, type: "Clip" })
  clip?: Clip;
}
