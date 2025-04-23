import { XMLBuilder, XMLParser } from "fast-xml-parser";

import { RealParameter } from "./realParameter";
import { TimeSignatureParameter } from "./timeSignatureParameter";
import { ITransport } from "./types";
import { Unit } from "./unit";
import { XML_BUILDER_OPTIONS, XML_PARSER_OPTIONS } from "./xml/options";
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
        ...this.tempo.toXmlObject().RealParameter, // Assuming RealParameter has toXmlObject and returns { RealParameter: ... }
        ["@_unit"]: Unit.BPM,
      };
    }

    if (this.timeSignature) {
      obj.Transport.TimeSignature =
        this.timeSignature.toXmlObject().TimeSignatureParameter; // Assuming TimeSignatureParameter has toXmlObject and returns { TimeSignatureParameter: ... }
    }

    return obj;
  }

  toXml(): string {
    const builder = new XMLBuilder(XML_BUILDER_OPTIONS);
    return builder.build(this.toXmlObject());
  }

  static fromXmlObject(xmlObject: any): Transport {
    const tempo = xmlObject.Tempo
      ? RealParameter.fromXmlObject({ RealParameter: xmlObject.Tempo }) // Wrap in expected structure
      : undefined; // Assuming RealParameter has fromXmlObject

    const timeSignature = xmlObject.TimeSignature
      ? TimeSignatureParameter.fromXmlObject({
          TimeSignatureParameter: xmlObject.TimeSignature,
        }) // Wrap in expected structure
      : undefined; // Assuming TimeSignatureParameter has fromXmlObject

    return new Transport(tempo, timeSignature);
  }

  static fromXml(xmlString: string): Transport {
    const parser = new XMLParser(XML_PARSER_OPTIONS);
    const jsonObj = parser.parse(xmlString);
    return Transport.fromXmlObject(jsonObj.Transport);
  }
}
