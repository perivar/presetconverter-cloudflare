import { XMLBuilder, XMLParser } from "fast-xml-parser";

import { IRealParameter, RealParameter } from "../realParameter";
import { Unit } from "../unit";
import { BuiltInDevice, IBuiltInDevice } from "./builtInDevice";
import { DeviceRole } from "./deviceRole";
import { EqBand, IEqBand } from "./eqBand";

export interface IEqualizer extends IBuiltInDevice {
  bands: IEqBand[];
  inputGain?: IRealParameter;
  outputGain?: IRealParameter;
}

export class Equalizer extends BuiltInDevice implements IEqualizer {
  bands: EqBand[];
  inputGain?: RealParameter;
  outputGain?: RealParameter;

  constructor(
    deviceName?: string,
    deviceRole?: DeviceRole,
    bands?: EqBand[],
    inputGain?: RealParameter,
    outputGain?: RealParameter,
    name?: string,
    color?: string,
    comment?: string
  ) {
    super(undefined, name, color, comment); // Pass relevant args to BuiltInDevice constructor
    // deviceName and deviceRole are handled in the Device constructor
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
      obj.Equalizer.Band = this.bands.map(band => band.toXmlObject()); // Assuming EqBand has toXmlObject
    }

    // Add InputGain as a child element with the unit attribute
    if (this.inputGain) {
      obj.Equalizer.InputGain = {
        ...this.inputGain.toXmlObject(), // Assuming RealParameter has toXmlObject
        unit: Unit.DECIBEL, // Assuming the unit for InputGain is in decibels
      };
    }

    // Add OutputGain as a child element with the unit attribute
    if (this.outputGain) {
      obj.Equalizer.OutputGain = {
        ...this.outputGain.toXmlObject(), // Assuming RealParameter has toXmlObject
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
    const instance = new Equalizer(); // Create instance
    instance.populateFromXml(xmlObject); // Populate inherited attributes from BuiltInDevice

    const bands: EqBand[] = [];
    if (xmlObject.Band) {
      // Handle single or multiple bands
      const bandArray = Array.isArray(xmlObject.Band)
        ? xmlObject.Band
        : [xmlObject.Band];
      bandArray.forEach((bandObj: any) => {
        bands.push(EqBand.fromXmlObject(bandObj)); // Assuming EqBand has fromXmlObject
      });
    }
    instance.bands = bands;

    // Extract the RealParameter from the InputGain and OutputGain elements
    if (xmlObject.InputGain) {
      instance.inputGain = RealParameter.fromXmlObject(xmlObject.InputGain); // Assuming RealParameter has fromXmlObject
    }

    if (xmlObject.OutputGain) {
      instance.outputGain = RealParameter.fromXmlObject(xmlObject.OutputGain); // Assuming RealParameter has fromXmlObject
    }

    return instance;
  }

  static fromXml(xmlString: string): Equalizer {
    const parser = new XMLParser({ attributeNamePrefix: "" });
    const jsonObj = parser.parse(xmlString);
    return Equalizer.fromXmlObject(jsonObj.Equalizer);
  }
}
