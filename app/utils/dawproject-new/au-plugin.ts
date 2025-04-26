// dawproject/au-plugin.ts
import { BoolParameter } from "./bool-parameter"; // Keep without 'type'
import type { ParameterChoice } from "./device"; // Changed back to 'import type'

import { FileReference } from "./file-reference"; // Keep without 'type'
import { Plugin } from "./plugin";
import type {
  AuPlugin as AuPluginType,
  DeviceRole,
  XsBoolean,
  XsString,
} from "./project-schema";

// Changed back to 'import type'

/**
 * Represents an Audio Unit (AU) plugin device.
 * Corresponds to the 'auPlugin' complex type in Project.xsd.
 */
export class AuPlugin extends Plugin implements AuPluginType {
  // AuPlugin type in Project.xsd doesn't add new properties beyond Plugin.
  // Inherits attributes and child elements from Plugin.

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
   * @param pluginVersion - The version of the plugin. (Optional attribute inherited from Plugin)
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
      state,
      pluginVersion
    );
  }
}
