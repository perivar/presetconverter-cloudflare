import { Referenceable } from "../referenceable";
import { XmlAttribute } from "../xmlDecorators";
import { TimeUnit } from "./timeUnit";

/** Abstract base class for timelines. */
export abstract class Timeline extends Referenceable {
  /** Time unit used for the time attribute of all events contained within this timeline. */
  @XmlAttribute({ required: false })
  timeUnit?: TimeUnit = TimeUnit.beats;
}
