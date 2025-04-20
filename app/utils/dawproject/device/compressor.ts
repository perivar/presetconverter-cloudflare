import { XMLBuilder, XMLParser } from "fast-xml-parser";

import { BoolParameter } from "../boolParameter";
import { RealParameter } from "../realParameter";
import type { ICompressor, IFileReference, IParameter } from "../types";
import { Unit } from "../unit";
import { BuiltInDevice } from "./builtInDevice";
import { DeviceRole } from "./deviceRole";

export class Compressor extends BuiltInDevice implements ICompressor {
  threshold?: RealParameter;
  ratio?: RealParameter;
  attack?: RealParameter;
  release?: RealParameter;
  inputGain?: RealParameter;
  outputGain?: RealParameter;
  autoMakeup?: BoolParameter;

  constructor(
    deviceRole: DeviceRole,
    deviceName: string,
    threshold?: RealParameter,
    ratio?: RealParameter,
    attack?: RealParameter,
    release?: RealParameter,
    inputGain?: RealParameter,
    outputGain?: RealParameter,
    autoMakeup?: BoolParameter,
    enabled?: BoolParameter,
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
      enabled,
      loaded,
      deviceId,
      deviceVendor,
      state,
      parameters,
      name,
      color,
      comment
    ); // Pass relevant args to BuiltInDevice constructor
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
          ...realParam.toXmlObject().RealParameter, // Assuming RealParameter has toXmlObject and returns { RealParameter: ... }
        };
        if (unit !== undefined) {
          parentObj[tag].unit = unit;
        }
      }
    };

    addRealParameterObject(obj.Compressor, "Attack", this.attack, Unit.SECONDS);
    // Add BoolParameter element with appropriate tag
    if (this.autoMakeup) {
      obj.Compressor.AutoMakeup = this.autoMakeup.toXmlObject().BoolParameter; // Assuming BoolParameter has toXmlObject and returns { BoolParameter: ... }
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
    // Extract required deviceRole and deviceName from xmlObject
    const deviceRole = xmlObject.deviceRole as DeviceRole;
    const deviceName = xmlObject.deviceName as string;

    const instance = new Compressor(deviceRole, deviceName); // Create instance with required properties
    instance.populateFromXml(xmlObject); // Populate inherited attributes from BuiltInDevice

    if (xmlObject.Threshold) {
      instance.threshold = RealParameter.fromXmlObject({
        RealParameter: xmlObject.Threshold,
      }); // Assuming RealParameter has fromXmlObject and returns { RealParameter: ... }
    }

    if (xmlObject.Ratio) {
      instance.ratio = RealParameter.fromXmlObject({
        RealParameter: xmlObject.Ratio,
      });
    }

    if (xmlObject.Attack) {
      instance.attack = RealParameter.fromXmlObject({
        RealParameter: xmlObject.Attack,
      });
    }

    if (xmlObject.Release) {
      instance.release = RealParameter.fromXmlObject({
        RealParameter: xmlObject.Release,
      });
    }

    if (xmlObject.InputGain) {
      instance.inputGain = RealParameter.fromXmlObject({
        RealParameter: xmlObject.InputGain,
      });
    }

    if (xmlObject.OutputGain) {
      instance.outputGain = RealParameter.fromXmlObject({
        RealParameter: xmlObject.OutputGain,
      });
    }

    if (xmlObject.AutoMakeup) {
      instance.autoMakeup = BoolParameter.fromXmlObject({
        BoolParameter: xmlObject.AutoMakeup,
      }); // Assuming BoolParameter has fromXmlObject and returns { BoolParameter: ... }
    }

    return instance;
  }

  static fromXml(xmlString: string): Compressor {
    const parser = new XMLParser({ attributeNamePrefix: "" });
    const jsonObj = parser.parse(xmlString);
    return Compressor.fromXmlObject(jsonObj.Compressor);
  }
}
