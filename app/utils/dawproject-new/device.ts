// dawproject/device.ts
import type { BoolParameter } from "./bool-parameter";
import type { EnumParameter } from "./enum-parameter";
import type { FileReference } from "./file-reference";
import type { IntegerParameter } from "./integer-parameter";
import type { Parameter } from "./parameter";
import type {
  DeviceRole,
  Device as DeviceType,
  XsBoolean,
  XsString,
} from "./project-schema";
import type { RealParameter } from "./real-parameter";
import { Referenceable } from "./referenceable";
import type { TimeSignatureParameter } from "./time-signature-parameter";

// Union type for different kinds of parameters allowed in the device's Parameters element
export type ParameterChoice =
  | Parameter
  | RealParameter
  | BoolParameter
  | IntegerParameter
  | EnumParameter
  | TimeSignatureParameter;

/**
 * Base class for all processing devices (plugins, built-in effects, etc.).
 * Corresponds to the 'device' complex type in Project.xsd.
 * Inherits attributes and child elements from Referenceable.
 */
export class Device extends Referenceable implements DeviceType {
  /**
   * The name of the device.
   * (Required attribute)
   */
  public "@_deviceName": XsString;

  /**
   * The role of the device (e.g., instrument, audioFX).
   * (Required attribute)
   */
  public "@_deviceRole": DeviceRole;

  /**
   * A unique identifier for the device instance.
   * (Optional attribute)
   */
  public "@_deviceID"?: XsString;

  /**
   * The vendor of the device.
   * (Optional attribute)
   */
  public "@_deviceVendor"?: XsString;

  /**
   * Indicates if the device was successfully loaded.
   * (Optional attribute)
   */
  public "@_loaded"?: XsBoolean;

  // Child elements

  /**
   * A collection of parameters for the device.
   * (Optional child element - sequence of choices)
   */
  public Parameters?: ParameterChoice[];

  /**
   * Indicates if the device is enabled.
   * (Optional child element)
   */
  public Enabled?: BoolParameter;

  /**
   * A reference to a file containing the device's state.
   * (Optional child element)
   */
  public State?: FileReference;

  /**
   * @param deviceName - The name of the device. (Required attribute)
   * @param deviceRole - The role of the device. (Required attribute)
   * @param name - The name of the device. (Optional attribute inherited from Nameable)
   * @param color - The color of the device. (Optional attribute inherited from Nameable)
   * @param comment - A comment for the device. (Optional attribute inherited from Nameable)
   * @param deviceID - A unique identifier for the device instance. (Optional attribute)
   * @param deviceVendor - The vendor of the device. (Optional attribute)
   * @param loaded - Indicates if the device was successfully loaded. (Optional attribute)
   * @param parameters - A collection of parameters for the device. (Optional child element)
   * @param enabled - Indicates if the device is enabled. (Optional child element)
   * @param state - A reference to a file containing the device's state. (Optional child element)
   */
  constructor(
    deviceName: XsString,
    deviceRole: DeviceRole,
    name?: XsString,
    color?: XsString,
    comment?: XsString,
    deviceID?: XsString,
    deviceVendor?: XsString,
    loaded?: XsBoolean,
    parameters?: ParameterChoice[],
    enabled?: BoolParameter,
    state?: FileReference
  ) {
    super(name, color, comment);
    this["@_deviceName"] = deviceName;
    this["@_deviceRole"] = deviceRole;
    this["@_deviceID"] = deviceID;
    this["@_deviceVendor"] = deviceVendor;
    this["@_loaded"] = loaded;

    // Assign child elements if provided
    this.Parameters = parameters;
    this.Enabled = enabled;
    this.State = state;
  }
}
