import { Track } from "../track"; // Added import
import {
  XmlAttribute,
  XmlElementRef,
  XmlElementWrapper,
  XmlIDREF, // Added import
  XmlRootElement,
} from "../xmlDecorators";
import { Timeline } from "./timeline";

/** Represents a container for lanes, typically used in Arrangement or Scene timelines. */
@XmlRootElement({ name: "Lanes" })
export class Lanes extends Timeline {
  /** Lanes contained within this container. */
  @XmlElementWrapper({ name: "Lanes" })
  @XmlElementRef()
  lanes: Timeline[] = [];

  /** Reference to the track this lane belongs to. */
  @XmlAttribute({ required: false })
  @XmlIDREF
  track?: Track; // Added track property
}
