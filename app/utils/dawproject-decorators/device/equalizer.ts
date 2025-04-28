import { XmlElement, XmlRootElement } from "../xmlDecorators";
import { BuiltinDevice } from "./builtinDevice";
import { EqBand } from "./eqBand";

/** Represents a built-in equalizer device. */
@XmlRootElement({ name: "Equalizer" })
export class Equalizer extends BuiltinDevice {
  /** Bands of the equalizer. */
  @XmlElement({ name: "Band", type: "EqBand" })
  bands: EqBand[] = [];
}
