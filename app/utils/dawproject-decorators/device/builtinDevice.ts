import { XmlAttribute } from "../xmlDecorators";
import { Device } from "./device";

/** Abstract base class for built-in devices. */
export abstract class BuiltinDevice extends Device {
  /** Whether the device is bypassed. */
  @XmlAttribute({ required: false })
  isBypassed?: boolean;
}
