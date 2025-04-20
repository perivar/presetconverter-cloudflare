import { BoolParameter, IBoolParameter } from "../boolParameter";
import { FileReference, IFileReference } from "../fileReference";
import { IParameter, Parameter } from "../parameter";
import { IReferenceable, Referenceable } from "../referenceable";
import { DeviceRole } from "./deviceRole";

export interface IDevice extends IReferenceable {
  enabled?: IBoolParameter;
  deviceRole?: DeviceRole;
  loaded?: boolean;
  deviceName?: string;
  deviceId?: string;
  deviceVendor?: string;
  state?: IFileReference;
  automatedParameters?: IParameter[];
}

export abstract class Device extends Referenceable implements IDevice {
  enabled?: BoolParameter;
  deviceRole?: DeviceRole;
  loaded?: boolean;
  deviceName?: string;
  deviceId?: string;
  deviceVendor?: string;
  state?: FileReference;
  automatedParameters?: Parameter[];

  constructor(
    enabled?: BoolParameter,
    deviceRole?: DeviceRole,
    loaded: boolean = true,
    deviceName?: string,
    deviceId?: string,
    deviceVendor?: string,
    state?: FileReference,
    automatedParameters?: Parameter[],
    name?: string,
    color?: string,
    comment?: string
  ) {
    super(name, color, comment);
    this.enabled = enabled;
    this.deviceRole = deviceRole;
    this.loaded = loaded;
    this.deviceName = deviceName;
    this.deviceId = deviceId;
    this.deviceVendor = deviceVendor;
    this.state = state;
    this.automatedParameters = automatedParameters || [];
  }

  protected getXmlAttributes(): any {
    const attributes = super.getXmlAttributes(); // Get attributes from Referenceable

    if (this.deviceRole !== undefined) {
      attributes.deviceRole = this.deviceRole;
    }
    if (this.loaded !== undefined) {
      attributes.loaded = this.loaded;
    }
    if (this.deviceName !== undefined) {
      attributes.deviceName = this.deviceName;
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

    if (this.automatedParameters && this.automatedParameters.length > 0) {
      children.Parameters = {
        Parameter: this.automatedParameters.map(param => param.toXmlObject()), // Assuming Parameter subclasses have toXmlObject
      };
    }

    if (this.enabled !== undefined) {
      children.Enabled = this.enabled?.toXmlObject(); // Assuming BoolParameter has toXmlObject
    }

    if (this.state) {
      children.State = this.state.toXmlObject(); // Assuming FileReference has toXmlObject
    }

    return children;
  }

  protected populateFromXml(xmlObject: any): void {
    super.populateFromXml(xmlObject); // Populate inherited attributes from Referenceable

    this.deviceRole = xmlObject.deviceRole
      ? (xmlObject.deviceRole as DeviceRole)
      : undefined; // Cast string to DeviceRole
    this.loaded =
      xmlObject.loaded !== undefined
        ? String(xmlObject.loaded).toLowerCase() === "true"
        : true;
    this.deviceName = xmlObject.deviceName || undefined;
    this.deviceId = xmlObject.deviceID || undefined;
    this.deviceVendor = xmlObject.deviceVendor || undefined;

    if (xmlObject.Enabled) {
      this.enabled = BoolParameter.fromXmlObject(xmlObject.Enabled); // Assuming BoolParameter has fromXmlObject
    }

    if (xmlObject.State) {
      this.state = FileReference.fromXmlObject(xmlObject.State); // Assuming FileReference has fromXmlObject
    }

    const automatedParameters: Parameter[] = [];
    if (xmlObject.Parameters && xmlObject.Parameters.Parameter) {
      // This part needs a mechanism to determine the correct subclass of Parameter
      // For now, we'll skip deserialization of nested parameters
      console.warn(
        `Skipping deserialization of nested parameter elements in Device`
      );
    }
    this.automatedParameters = automatedParameters;
  }

  // Concrete subclasses will implement their own toXmlObject and fromXmlObject methods
  abstract toXmlObject(): any;
  static fromXmlObject(xmlObject: any): Device {
    throw new Error("fromXmlObject must be implemented by subclasses");
  }
}
