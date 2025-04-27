// dawproject/plugin.ts
import type { BoolParameter } from "./bool-parameter";
import { Device, type ParameterChoice } from "./device";
import type { FileReference } from "./file-reference";
import type {
  DeviceRole,
  Plugin as PluginType,
  XsBoolean,
  XsString,
} from "./project-schema";

/**
 * Base class for plugin devices.
 * Corresponds to the 'plugin' abstract complex type in Project.xsd.
 * Inherits attributes and child elements from Device.
 */
export abstract class Plugin extends Device implements PluginType {
  /**
   * The version of the plugin.
   * (Optional attribute)
   */
  public "@_pluginVersion"?: XsString;

  /**
   * @param deviceName - The name of the device. (Required attribute inherited from Device)
   * @param deviceRole - The role of the device (e.g., instrument, audioFX). (Required attribute inherited from Device)
   * @param name - The name of the plugin. (Optional attribute inherited from Nameable)
   * @param color - The color of the plugin. (Optional attribute inherited from Nameable)
   * @param comment - A comment for the plugin. (Optional attribute inherited from Nameable)
   * @param deviceID - A unique identifier for the device instance. (Optional attribute inherited from Device)
   * @param deviceVendor - The vendor of the device. (Optional attribute inherited from Device)
   * @param loaded - Indicates if the device was successfully loaded. (Optional attribute inherited from Device)
   * @param parameters - A collection of parameters for the device. (Optional child element inherited from Device)
   * @param enabled - Indicates if the device is enabled. (Optional child element inherited from Device)
   * @param state - A reference to a file containing the device's state. (Optional child element inherited from Device)
   * @param pluginVersion - The version of the plugin. (Optional attribute)
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
    state?: FileReference,
    pluginVersion?: XsString
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
    this["@_pluginVersion"] = pluginVersion;
  }
}
