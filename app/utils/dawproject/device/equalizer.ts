import { XMLBuilder, XMLParser } from "fast-xml-parser";

import { BoolParameter } from "../boolParameter"; // Import BoolParameter
import { RealParameter } from "../realParameter";
import { IEqualizer, IFileReference, IParameter } from "../types";
import { Unit } from "../unit";
import { BuiltInDevice } from "./builtInDevice";
import { DeviceRole } from "./deviceRole";
import { EqBand } from "./eqBand";

export class Equalizer extends BuiltInDevice implements IEqualizer {
  bands: EqBand[];
  inputGain?: RealParameter;
  outputGain?: RealParameter;

  constructor(
    deviceRole: DeviceRole, // Add required deviceRole
    deviceName: string, // Add required deviceName
    bands?: EqBand[],
    inputGain?: RealParameter,
    outputGain?: RealParameter,
    enabled?: BoolParameter, // Change type to BoolParameter
    loaded?: boolean,
    deviceId?: string,
    deviceVendor?: string,
    state?: IFileReference,
    parameters?: IParameter[],
    name?: string,
    color?: string,
    comment?: string
  ) {
    super(
      deviceRole, // Pass required deviceRole
      deviceName, // Pass required deviceName
      undefined, // deviceType is handled by the class name
      enabled, // Pass BoolParameter directly
      loaded,
      deviceId,
      deviceVendor,
      state,
      parameters,
      name,
      color,
      comment
    ); // Pass relevant args to BuiltInDevice constructor
    this.bands = bands || [];
    this.inputGain = inputGain;
    this.outputGain = outputGain;
  }

  toXmlObject(): any {
    const obj: any = {
      Equalizer: {
        ...super.getXmlAttributes(), // Get attributes from BuiltInDevice
        ...super.getXmlChildren(), // Get children from BuiltInDevice
      },
    };

    // Add bands as child elements
    if (this.bands && this.bands.length > 0) {
      obj.Equalizer.Band = this.bands.map(band => band.toXmlObject().Band); // Assuming EqBand has toXmlObject and returns { Band: ... }
    }

    // Add InputGain as a child element with the unit attribute
    if (this.inputGain) {
      obj.Equalizer.InputGain = {
        ...this.inputGain.toXmlObject().RealParameter, // Assuming RealParameter has toXmlObject and returns { RealParameter: ... }
        unit: Unit.DECIBEL, // Assuming the unit for InputGain is in decibels
      };
    }

    // Add OutputGain as a child element with the unit attribute
    if (this.outputGain) {
      obj.Equalizer.OutputGain = {
        ...this.outputGain.toXmlObject().RealParameter, // Assuming RealParameter has toXmlObject and returns { RealParameter: ... }
        unit: Unit.DECIBEL, // Assuming the unit for OutputGain is in decibels
      };
    }

    return obj;
  }

  toXml(): string {
    const builder = new XMLBuilder({ attributeNamePrefix: "" });
    return builder.build(this.toXmlObject());
  }

  static fromXmlObject(xmlObject: any): Equalizer {
    // Extract required deviceRole and deviceName from xmlObject
    const deviceRole = xmlObject.deviceRole as DeviceRole;
    const deviceName = xmlObject.deviceName as string;

    const instance = new Equalizer(deviceRole, deviceName); // Create instance with required properties
    instance.populateFromXml(xmlObject); // Populate inherited attributes from BuiltInDevice

    const bands: EqBand[] = [];
    if (xmlObject.Band) {
      // Handle single or multiple bands
      const bandArray = Array.isArray(xmlObject.Band)
        ? xmlObject.Band
        : [xmlObject.Band];
      bandArray.forEach((bandObj: any) => {
        bands.push(EqBand.fromXmlObject({ Band: bandObj })); // Assuming EqBand has fromXmlObject and returns { Band: ... }
      });
    }
    instance.bands = bands;

    // Extract the RealParameter from the InputGain and OutputGain elements
    if (xmlObject.InputGain) {
      instance.inputGain = RealParameter.fromXmlObject({
        RealParameter: xmlObject.InputGain,
      }); // Assuming RealParameter has fromXmlObject and returns { RealParameter: ... }
    }

    if (xmlObject.OutputGain) {
      instance.outputGain = RealParameter.fromXmlObject({
        RealParameter: xmlObject.OutputGain,
      }); // Assuming RealParameter has fromXmlObject and returns { RealParameter: ... }
    }

    return instance;
  }

  static fromXml(xmlString: string): Equalizer {
    const parser = new XMLParser({ attributeNamePrefix: "" });
    const jsonObj = parser.parse(xmlString);
    return Equalizer.fromXmlObject(jsonObj.Equalizer);
  }
}
