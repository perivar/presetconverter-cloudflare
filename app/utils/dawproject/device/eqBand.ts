import { XMLBuilder, XMLParser } from "fast-xml-parser";

import { BoolParameter } from "../boolParameter";
import { RealParameter } from "../realParameter";
import { IEqBand } from "../types";
import { Unit } from "../unit";
import { EqBandType } from "./eqBandType";

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
      // Use frequency
      obj.Band.Freq = {
        // XML tag remains Freq
        ...this.freq.toXmlObject().RealParameter, // Use frequency and assume RealParameter returns { RealParameter: ... }
        unit: Unit.HERTZ, // Using the Unit enum for frequency
      };
    }

    if (this.gain) {
      obj.Band.Gain = {
        ...this.gain.toXmlObject().RealParameter, // Assume RealParameter returns { RealParameter: ... }
        unit: Unit.DECIBEL, // Using the Unit enum for gain
      };
    }

    if (this.q) {
      obj.Band.Q = {
        ...this.q.toXmlObject().RealParameter, // Assume RealParameter returns { RealParameter: ... }
        unit: Unit.LINEAR, // Assuming Q is unitless but using a suitable enum value
      };
    }

    // Add BoolParameter element with appropriate tag
    if (this.enabled) {
      obj.Band.Enabled = this.enabled.toXmlObject().BoolParameter; // Assuming BoolParameter has toXmlObject and returns { BoolParameter: ... }
    }

    return obj;
  }

  toXml(): string {
    const builder = new XMLBuilder({ attributeNamePrefix: "" });
    return builder.build(this.toXmlObject());
  }

  static fromXmlObject(xmlObject: any): EqBand {
    // Parse specific elements Freq, Gain, and Q
    const frequency = xmlObject.Freq // Read from Freq XML tag
      ? RealParameter.fromXmlObject({ RealParameter: xmlObject.Freq }) // Assume RealParameter has fromXmlObject and returns { RealParameter: ... }
      : new RealParameter(0, Unit.HERTZ); // Provide default required value and unit

    const gain = xmlObject.Gain
      ? RealParameter.fromXmlObject({ RealParameter: xmlObject.Gain })
      : undefined;

    const q = xmlObject.Q
      ? RealParameter.fromXmlObject({ RealParameter: xmlObject.Q })
      : undefined;

    // Parse BoolParameter element
    const enabled = xmlObject.Enabled
      ? BoolParameter.fromXmlObject({ BoolParameter: xmlObject.Enabled })
      : undefined;

    // Parse attributes
    const type = xmlObject.type
      ? (xmlObject.type as EqBandType)
      : EqBandType.BELL; // Default to BELL if not specified
    const order =
      xmlObject.order !== undefined ? parseInt(xmlObject.order, 10) : undefined;

    return new EqBand(type, frequency, gain, q, enabled, order); // Pass frequency
  }

  static fromXml(xmlString: string): EqBand {
    const parser = new XMLParser({ attributeNamePrefix: "" });
    const jsonObj = parser.parse(xmlString);
    return EqBand.fromXmlObject(jsonObj.Band);
  }
}
