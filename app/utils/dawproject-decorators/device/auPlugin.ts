import { XmlAttribute, XmlRootElement } from "../xmlDecorators";
import { Plugin } from "./plugin";

/** Represents an Audio Unit plugin device. */
@XmlRootElement({ name: "AuPlugin" })
export class AuPlugin extends Plugin {
  /** Audio Unit plugin format version. */
  @XmlAttribute({ required: false })
  pluginFormatVersion?: number; // Using number for Integer type in TypeScript
}
