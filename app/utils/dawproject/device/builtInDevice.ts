import { XMLParser } from "fast-xml-parser";

import { BoolParameter } from "../boolParameter";
import type { IBuiltInDevice, IFileReference, IParameter } from "../types";
import { Device } from "./device";
import { DeviceRole } from "./deviceRole";

export class BuiltInDevice extends Device implements IBuiltInDevice {
  deviceType?: Device;

  constructor(
    deviceRole: DeviceRole,
    deviceName: string,
    deviceType?: Device,
    enabled?: BoolParameter,
    loaded: boolean = true,
    deviceId?: string,
    deviceVendor?: string,
    state?: IFileReference,
    parameters?: IParameter[],
    name?: string,
    color?: string,
    comment?: string
  ) {
    super(
      deviceRole,
      deviceName,
      enabled,
      loaded,
      deviceId,
      deviceVendor,
      state,
      parameters,
      name,
      color,
      comment
    );
    this.deviceType = deviceType;
  }

  protected getXmlAttributes(): any {
    const attributes = super.getXmlAttributes();
    return attributes;
  }

  protected getXmlChildren(): any {
    const children = super.getXmlChildren();
    if (this.deviceType) {
      const deviceTypeObj = this.deviceType.toXmlObject();
      const deviceTypeName = Object.keys(deviceTypeObj)[0];
      children[deviceTypeName] = deviceTypeObj[deviceTypeName];
    }
    return children;
  }

  toXmlObject(): any {
    return {
      BuiltinDevice: {
        ...this.getXmlAttributes(),
        ...this.getXmlChildren(),
      },
    };
  }

  static fromXml(xmlString: string): BuiltInDevice {
    const parser = new XMLParser({ attributeNamePrefix: "" });
    const jsonObj = parser.parse(xmlString);
    return BuiltInDevice.fromXmlObject(jsonObj.BuiltinDevice);
  }

  static fromXmlObject(xmlObject: any): BuiltInDevice {
    const instance = new BuiltInDevice(
      xmlObject.deviceRole as DeviceRole,
      xmlObject.deviceName
    );
    instance.populateFromXml(xmlObject);

    // TODO: Fix circular dependency
    // // Check for known device types
    // if (xmlObject.Equalizer) {
    //   instance.deviceType = Equalizer.fromXmlObject(xmlObject.Equalizer);
    // } else if (xmlObject.Compressor) {
    //   instance.deviceType = Compressor.fromXmlObject(xmlObject.Compressor);
    // }
    // Add other device types similarly
    // NoiseGate, Limiter, etc.

    return instance;
  }

  protected populateFromXml(xmlObject: any): void {
    super.populateFromXml(xmlObject);
    // Device type is handled in fromXmlObject
  }
}
