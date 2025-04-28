import { Track } from "../track"; // Added import
import { Unit } from "../unit";
import {
  XmlAttribute,
  XmlElement,
  XmlElementWrapper,
  XmlIDREF, // Added import
  XmlRootElement,
} from "../xmlDecorators";
import { AutomationTarget } from "./automationTarget";
import { RealPoint } from "./realPoint";
import { Timeline } from "./timeline";

/** Represents a timeline containing automation points. */
@XmlRootElement({ name: "Points" })
export class Points extends Timeline {
  /** The target parameter or expression for this automation. */
  @XmlElement({ name: "Target", required: true, type: "AutomationTarget" })
  target: AutomationTarget;

  /** Unit in which the point values are defined. */
  @XmlAttribute({ required: false })
  unit?: Unit;

  /** List of automation points on this timeline. */
  @XmlElementWrapper("Points")
  @XmlElement({ name: "Point", type: "RealPoint" })
  points: RealPoint[] = [];

  /** Reference to the track this timeline belongs to. */
  @XmlAttribute({ required: false })
  @XmlIDREF
  track?: Track; // Added track property

  constructor(target: AutomationTarget) {
    super();
    this.target = target;
  }
}
