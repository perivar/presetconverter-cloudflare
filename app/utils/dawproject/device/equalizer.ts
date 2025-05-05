import { BoolParameter } from "../boolParameter"; // Import BoolParameter
import { RealParameter } from "../realParameter";
import { registerDevice } from "../registry/deviceRegistry";
import type { IEqualizer, IFileReference, IParameter } from "../types";
import { Unit } from "../unit";
import { BuiltInDevice } from "./builtInDevice";
import { DeviceRole } from "./deviceRole";
import { EqBand } from "./eqBand";

const equalizerFactory = (xmlObject: any): Equalizer => {
  const instance = new Equalizer();
  instance.fromXmlObject(xmlObject);
  return instance;
};

@registerDevice("Equalizer", equalizerFactory)
export class Equalizer extends BuiltInDevice implements IEqualizer {
  bands: EqBand[];
  inputGain?: RealParameter;
  outputGain?: RealParameter;

  constructor(
    // Make required fields optional for deserialization, provide defaults
    deviceRole?: DeviceRole,
    deviceName?: string,
    bands?: EqBand[],
    inputGain?: RealParameter,
    outputGain?: RealParameter,
    enabled?: BoolParameter, // Change type to BoolParameter
    loaded?: boolean,
    deviceID?: string,
    deviceVendor?: string,
    state?: IFileReference,
    parameters?: IParameter[],
    name?: string,
    color?: string,
    comment?: string
  ) {
    // Provide default placeholders for required fields
    super(
      deviceRole || DeviceRole.AUDIO_FX, // Default placeholder
      deviceName || "", // Default placeholder
      undefined, // deviceType is handled by the class name
      enabled, // Pass BoolParameter directly
      loaded,
      deviceID,
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
        ...super.toXmlObject().BuiltinDevice, // Get attributes and children from BuiltInDevice's toXmlObject
      },
    };

    // Add bands as child elements directly
    if (this.bands && this.bands.length > 0) {
      obj.Equalizer.Band = this.bands.map(band => band.toXmlObject().Band);
    }

    // Add InputGain as a child element directly with the unit attribute
    if (this.inputGain) {
      obj.Equalizer.InputGain = {
        ...this.inputGain.toXmlObject().RealParameter,
        ["@_unit"]: Unit.DECIBEL,
      };
    }

    // Add OutputGain as a child element directly with the unit attribute
    if (this.outputGain) {
      obj.Equalizer.OutputGain = {
        ...this.outputGain.toXmlObject().RealParameter,
        ["@_unit"]: Unit.DECIBEL,
      };
    }

    return obj;
  }

  fromXmlObject(xmlObject: any): this {
    super.fromXmlObject(xmlObject); // Populate inherited attributes from BuiltInDevice

    const bands: EqBand[] = [];
    if (xmlObject.Band) {
      // Handle single or multiple bands
      const bandArray = Array.isArray(xmlObject.Band)
        ? xmlObject.Band
        : [xmlObject.Band];
      bandArray.forEach((bandObj: any) => {
        bands.push(new EqBand().fromXmlObject(bandObj));
      });
    }
    this.bands = bands;

    // Extract the RealParameter from the InputGain and OutputGain elements
    if (xmlObject.InputGain) {
      this.inputGain = new RealParameter().fromXmlObject(xmlObject.InputGain);
    }

    if (xmlObject.OutputGain) {
      this.outputGain = new RealParameter().fromXmlObject(xmlObject.OutputGain);
    }

    return this;
  }
}
