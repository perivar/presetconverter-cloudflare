import { Lane } from "../lane";
import { Track } from "../track"; // Added import
import {
  XmlAttribute, // Added import
  XmlElement,
  XmlElementWrapper,
  XmlIDREF, // Added import
  XmlRootElement,
} from "../xmlDecorators";
import { Timeline } from "./timeline";

/** Represents a container for lanes, typically used in Arrangement or Scene timelines. */
@XmlRootElement({ name: "Lanes" })
export class Lanes extends Timeline {
  /** Lanes contained within this container. */
  @XmlElementWrapper("Lanes")
  @XmlElement({ name: "Lane", type: "Lane" }) // Using type "Lane" for polymorphism
  lanes: Lane[] = [];

  /** Reference to the track this lane belongs to. */
  @XmlAttribute({ required: false })
  @XmlIDREF
  track?: Track; // Added track property
}
