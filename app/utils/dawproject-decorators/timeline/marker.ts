import { DoubleAdapter } from "../doubleAdapter";
import { Nameable } from "../nameable";
import { XmlAttribute, XmlRootElement, XmlTypeAdapter } from "../xmlDecorators";

/** Represents a marker point on a timeline. */
@XmlRootElement({ name: "Marker" })
export class Marker extends Nameable {
  /** Time position of the marker. */
  @XmlAttribute({ required: true })
  @XmlTypeAdapter(DoubleAdapter)
  time: number;

  constructor(time: number, name?: string) {
    super();
    this.time = time;
    if (name) {
      this.name = name;
    }
  }
}
