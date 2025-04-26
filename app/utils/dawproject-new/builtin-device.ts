// dawproject/builtin-device.ts
import type { BoolParameter } from "./bool-parameter";
import { Device, type ParameterChoice } from "./device";
import type { FileReference } from "./file-reference";
import type {
  BuiltinDevice as BuiltinDeviceType,
  DeviceRole,
  XsBoolean,
  XsString,
} from "./project-schema";

// Import BuiltinDevice type

/**
 * Base class for built-in devices (EQ, Compressor, etc.).
 * Corresponds to the 'builtinDevice' complex type in Project.xsd.
 * Inherits attributes and child elements from Device.
 */
export class BuiltinDevice extends Device implements BuiltinDeviceType {
  // BuiltinDevice type in Project.xsd doesn't add new properties beyond Device.
  // Inherits attributes and child elements from Device.

  /**
   * @param deviceName - The name of the device. (Required attribute inherited from Device)
   * @param deviceRole - The role of the device (e.g., instrument, audioFX). (Required attribute inherited from Device)
   * @param name - The name of the device. (Optional attribute inherited from Nameable)
   * @param color - The color of the device. (Optional attribute inherited from Nameable)
   * @param comment - A comment for the device. (Optional attribute inherited from Nameable)
   * @param deviceID - A unique identifier for the device instance. (Optional attribute inherited from Device)
   * @param deviceVendor - The vendor of the device. (Optional attribute inherited from Device)
   * @param loaded - Indicates if the device was successfully loaded. (Optional attribute inherited from Device)
   * @param parameters - A collection of parameters for the device. (Optional child element inherited from Device)
   * @param enabled - Indicates if the device is enabled. (Optional child element inherited from Device)
   * @param state - A reference to a file containing the device's state. (Optional child element inherited from Device)
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
    super(
      deviceName,
      deviceRole,
      name,
      color,
      comment,
      deviceID,
      deviceVendor,
      loaded,
      parameters,
      enabled,
      state
    );
  }
}
