import { XMLBuilder, XMLParser } from "fast-xml-parser";

import { BoolParameter } from "../boolParameter";
import { FileReference } from "../fileReference";
import { Parameter } from "../parameter";
import { RealParameter } from "../realParameter";
import { Referenceable } from "../referenceable";
import type { IDevice, IFileReference, IParameter } from "../types";
import { DeviceRole } from "./deviceRole";

export interface DeviceConstructor {
  new (...args: any[]): Device;
  fromXmlObject(xmlObject: any): Device;
}

export abstract class Device extends Referenceable implements IDevice {
  enabled?: BoolParameter;
  deviceRole: DeviceRole;
  loaded?: boolean;
  deviceName: string;
  deviceId?: string;
  deviceVendor?: string;
  state?: IFileReference;
  parameters: IParameter[];

  constructor(
    deviceRole: DeviceRole,
    deviceName: string,
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
    super(name, color, comment);
    this.deviceRole = deviceRole;
    this.deviceName = deviceName;
    this.enabled = enabled;
    this.loaded = loaded;
    this.deviceId = deviceId;
    this.deviceVendor = deviceVendor;
    this.state = state;
    this.parameters = parameters || [];
  }

  protected getXmlAttributes(): any {
    const attributes = super.getXmlAttributes(); // Get attributes from Referenceable

    attributes.deviceRole = this.deviceRole;
    attributes.deviceName = this.deviceName;

    if (this.loaded !== undefined) {
      attributes.loaded = this.loaded;
    }
    if (this.deviceId !== undefined) {
      attributes.deviceID = this.deviceId;
    }
    if (this.deviceVendor !== undefined) {
      attributes.deviceVendor = this.deviceVendor;
    }

    return attributes;
  }

  protected getXmlChildren(): any {
    const children: any = {};

    if (this.parameters && this.parameters.length > 0) {
      children.Parameters = this.parameters.reduce((acc: any, param) => {
        const paramObj = (param as Parameter).toXmlObject();
        const tagName = Object.keys(paramObj)[0];
        if (!acc) acc = {};
        if (!acc[tagName]) acc[tagName] = [];
        acc[tagName].push(paramObj[tagName]);
        return acc;
      }, {});
    }

    if (this.enabled !== undefined) {
      children.Enabled = this.enabled.toXmlObject().BoolParameter;
    }

    if (this.state) {
      children.State = (
        this.state as FileReference
      ).toXmlObject().FileReference;
    }

    return children;
  }

  protected populateFromXml(xmlObject: any): void {
    super.populateFromXml(xmlObject);

    this.deviceRole = xmlObject.deviceRole as DeviceRole;
    this.deviceName = xmlObject.deviceName;
    this.id = xmlObject.id;
    this.loaded =
      xmlObject.loaded !== undefined
        ? String(xmlObject.loaded).toLowerCase() === "true"
        : true;
    this.deviceId = xmlObject.deviceID || undefined;
    this.deviceVendor = xmlObject.deviceVendor || undefined;

    if (xmlObject.Enabled) {
      this.enabled = BoolParameter.fromXmlObject({
        BoolParameter: xmlObject.Enabled,
      });
    }

    if (xmlObject.State) {
      this.state = FileReference.fromXmlObject({
        FileReference: xmlObject.State,
      });
    }

    const parameters: Parameter[] = [];
    if (xmlObject.Parameters) {
      const parameterTypeMap: { [key: string]: (obj: any) => Parameter } = {
        BoolParameter: BoolParameter.fromXmlObject,
        RealParameter: RealParameter.fromXmlObject,
      };

      for (const tagName in xmlObject.Parameters) {
        if (parameterTypeMap[tagName]) {
          const parameterData = xmlObject.Parameters[tagName];
          const parameterArray = Array.isArray(parameterData)
            ? parameterData
            : [parameterData];
          parameterArray.forEach((paramObj: any) => {
            try {
              parameters.push(parameterTypeMap[tagName](paramObj));
            } catch (e) {
              console.error(
                `Error deserializing nested parameter element ${tagName} in Device:`,
                e
              );
            }
          });
        } else {
          console.warn(
            `Skipping deserialization of unknown nested parameter element in Device: ${tagName}`
          );
        }
      }
    }
    this.parameters = parameters;
  }

  toXmlObject(): any {
    const obj: any = {};
    obj.Device = {
      ...this.getXmlAttributes(),
      ...this.getXmlChildren(),
    };
    return obj;
  }

  toXml(): string {
    const builder = new XMLBuilder({ attributeNamePrefix: "" });
    return builder.build(this.toXmlObject());
  }

  static fromXml(xmlString: string): Device {
    const parser = new XMLParser({ attributeNamePrefix: "" });
    const jsonObj = parser.parse(xmlString);
    return Device.fromXmlObject(jsonObj.Device);
  }

  static fromXmlObject(xmlObject: any): Device {
    const instance = new (this as any)();
    instance.populateFromXml(xmlObject);
    return instance;
  }
}
