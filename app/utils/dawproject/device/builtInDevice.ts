import { Compressor } from "./compressor";
import { Device, IDevice } from "./device";
import { Equalizer } from "./equalizer";

// Import NoiseGate and Limiter here if they exist

export interface IBuiltInDevice extends IDevice {
  deviceType?: Equalizer | Compressor; // Add other built-in device types here
}

export abstract class BuiltInDevice extends Device implements IBuiltInDevice {
  deviceType?: Equalizer | Compressor; // Add other built-in device types here

  constructor(
    deviceType?: Equalizer | Compressor,
    name?: string,
    color?: string,
    comment?: string
  ) {
    super(
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      name,
      color,
      comment
    ); // Pass relevant args to Device constructor
    this.deviceType = deviceType;
  }

  protected getXmlAttributes(): any {
    return super.getXmlAttributes(); // Get attributes from Device
  }

  protected getXmlChildren(): any {
    const children = super.getXmlChildren(); // Get children from Device

    // Depending on the deviceType, serialize it to XML object
    if (this.deviceType) {
      // Assuming Equalizer and Compressor have toXmlObject methods
      if (this.deviceType instanceof Equalizer) {
        children.Equalizer = this.deviceType.toXmlObject();
      } else if (this.deviceType instanceof Compressor) {
        children.Compressor = this.deviceType.toXmlObject();
      }
      // Add other device types similarly
    }

    return children;
  }

  protected populateFromXml(xmlObject: any): void {
    super.populateFromXml(xmlObject); // Populate inherited attributes from Device

    // Logic to determine the actual device type from XML object
    let deviceType: Equalizer | Compressor | undefined; // Add other built-in device types here
    if (xmlObject.Equalizer) {
      deviceType = Equalizer.fromXmlObject(xmlObject.Equalizer); // Assuming Equalizer has a static fromXmlObject
    } else if (xmlObject.Compressor) {
      deviceType = Compressor.fromXmlObject(xmlObject.Compressor); // Assuming Compressor has a static fromXmlObject
    }
    // Add other device types similarly

    this.deviceType = deviceType;
  }

  // Concrete subclasses will implement their own toXmlObject and fromXmlObject methods
  abstract toXmlObject(): any;
  static fromXmlObject(xmlObject: any): BuiltInDevice {
    throw new Error("fromXmlObject must be implemented by subclasses");
  }
}
