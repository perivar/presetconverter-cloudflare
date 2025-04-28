import { Referenceable } from "./referenceable";
import { Lanes } from "./timeline/lanes";
import { Markers } from "./timeline/markers";
import { Points } from "./timeline/points";
import { XmlElement, XmlRootElement } from "./xmlDecorators";

/** Represents the main Arrangement timeline of a DAW. */
@XmlRootElement({ name: "Arrangement" })
export class Arrangement extends Referenceable {
  /** Automation data for time-signature inside this Arrangement. */
  @XmlElement({
    name: "TimeSignatureAutomation",
    required: false,
    type: "Points",
  })
  timeSignatureAutomation?: Points;

  /** Automation data for tempo inside this Arrangement. */
  @XmlElement({ name: "TempoAutomation", required: false, type: "Points" })
  tempoAutomation?: Points;

  /** Cue markers inside this arrangement */
  @XmlElement({ name: "Markers", required: false, type: "Markers" })
  markers?: Markers;

  /** The lanes of this arrangement. */
  @XmlElement({ name: "Lanes", required: true, type: "Lanes" })
  lanes: Lanes;

  constructor(lanes: Lanes) {
    super();
    this.lanes = lanes;
  }
}
