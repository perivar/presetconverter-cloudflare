import { XmlRootElement } from "../xmlDecorators";
import { Plugin } from "./plugin";

/** Represents a VST2 plugin device. */
@XmlRootElement({ name: "Vst2Plugin" })
export class Vst2Plugin extends Plugin {
  // No additional properties in Java
}
