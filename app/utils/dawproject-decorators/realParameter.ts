import { DoubleAdapter } from "./doubleAdapter";
import { Parameter } from "./parameter";
import { Unit } from "./unit";
import { XmlAttribute, XmlRootElement, XmlTypeAdapter } from "./xmlDecorators";

/** Represents a real valued (double) parameter which can provide a value and be used as an automation target. */
@XmlRootElement({ name: "RealParameter" })
export class RealParameter extends Parameter {
  /** Real (double) value for this parameter. */
  @XmlAttribute()
  @XmlTypeAdapter(DoubleAdapter)
  value?: number; // Using number for Double type in TypeScript

  /** Unit in which value, min and max are defined. */
  @XmlAttribute({ required: true })
  unit: Unit;

  /** Minimum value this parameter can have (inclusive). */
  @XmlAttribute()
  @XmlTypeAdapter(DoubleAdapter)
  min?: number;

  /** Maximum value this parameter can have (inclusive). */
  @XmlAttribute()
  @XmlTypeAdapter(DoubleAdapter)
  max?: number;

  constructor(unit: Unit, value?: number, min?: number, max?: number) {
    super();
    this.unit = unit;
    this.value = value;
    this.min = min;
    this.max = max;
  }
}
