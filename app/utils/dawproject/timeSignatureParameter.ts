import { XMLBuilder, XMLParser } from "fast-xml-parser";

import { Parameter } from "./parameter";
import { ITimeSignatureParameter } from "./types";
import { XML_BUILDER_OPTIONS, XML_PARSER_OPTIONS } from "./xml/options";

/** Represents a (the) time-signature parameter which can provide a value and be used as an automation target. */
export class TimeSignatureParameter
  extends Parameter
  implements ITimeSignatureParameter
{
  /** Numerator of the time-signature. (3/4 → 3, 4/4 → 4)*/
  numerator: number;
  /** Denominator of the time-signature. (3/4 → 4, 7/8 → 8) */
  denominator: number;

  constructor(
    numerator: number,
    denominator: number,
    parameterID?: number,
    name?: string,
    color?: string,
    comment?: string
  ) {
    super(parameterID, name, color, comment);
    if (numerator === undefined || denominator === undefined) {
      throw new Error(
        "Numerator and denominator are required for TimeSignatureParameter"
      );
    }
    this.numerator = numerator;
    this.denominator = denominator;
  }

  toXmlObject(): any {
    const obj = super.getXmlAttributes(); // Get attributes from Parameter
    obj["@_numerator"] = this.numerator;
    obj["@_denominator"] = this.denominator;
    return { TimeSignatureParameter: obj };
  }

  toXml(): string {
    const builder = new XMLBuilder(XML_BUILDER_OPTIONS);
    return builder.build(this.toXmlObject());
  }

  static fromXmlObject(xmlObject: any): TimeSignatureParameter {
    const instance = new TimeSignatureParameter(
      parseInt(xmlObject["@_numerator"], 10),
      parseInt(xmlObject["@_denominator"], 10)
    ); // Create instance with required properties
    instance.populateFromXml(xmlObject); // Populate inherited attributes from Parameter
    // Numerator and denominator are set in the constructor based on XML, no need to set again here
    return instance;
  }

  static fromXml(xmlString: string): TimeSignatureParameter {
    const parser = new XMLParser(XML_PARSER_OPTIONS);
    const jsonObj = parser.parse(xmlString);
    return TimeSignatureParameter.fromXmlObject(jsonObj.TimeSignatureParameter);
  }
}
