import { Referenceable } from "./referenceable";
import { XmlAttribute } from "./xmlDecorators";

/** Represents a parameter which can provide a value and be used as an automation target. */
export abstract class Parameter extends Referenceable {
  /** Parameter ID as used by VST2 (index), VST3(ParamID) */
  @XmlAttribute({ required: false })
  parameterID?: number; // Using number for Integer type in TypeScript
}
