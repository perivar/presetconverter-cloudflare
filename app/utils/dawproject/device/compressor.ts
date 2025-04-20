import { XMLBuilder, XMLParser } from "fast-xml-parser";

import { BoolParameter, IBoolParameter } from "../boolParameter";
import { IRealParameter, RealParameter } from "../realParameter";
import { Unit } from "../unit";
import { BuiltInDevice, IBuiltInDevice } from "./builtInDevice";
import { DeviceRole } from "./deviceRole";

export interface ICompressor extends IBuiltInDevice {
  threshold?: IRealParameter;
  ratio?: IRealParameter;
  attack?: IRealParameter;
  release?: IRealParameter;
  inputGain?: IRealParameter;
  outputGain?: IRealParameter;
  autoMakeup?: IBoolParameter;
}

export class Compressor extends BuiltInDevice implements ICompressor {
  threshold?: RealParameter;
  ratio?: RealParameter;
  attack?: RealParameter;
  release?: RealParameter;
  inputGain?: RealParameter;
  outputGain?: RealParameter;
  autoMakeup?: BoolParameter;

  constructor(
    deviceName?: string,
    deviceRole?: DeviceRole,
    threshold?: RealParameter,
    ratio?: RealParameter,
    attack?: RealParameter,
    release?: RealParameter,
    inputGain?: RealParameter,
    outputGain?: RealParameter,
    autoMakeup?: BoolParameter,
    name?: string,
    color?: string,
    comment?: string
  ) {
    super(undefined, name, color, comment); // Pass relevant args to BuiltInDevice constructor
    // deviceName and deviceRole are handled in the Device constructor
    this.threshold = threshold;
    this.ratio = ratio;
    this.attack = attack;
    this.release = release;
    this.inputGain = inputGain;
    this.outputGain = outputGain;
    this.autoMakeup = autoMakeup;
  }

  toXmlObject(): any {
    const obj: any = {
      Compressor: {
        ...super.getXmlAttributes(), // Get attributes from BuiltInDevice
        ...super.getXmlChildren(), // Get children from BuiltInDevice
      },
    };

    // Define a helper function to add RealParameter elements
    const addRealParameterObject = (
      parentObj: any,
      tag: string,
      realParam?: RealParameter,
      unit?: Unit
    ) => {
      if (realParam) {
        parentObj[tag] = {
          ...realParam.toXmlObject(), // Assuming RealParameter has toXmlObject
        };
        if (unit !== undefined) {
          parentObj[tag].unit = unit;
        }
      }
    };

    addRealParameterObject(obj.Compressor, "Attack", this.attack, Unit.SECONDS);
    // Add BoolParameter element with appropriate tag
    if (this.autoMakeup) {
      obj.Compressor.AutoMakeup = this.autoMakeup.toXmlObject(); // Assuming BoolParameter has toXmlObject
    }

    addRealParameterObject(
      obj.Compressor,
      "InputGain",
      this.inputGain,
      Unit.DECIBEL
    );
    addRealParameterObject(
      obj.Compressor,
      "OutputGain",
      this.outputGain,
      Unit.DECIBEL
    );
    addRealParameterObject(obj.Compressor, "Ratio", this.ratio, Unit.PERCENT);
    addRealParameterObject(
      obj.Compressor,
      "Release",
      this.release,
      Unit.SECONDS
    );
    addRealParameterObject(
      obj.Compressor,
      "Threshold",
      this.threshold,
      Unit.DECIBEL
    );

    return obj;
  }

  toXml(): string {
    const builder = new XMLBuilder({ attributeNamePrefix: "" });
    return builder.build(this.toXmlObject());
  }

  static fromXmlObject(xmlObject: any): Compressor {
    const instance = new Compressor(); // Create instance
    instance.populateFromXml(xmlObject); // Populate inherited attributes from BuiltInDevice

    if (xmlObject.Threshold) {
      instance.threshold = RealParameter.fromXmlObject(xmlObject.Threshold); // Assuming RealParameter has fromXmlObject
    }

    if (xmlObject.Ratio) {
      instance.ratio = RealParameter.fromXmlObject(xmlObject.Ratio);
    }

    if (xmlObject.Attack) {
      instance.attack = RealParameter.fromXmlObject(xmlObject.Attack);
    }

    if (xmlObject.Release) {
      instance.release = RealParameter.fromXmlObject(xmlObject.Release);
    }

    if (xmlObject.InputGain) {
      instance.inputGain = RealParameter.fromXmlObject(xmlObject.InputGain);
    }

    if (xmlObject.OutputGain) {
      instance.outputGain = RealParameter.fromXmlObject(xmlObject.OutputGain);
    }

    if (xmlObject.AutoMakeup) {
      instance.autoMakeup = BoolParameter.fromXmlObject(xmlObject.AutoMakeup); // Assuming BoolParameter has fromXmlObject
    }

    return instance;
  }

  static fromXml(xmlString: string): Compressor {
    const parser = new XMLParser({ attributeNamePrefix: "" });
    const jsonObj = parser.parse(xmlString);
    return Compressor.fromXmlObject(jsonObj.Compressor);
  }
}
