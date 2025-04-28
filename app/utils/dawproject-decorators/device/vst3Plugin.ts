import { XmlRootElement } from "../xmlDecorators";
import { Plugin } from "./plugin";

/** Represents a VST3 plug-in device. */
@XmlRootElement({ name: "Vst3Plugin" })
export class Vst3Plugin extends Plugin {
  // VST3 specific properties can be added here if needed.
  // For now, it inherits all properties from Plugin.

  // Default constructor (no arguments)
  constructor() {
    super();
  }
}
