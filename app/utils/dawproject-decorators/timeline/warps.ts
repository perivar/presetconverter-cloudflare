import {
  XmlAttribute,
  XmlElement,
  XmlElementRef,
  XmlElementWrapper,
  XmlRootElement,
} from "../xmlDecorators";
import { Timeline } from "./timeline";
import { TimeUnit } from "./timeUnit";
import { Warp } from "./warp";

/** Represents a timeline containing warp points for time-stretching audio. */
@XmlRootElement({ name: "Warps" })
export class Warps extends Timeline {
  /**
   * Content timeline to be warped.
   */
  @XmlElementRef({ name: "Content" })
  content?: Timeline;

  /** Unit in which the contentTime of the warp points are defined. */
  @XmlAttribute({ required: true })
  contentTimeUnit: TimeUnit;

  /** Warp events defining the transformation. (minimum 2) */
  @XmlElementWrapper({ name: "Events", required: true })
  @XmlElement({ name: "Warp", type: "Warp" })
  warp: Warp[] = [];

  constructor(contentTimeUnit: TimeUnit) {
    super();
    this.contentTimeUnit = contentTimeUnit;
  }
}
