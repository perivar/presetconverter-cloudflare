import { DoubleAdapter } from "../doubleAdapter";
import { Interpolation } from "../interpolation";
import { Referenceable } from "../referenceable";
import { XmlAttribute, XmlRootElement, XmlTypeAdapter } from "../xmlDecorators";

/** Represents a point on a timeline with a real (double) value. */
@XmlRootElement({ name: "RealPoint" })
export class RealPoint extends Referenceable {
  /** Time position of the point. */
  @XmlAttribute({ required: true })
  @XmlTypeAdapter(DoubleAdapter)
  time: number;

  /** Value of the point. */
  @XmlAttribute({ required: true })
  @XmlTypeAdapter(DoubleAdapter)
  value: number;

  /** Interpolation method to the next point. */
  @XmlAttribute({ required: true })
  interpolation: Interpolation;

  constructor(time: number, value: number, interpolation: Interpolation) {
    super();
    this.time = time;
    this.value = value;
    this.interpolation = interpolation;
  }
}
