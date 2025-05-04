import { BoolParameter } from "../boolParameter";
import { FileReference } from "../fileReference";
import { Parameter } from "../parameter";
import { RealParameter } from "../realParameter";
import { Referenceable } from "../referenceable";
import type { IDevice, IFileReference, IParameter } from "../types";
import { Unit } from "../unit";
import { DeviceRole } from "./deviceRole";

export abstract class Device extends Referenceable implements IDevice {
  enabled?: BoolParameter;
  deviceRole: DeviceRole;
  loaded?: boolean;
  deviceName: string;
  deviceID?: string;
  deviceVendor?: string;
  state?: IFileReference;
  parameters: IParameter[];

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
    comment?: string
  ) {
    super(name, color, comment);
    // Initialize required fields with defaults or placeholders
    // fromXmlObject will overwrite these with actual values from XML
    this.deviceRole = deviceRole || DeviceRole.AUDIO_FX; // Default placeholder
    this.deviceName = deviceName || ""; // Default placeholder
    this.enabled = enabled;
    this.loaded = loaded;
    this.deviceID = deviceID;
    this.deviceVendor = deviceVendor;
    this.state = state;
    this.parameters = parameters || [];
  }

  toXmlObject(): any {
    const obj: any = {};
    obj.Device = {
      ...super.toXmlObject(), // Get attributes from Referenceable
      // Add Device-specific attributes directly here
      "@_deviceRole": this.deviceRole,
      "@_deviceName": this.deviceName,
      ...(this.loaded !== undefined && { "@_loaded": this.loaded }),
      ...(this.deviceID !== undefined && { "@_deviceID": this.deviceID }),
      ...(this.deviceVendor !== undefined && {
        "@_deviceVendor": this.deviceVendor,
      }),
    };

    // Add children directly
    if (this.parameters && this.parameters.length > 0) {
      obj.Device.Parameters = this.parameters.reduce((acc: any, param) => {
        const paramObj = (param as Parameter).toXmlObject();
        const tagName = Object.keys(paramObj)[0];
        if (!acc) acc = {};
        if (!acc[tagName]) acc[tagName] = [];
        acc[tagName].push(paramObj[tagName]);
        return acc;
      }, {});
    }

    if (this.enabled !== undefined) {
      obj.Device.Enabled = this.enabled.toXmlObject().BoolParameter;
    }

    if (this.state) {
      obj.Device.State = (
        this.state as FileReference
      ).toXmlObject().FileReference;
    }

    return obj;
  }

  fromXmlObject(xmlObject: any): this {
    super.fromXmlObject(xmlObject);

    this.deviceRole = xmlObject["@_deviceRole"] as DeviceRole;
    this.deviceName = xmlObject["@_deviceName"];
    this.id = xmlObject["@_id"];
    this.loaded =
      xmlObject["@_loaded"] !== undefined
        ? String(xmlObject["@_loaded"]).toLowerCase() === "true"
        : true;
    this.deviceID = xmlObject["@_deviceID"] || undefined;
    this.deviceVendor = xmlObject["@_deviceVendor"] || undefined;

    if (xmlObject.Enabled) {
      this.enabled = new BoolParameter().fromXmlObject({
        BoolParameter: xmlObject.Enabled,
      });
    }

    if (xmlObject.State) {
      this.state = new FileReference().fromXmlObject({
        FileReference: xmlObject.State,
      });
    }

    const parameters: Parameter[] = [];
    if (xmlObject.Parameters) {
      const parameterTypeMap: { [key: string]: (obj: any) => Parameter } = {
        BoolParameter: new BoolParameter().fromXmlObject,
        RealParameter: new RealParameter().fromXmlObject,
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

    return this;
  }

  // Define a helper function to add RealParameter elements
  protected addRealParameterObject = (
    parentObj: any,
    tag: string,
    realParam?: RealParameter,
    unit?: Unit
  ) => {
    if (realParam) {
      parentObj[tag] = {
        ...realParam.toXmlObject().RealParameter,
      };
      if (unit !== undefined) {
        parentObj[tag]["@_unit"] = unit;
      }
    }
  };
}
