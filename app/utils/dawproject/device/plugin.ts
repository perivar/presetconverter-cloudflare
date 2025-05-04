import { BoolParameter } from "../boolParameter";
import { IFileReference, IParameter, IPlugin } from "../types";
import { Device } from "./device";
import { DeviceRole } from "./deviceRole";

/** Base class for all plug-in devices. */
export abstract class Plugin extends Device implements IPlugin {
  /** Version of the plug-in. */
  pluginVersion?: string;

  constructor(
    // Make required fields optional for deserialization, provide defaults
    deviceRole?: DeviceRole,
    deviceName?: string,
    enabled?: BoolParameter,
    loaded: boolean = true,
    deviceID?: string,
    deviceVendor?: string,
    state?: IFileReference,
    parameters?: IParameter[],
    name?: string,
    color?: string,
    comment?: string,
    pluginVersion?: string
  ) {
    // Provide default placeholders for required fields
    super(
      deviceRole || DeviceRole.AUDIO_FX, // Default placeholder
      deviceName || "", // Default placeholder
      enabled,
      loaded,
      deviceID,
      deviceVendor,
      state,
      parameters,
      name,
      color,
      comment
    );
    this.pluginVersion = pluginVersion;
  }

  toXmlObject(): any {
    const obj: any = {
      Plugin: {
        ...super.toXmlObject().Device,
      },
    };

    // Add Plugin-specific attributes
    if (this.pluginVersion !== undefined) {
      obj.Plugin["@_pluginVersion"] = this.pluginVersion;
    }

    return obj;
  }

  fromXmlObject(xmlObject: any): this {
    super.fromXmlObject(xmlObject);
    this.pluginVersion = xmlObject.pluginVersion || undefined;
    return this;
  }
}
