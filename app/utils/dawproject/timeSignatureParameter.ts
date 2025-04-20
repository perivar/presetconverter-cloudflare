import { XMLBuilder, XMLParser } from "fast-xml-parser";

import { IParameter, Parameter } from "./parameter";

/** Represents a (the) time-signature parameter which can provide a value and be used as an automation target. */
export interface ITimeSignatureParameter extends IParameter {
  /** Numerator of the time-signature. (3/4 → 3, 4/4 → 4)*/
  numerator?: number;
  /** Denominator of the time-signature. (3/4 → 4, 7/8 → 8) */
  denominator?: number;
}

/** Represents a (the) time-signature parameter which can provide a value and be used as an automation target. */
export class TimeSignatureParameter
  extends Parameter
  implements ITimeSignatureParameter
{
  /** Numerator of the time-signature. (3/4 → 3, 4/4 → 4)*/
  numerator?: number;
  /** Denominator of the time-signature. (3/4 → 4, 7/8 → 8) */
  denominator?: number;

  constructor(
    numerator?: number,
    denominator?: number,
    parameterId?: number,
    name?: string,
    color?: string,
    comment?: string
  ) {
    super(parameterId, name, color, comment);
    this.numerator = numerator;
    this.denominator = denominator;
  }

  toXmlObject(): any {
    const obj = super.getXmlAttributes(); // Get attributes from Parameter
    if (this.numerator !== undefined) {
      obj.numerator = this.numerator;
    }
    if (this.denominator !== undefined) {
      obj.denominator = this.denominator;
    }
    return { TimeSignatureParameter: obj };
  }

  toXml(): string {
    const builder = new XMLBuilder({ attributeNamePrefix: "" });
    return builder.build(this.toXmlObject());
  }

  static fromXmlObject(xmlObject: any): TimeSignatureParameter {
    const instance = new TimeSignatureParameter(); // Create instance
    instance.populateFromXml(xmlObject); // Populate inherited attributes from Parameter
    instance.numerator =
      xmlObject.numerator !== undefined
        ? parseInt(xmlObject.numerator, 10)
        : undefined;
    instance.denominator =
      xmlObject.denominator !== undefined
        ? parseInt(xmlObject.denominator, 10)
        : undefined;
    return instance;
  }

  static fromXml(xmlString: string): TimeSignatureParameter {
    const parser = new XMLParser({ attributeNamePrefix: "" });
    const jsonObj = parser.parse(xmlString);
    return TimeSignatureParameter.fromXmlObject(jsonObj.TimeSignatureParameter);
  }
}
