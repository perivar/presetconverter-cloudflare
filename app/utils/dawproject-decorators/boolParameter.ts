import { Parameter } from "./parameter";
import { XmlAttribute, XmlRootElement } from "./xmlDecorators";

/** Represents a parameter which can provide a boolean (true/false) value and be used as an automation target. */
@XmlRootElement({ name: "BoolParameter" })
export class BoolParameter extends Parameter {
  /** Boolean value for this parameter. */
  @XmlAttribute({ required: false })
  value?: boolean;
}
