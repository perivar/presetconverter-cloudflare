import { XmlRootElement } from "../xmlDecorators";
import { BuiltinDevice } from "./builtinDevice";

/** Represents a built-in compressor device. */
@XmlRootElement({ name: "Compressor" })
export class Compressor extends BuiltinDevice {
  // No additional properties in Java
}
