import { BoolParameter } from "../boolParameter";
import { RealParameter } from "../realParameter";
import type { IEqBand } from "../types";
import { Unit } from "../unit";
import { XmlObject } from "../XmlObject";
import { EqBandType } from "./eqBandType";

export class EqBand extends XmlObject implements IEqBand {
  freq: RealParameter;
  gain?: RealParameter;
  q?: RealParameter;
  enabled?: BoolParameter;
  type: EqBandType;
  order?: number;

  constructor(
    // Make required fields optional for deserialization, provide defaults
    type?: EqBandType,
    freq?: RealParameter,
    gain?: RealParameter,
    q?: RealParameter,
    enabled?: BoolParameter,
    order?: number
  ) {
    super();
    // Provide default placeholders for required fields
    this.type = type || EqBandType.BELL; // Default placeholder
    this.freq = freq || new RealParameter(0, Unit.HERTZ); // Default placeholder
    this.gain = gain;
    this.q = q;
    this.enabled = enabled;
    this.order = order;
  }

  toXmlObject(): any {
    const obj: any = {
      Band: {
        "@_type": this.type,
      },
    };

    if (this.order !== undefined) {
      obj.Band["@_order"] = this.order;
    }

    if (this.freq) {
      obj.Band.Freq = {
        ...this.freq.toXmlObject().RealParameter,
        "@_unit": Unit.HERTZ,
      };
    }

    if (this.gain) {
      obj.Band.Gain = {
        ...this.gain.toXmlObject().RealParameter,
        "@_unit": Unit.DECIBEL,
      };
    }

    if (this.q) {
      obj.Band.Q = {
        ...this.q.toXmlObject().RealParameter,
        "@_unit": Unit.LINEAR,
      };
    }

    if (this.enabled) {
      obj.Band.Enabled = this.enabled.toXmlObject().BoolParameter;
    }

    return obj;
  }

  fromXmlObject(xmlObject: any): this {
    // Parse specific elements Freq, Gain, and Q
    if (xmlObject.Freq) {
      this.freq = new RealParameter().fromXmlObject(xmlObject.Freq);
    }

    if (xmlObject.Gain) {
      this.gain = new RealParameter().fromXmlObject(xmlObject.Gain);
    }

    if (xmlObject.Q) {
      this.q = new RealParameter().fromXmlObject(xmlObject.Q);
    }

    // Parse BoolParameter element
    if (xmlObject.Enabled) {
      this.enabled = new BoolParameter().fromXmlObject(xmlObject.Enabled);
    }

    // Parse attributes
    if (xmlObject["@_type"] !== undefined) {
      this.type = xmlObject["@_type"] as EqBandType;
    }

    if (xmlObject["@_order"] !== undefined) {
      this.order = parseInt(xmlObject["@_order"], 10);
    }

    return this;
  }
}
