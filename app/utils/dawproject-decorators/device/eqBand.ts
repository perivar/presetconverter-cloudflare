import { Referenceable } from "../referenceable";
import { XmlAttribute } from "../xmlDecorators";
import { EqBandType } from "./eqBandType";

/** Represents a single band of an equalizer device. */
export class EqBand extends Referenceable {
  /** Whether the band is active. */
  @XmlAttribute({ required: false })
  isActive?: boolean;

  /** Type of the equalizer band. */
  @XmlAttribute({ required: false })
  type?: EqBandType;

  /** Frequency of the band. */
  @XmlAttribute({ required: false })
  frequency?: number; // Using number for Double type in TypeScript

  /** Gain of the band. */
  @XmlAttribute({ required: false })
  gain?: number; // Using number for Double type in TypeScript

  /** Q factor of the band. */
  @XmlAttribute({ required: false })
  q?: number; // Using number for Double type in TypeScript
}
