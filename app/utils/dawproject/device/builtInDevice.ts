import { XMLParser } from "fast-xml-parser";

import { BoolParameter } from "../boolParameter";
import { DeviceRegistry, registerDevice } from "../registry/deviceRegistry";
import type { IBuiltInDevice, IFileReference, IParameter } from "../types";
import { XML_PARSER_OPTIONS } from "../xml/options";
import { Device } from "./device";
import { DeviceRole } from "./deviceRole";

@registerDevice("BuiltinDevice")
export class BuiltInDevice extends Device implements IBuiltInDevice {
  deviceType?: Device;

  constructor(
    deviceRole: DeviceRole,
    deviceName: string,
    deviceType?: Device,
    enabled?: BoolParameter,
    loaded: boolean = true,
    deviceID?: string,
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
      deviceID,
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
    const parser = new XMLParser(XML_PARSER_OPTIONS);
    const jsonObj = parser.parse(xmlString);
    return BuiltInDevice.fromXmlObject(jsonObj.BuiltinDevice);
  }

  static fromXmlObject(xmlObject: any): BuiltInDevice {
    const instance = new BuiltInDevice(
      xmlObject.deviceRole as DeviceRole,
      xmlObject.deviceName
    );
    instance.populateFromXml(xmlObject);

    // Handle device type using the registry
    for (const tagName in xmlObject) {
      const DeviceClass = DeviceRegistry.getDeviceClass(tagName);
      if (DeviceClass) {
        try {
          instance.deviceType = DeviceClass.fromXmlObject(xmlObject[tagName]);
          break; // We found and processed the device type
        } catch (e) {
          console.error(`Error deserializing device type ${tagName}:`, e);
        }
      }
    }

    return instance;
  }

  protected populateFromXml(xmlObject: any): void {
    super.populateFromXml(xmlObject);
    // Device type is handled in fromXmlObject
  }
}
