// dawproject/limiter.ts
import { BoolParameter } from "./bool-parameter";
import { BuiltinDevice } from "./builtin-device";
import type { ParameterChoice } from "./device";
import { FileReference } from "./file-reference";
import type {
  DeviceRole,
  Limiter as LimiterType,
  XsBoolean,
  XsString,
} from "./project-schema";
import type { RealParameter } from "./real-parameter";

/**
 * Represents a limiter device.
 * Corresponds to the 'limiter' complex type in Project.xsd.
 * Inherits attributes and child elements from BuiltinDevice.
 */
export class Limiter extends BuiltinDevice implements LimiterType {
  // Properties corresponding to child elements

  /**
   * The attack parameter for the limiter.
   * (Optional child element)
   */
  public Attack?: RealParameter;

  /**
   * The input gain parameter for the limiter.
   * (Optional child element)
   */
  public InputGain?: RealParameter;

  /**
   * The output gain parameter for the limiter.
   * (Optional child element)
   */
  public OutputGain?: RealParameter;

  /**
   * The release parameter for the limiter.
   * (Optional child element)
   */
  public Release?: RealParameter;

  /**
   * The threshold parameter for the limiter.
   * (Optional child element)
   */
  public Threshold?: RealParameter;

  /**
   * @param deviceName - The name of the device. (Required attribute inherited from Device)
   * @param deviceRole - The role of the device (e.g., instrument, audioFX). (Required attribute inherited from Device)
   * @param name - The name of the limiter. (Optional attribute inherited from Nameable)
   * @param color - The color of the limiter. (Optional attribute inherited from Nameable)
   * @param comment - A comment for the limiter. (Optional attribute inherited from Nameable)
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
    // Pass all parameters required by BuiltinDevice constructor
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
