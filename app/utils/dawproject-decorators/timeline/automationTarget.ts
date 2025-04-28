import { ExpressionType } from "../expressionType";
import { Parameter } from "../parameter";
import { XmlAttribute, XmlIDREF } from "../xmlDecorators";

/** Represents the target of an automation timeline. */
export class AutomationTarget {
  /** MIDI channel (0-15) or -1 for all channels. */
  @XmlAttribute({ required: false })
  channel?: number; // Using number for Integer type in TypeScript

  /** MIDI controller number (0-127). */
  @XmlAttribute({ required: false })
  controller?: number; // Using number for Integer type in TypeScript

  /** Type of expression being automated. */
  @XmlAttribute({ required: false })
  expression?: ExpressionType;

  /** Parameter being automated. */
  @XmlAttribute()
  @XmlIDREF
  parameter?: Parameter;
}
