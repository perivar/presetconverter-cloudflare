import { DeviceRole } from "../deviceRole";
import { FileReference } from "../fileReference";
import { Parameter } from "../parameter";
import { Referenceable } from "../referenceable";
import {
  XmlAttribute,
  XmlElement,
  XmlElementRef,
  XmlElementWrapper,
  XmlRootElement,
} from "../xmlDecorators";

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

  /** Parameters for this device, which is required for automated parameters in order to provide an ID. <br/>
   * Note: If the automated parameter is already present like the BuiltinDevice parameters, it should not be included here as well. */
  @XmlElementWrapper({ name: "Parameters", required: false })
  @XmlElementRef()
  automatedParameters: Parameter[] = [];
}
