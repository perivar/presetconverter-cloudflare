import {
  XmlElement,
  XmlElementWrapper,
  XmlRootElement,
} from "../xmlDecorators";
import { Marker } from "./marker";
import { Timeline } from "./timeline";

/** Represents a timeline containing markers. */
@XmlRootElement({ name: "Markers" })
export class Markers extends Timeline {
  /** List of markers on this timeline. */
  @XmlElementWrapper("Markers")
  @XmlElement({ name: "Marker", type: "Marker" })
  markers: Marker[] = [];
}
