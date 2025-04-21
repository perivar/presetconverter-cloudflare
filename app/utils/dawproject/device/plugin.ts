import { BoolParameter } from "../boolParameter";
import { IFileReference, IParameter, IPlugin } from "../types";
import { Device } from "./device";
import { DeviceRole } from "./deviceRole";

/** Base class for all plug-in devices. */
export abstract class Plugin extends Device implements IPlugin {
  /** Version of the plug-in. */
  pluginVersion?: string;

  constructor(
    deviceRole: DeviceRole,
    deviceName: string,
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
    super(
      deviceRole,
      deviceName,
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

  protected override getXmlAttributes(): any {
    const attributes = super.getXmlAttributes();
    if (this.pluginVersion !== undefined) {
      attributes.pluginVersion = this.pluginVersion;
    }
    return attributes;
  }

  protected override populateFromXml(xmlObject: any): void {
    super.populateFromXml(xmlObject);
    this.pluginVersion = xmlObject.pluginVersion || undefined;
  }
}
