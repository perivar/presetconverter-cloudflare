import {
  XmlAttribute,
  XmlElement,
  XmlElementWrapper,
  XmlRootElement,
} from "../xmlDecorators";
import { Audio } from "./audio"; // Added import for Audio
import { Timeline } from "./timeline";
import { TimeUnit } from "./timeUnit";
import { Warp } from "./warp";

/** Represents a timeline containing warp points for time-stretching audio. */
@XmlRootElement({ name: "Warps" })
export class Warps extends Timeline {
  /** The audio content being warped. */
  @XmlElement({ name: "Content", type: "Audio", required: false }) // Added content property
  content?: Audio;

  /** Unit in which the contentTime of the warp points are defined. */
  @XmlAttribute({ required: true })
  contentTimeUnit: TimeUnit;

  /** List of warp points on this timeline. */
  @XmlElementWrapper("Events") // Note: Java uses 'events', TS uses 'Warp'
  @XmlElement({ name: "Warp", type: "Warp" })
  warp: Warp[] = []; // Changed from 'events' to 'warp' to match decorator

  constructor(contentTimeUnit: TimeUnit) {
    super();
    this.contentTimeUnit = contentTimeUnit;
  }
}
