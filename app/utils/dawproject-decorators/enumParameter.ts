import { Parameter } from "./parameter";
import { XmlAttribute, XmlRootElement } from "./xmlDecorators";

/** Represents an enumerated parameter which can provide a value and be used as an automation target. */
@XmlRootElement({ name: "EnumParameter" })
export class EnumParameter extends Parameter {
  /** Index of the enum value. */
  @XmlAttribute()
  value?: number; // Using number for Integer type in TypeScript

  /** Number of entries in enum value. value will be in the range [0 .. count-1]. */
  @XmlAttribute({ required: true })
  count: number; // Using number for Integer type in TypeScript

  /** Labels of the individual enum values. */
  @XmlAttribute({ required: false })
  labels?: string[];

  constructor(count: number, value?: number, labels?: string[]) {
    super();
    this.count = count;
    this.value = value;
    this.labels = labels;
  }
}
