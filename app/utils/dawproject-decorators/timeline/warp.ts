import { DoubleAdapter } from "../doubleAdapter";
import { Referenceable } from "../referenceable";
import { XmlAttribute, XmlRootElement, XmlTypeAdapter } from "../xmlDecorators";

/** Represents a warp point for time-stretching audio. */
@XmlRootElement({ name: "Warp" })
export class Warp extends Referenceable {
  /** Time position of the warp point in the timeline's time unit. */
  @XmlAttribute({ required: true })
  @XmlTypeAdapter(DoubleAdapter)
  time: number;

  /** Time position in the content's time unit that corresponds to the timeline time. */
  @XmlAttribute({ required: true })
  @XmlTypeAdapter(DoubleAdapter)
  contentTime: number;

  constructor(time: number, contentTime: number) {
    super();
    this.time = time;
    this.contentTime = contentTime;
  }
}
