import { XmlAttribute, XmlRootElement } from "../xmlDecorators";
import { Device } from "./device";

/** Abstract base class for plug-in devices. */
@XmlRootElement({ name: "Plugin" })
export abstract class Plugin extends Device {
  /** Plug-in specific ID. Format depends on the plug-in format (e.g. VST3 UUID). */
  @XmlAttribute({ required: false })
  pluginID?: string;

  /** Name of the plug-in vendor. */
  @XmlAttribute({ required: false })
  pluginVendor?: string;

  /** Version of the plug-in. */
  @XmlAttribute({ required: false })
  pluginVersion?: string;
}
