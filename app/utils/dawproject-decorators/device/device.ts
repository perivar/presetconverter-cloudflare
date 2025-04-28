import { DeviceRole } from "../deviceRole";
import { FileReference } from "../fileReference";
import { Referenceable } from "../referenceable";
import { XmlAttribute, XmlElement, XmlRootElement } from "../xmlDecorators";

/** Abstract base class for devices/plug-ins. */
@XmlRootElement({ name: "Device" })
export abstract class Device extends Referenceable {
  /** Role of this device. */
  @XmlAttribute({ required: false })
  deviceRole?: DeviceRole;

  /** If this device is enabled/active. */
  @XmlAttribute({ required: false })
  enabled?: boolean = true;

  /** Name of the device. */
  @XmlAttribute({ required: false })
  deviceName?: string;

  /** Reference to preset/state file for this device. */
  @XmlElement({ name: "State", type: "FileReference", required: false })
  state?: FileReference;
}
