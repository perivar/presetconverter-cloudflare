import { BoolParameter } from "../boolParameter";
import { FileReference } from "../fileReference";
import { Parameter } from "../parameter";
import { Referenceable } from "../referenceable";
import { IDevice, IFileReference, IParameter } from "../types";
import { DeviceRole } from "./deviceRole";

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
      children.Parameters = {
        // Need to handle different types of Parameter subclasses
        ...this.parameters.reduce((acc: any, param) => {
          const paramObj = (param as Parameter).toXmlObject();
          const tagName = Object.keys(paramObj)[0]; // Get the root tag name from the object
          if (!acc[tagName]) {
            acc[tagName] = [];
          }
          acc[tagName].push(paramObj[tagName]);
          return acc;
        }, {}),
      };
    }

    if (this.enabled !== undefined) {
      children.Enabled = this.enabled?.toXmlObject().BoolParameter; // Assuming BoolParameter has toXmlObject and returns { BoolParameter: ... }
    }

    if (this.state) {
      children.State = (
        this.state as FileReference
      ).toXmlObject().FileReference; // Assuming FileReference has toXmlObject and returns { FileReference: ... }
    }

    return children;
  }

  protected populateFromXml(xmlObject: any): void {
    super.populateFromXml(xmlObject); // Populate inherited attributes from Referenceable

    this.deviceRole = xmlObject.deviceRole as DeviceRole; // Cast string to DeviceRole
    this.deviceName = xmlObject.deviceName;
    this.loaded =
      xmlObject.loaded !== undefined
        ? String(xmlObject.loaded).toLowerCase() === "true"
        : true;
    this.deviceId = xmlObject.deviceID || undefined;
    this.deviceVendor = xmlObject.deviceVendor || undefined;

    if (xmlObject.Enabled) {
      this.enabled = BoolParameter.fromXmlObject({
        BoolParameter: xmlObject.Enabled,
      }); // Wrap in expected structure
    }

    if (xmlObject.State) {
      this.state = FileReference.fromXmlObject({
        FileReference: xmlObject.State,
      }); // Wrap in expected structure
    }

    const parameters: Parameter[] = [];
    if (xmlObject.Parameters) {
      // Need a mechanism to determine the correct subclass of Parameter
      // based on the XML element tag (e.g., RealParameter, BoolParameter, etc.)
      const parameterTypeMap: { [key: string]: (obj: any) => Parameter } = {
        // Return type is concrete Parameter
        BoolParameter: BoolParameter.fromXmlObject,
        RealParameter: Parameter.fromXmlObject, // Assuming a generic fromXmlObject for now
        // Add other concrete Parameter subclasses here
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

  // Concrete subclasses will implement their own toXmlObject and fromXmlObject methods
  abstract toXmlObject(): any;
  static fromXmlObject(xmlObject: any): Device {
    throw new Error("fromXmlObject must be implemented by subclasses");
  }
}
