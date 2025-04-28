import { XmlRootElement } from "../xmlDecorators";
import { BuiltinDevice } from "./builtinDevice";

/** Represents a built-in limiter device. */
@XmlRootElement({ name: "Limiter" })
export class Limiter extends BuiltinDevice {
  // No additional properties in Java
}
