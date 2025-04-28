import { Parameter } from "./parameter";
import { XmlAttribute, XmlRootElement } from "./xmlDecorators";

/** Represents a (the) time-signature parameter which can provide a value and be used as an automation target. */
@XmlRootElement({ name: "TimeSignatureParameter" })
export class TimeSignatureParameter extends Parameter {
  /** Numerator of the time-signature. (3/4 &rarr; 3, 4/4 &rarr; 4)*/
  @XmlAttribute({ required: true })
  numerator: number; // Using number for Integer type in TypeScript

  /** Denominator of the time-signature. (3/4 &rarr; 4, 7/8 &rarr; 8) */
  @XmlAttribute({ required: true })
  denominator: number; // Using number for Integer type in TypeScript

  constructor(numerator: number, denominator: number) {
    super();
    this.numerator = numerator;
    this.denominator = denominator;
  }
}
