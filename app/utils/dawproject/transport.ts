import { RealParameter } from "./realParameter";
import { TimeSignatureParameter } from "./timeSignatureParameter";
import { ITransport } from "./types";
import { Unit } from "./unit";
import { XmlObject } from "./XmlObject";

/** Transport element containing playback parameters such as Tempo and Time-signature. */
export class Transport extends XmlObject implements ITransport {
  /** Tempo parameter for setting and/or automating the tempo. */
  tempo?: RealParameter;
  /** Time-signature parameter. */
  timeSignature?: TimeSignatureParameter;

  constructor(tempo?: RealParameter, timeSignature?: TimeSignatureParameter) {
    super();
    this.tempo = tempo;
    this.timeSignature = timeSignature;
  }

  toXmlObject(): any {
    const obj: any = {
      Transport: {},
    };

    if (this.tempo) {
      obj.Transport.Tempo = {
        ...this.tempo.toXmlObject().RealParameter,
        ["@_unit"]: Unit.BPM,
      };
    }

    if (this.timeSignature) {
      obj.Transport.TimeSignature =
        this.timeSignature.toXmlObject().TimeSignatureParameter;
    }

    return obj;
  }

  fromXmlObject(xmlObject: any): this {
    this.tempo = xmlObject.Tempo
      ? new RealParameter().fromXmlObject(xmlObject.Tempo)
      : undefined;

    this.timeSignature = xmlObject.TimeSignature
      ? new TimeSignatureParameter().fromXmlObject(xmlObject.TimeSignature)
      : undefined;

    return this;
  }
}
