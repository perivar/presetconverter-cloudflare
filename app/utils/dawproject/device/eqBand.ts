import { XMLBuilder, XMLParser } from "fast-xml-parser";

import { BoolParameter, IBoolParameter } from "../boolParameter";
import { IRealParameter, RealParameter } from "../realParameter";
import { Unit } from "../unit";
import { EqBandType } from "./eqBandType";

export interface IEqBand {
  freq: IRealParameter;
  gain?: IRealParameter;
  q?: IRealParameter;
  enabled?: IBoolParameter;
  type: EqBandType;
  order?: number;
}

export class EqBand implements IEqBand {
  freq: RealParameter;
  gain?: RealParameter;
  q?: RealParameter;
  enabled?: BoolParameter;
  type: EqBandType;
  order?: number;

  constructor(
    type: EqBandType,
    freq: RealParameter,
    gain?: RealParameter,
    q?: RealParameter,
    enabled?: BoolParameter,
    order?: number
  ) {
    this.type = type;
    this.freq = freq;
    this.gain = gain;
    this.q = q;
    this.enabled = enabled;
    this.order = order;
  }

  toXmlObject(): any {
    const obj: any = {
      Band: {
        type: this.type,
      },
    };

    if (this.order !== undefined) {
      obj.Band.order = this.order;
    }

    // Create specific elements for Freq, Gain, and Q with the required unit attribute from the Unit enum
    if (this.freq) {
      obj.Band.Freq = {
        ...this.freq.toXmlObject(), // Assuming RealParameter has toXmlObject
        unit: Unit.HERTZ, // Using the Unit enum for frequency
      };
    }

    if (this.gain) {
      obj.Band.Gain = {
        ...this.gain.toXmlObject(), // Assuming RealParameter has toXmlObject
        unit: Unit.DECIBEL, // Using the Unit enum for gain
      };
    }

    if (this.q) {
      obj.Band.Q = {
        ...this.q.toXmlObject(), // Assuming RealParameter has toXmlObject
        unit: Unit.LINEAR, // Assuming Q is unitless but using a suitable enum value
      };
    }

    // Add BoolParameter element with appropriate tag
    if (this.enabled) {
      obj.Band.Enabled = this.enabled.toXmlObject(); // Assuming BoolParameter has toXmlObject
    }

    return obj;
  }

  toXml(): string {
    const builder = new XMLBuilder({ attributeNamePrefix: "" });
    return builder.build(this.toXmlObject());
  }

  static fromXmlObject(xmlObject: any): EqBand {
    // Parse specific elements Freq, Gain, and Q
    const freq = xmlObject.Freq
      ? RealParameter.fromXmlObject(xmlObject.Freq)
      : new RealParameter(); // Assuming RealParameter has fromXmlObject

    const gain = xmlObject.Gain
      ? RealParameter.fromXmlObject(xmlObject.Gain)
      : undefined;

    const q = xmlObject.Q
      ? RealParameter.fromXmlObject(xmlObject.Q)
      : undefined;

    // Parse BoolParameter element
    const enabled = xmlObject.Enabled
      ? BoolParameter.fromXmlObject(xmlObject.Enabled)
      : undefined;

    // Parse attributes
    const type = xmlObject.type
      ? (xmlObject.type as EqBandType)
      : EqBandType.BELL; // Default to BELL if not specified
    const order =
      xmlObject.order !== undefined ? parseInt(xmlObject.order, 10) : undefined;

    return new EqBand(type, freq, gain, q, enabled, order);
  }

  static fromXml(xmlString: string): EqBand {
    const parser = new XMLParser({ attributeNamePrefix: "" });
    const jsonObj = parser.parse(xmlString);
    return EqBand.fromXmlObject(jsonObj.Band);
  }
}
