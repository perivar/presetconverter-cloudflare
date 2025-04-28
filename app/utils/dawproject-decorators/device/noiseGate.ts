import { XmlRootElement } from "../xmlDecorators";
import { BuiltinDevice } from "./builtinDevice";

/** Represents a built-in noise gate device. */
@XmlRootElement({ name: "NoiseGate" })
export class NoiseGate extends BuiltinDevice {
  // No additional properties in Java
}
