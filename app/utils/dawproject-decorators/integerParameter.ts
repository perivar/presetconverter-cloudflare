import { Parameter } from "./parameter";
import { XmlAttribute, XmlRootElement } from "./xmlDecorators";

/** Represents an integer parameter which can provide a value and be used as an automation target. */
@XmlRootElement({ name: "IntegerParameter" })
export class IntegerParameter extends Parameter {
  /** Integer value for this parameter. */
  @XmlAttribute()
  value?: number; // Using number for Integer type in TypeScript

  /** Minimum value this parameter can have (inclusive). */
  @XmlAttribute()
  min?: number; // Using number for Integer type in TypeScript

  /** Maximum value this parameter can have (inclusive). */
  @XmlAttribute()
  max?: number; // Using number for Integer type in TypeScript

  constructor(value?: number, min?: number, max?: number) {
    super();
    this.value = value;
    this.min = min;
    this.max = max;
  }
}
