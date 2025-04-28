import { XmlRootElement } from "../xmlDecorators";
import { Plugin } from "./plugin";

/** Represents a CLAP plugin device. */
@XmlRootElement({ name: "ClapPlugin" })
export class ClapPlugin extends Plugin {
  // No additional properties in Java
}
