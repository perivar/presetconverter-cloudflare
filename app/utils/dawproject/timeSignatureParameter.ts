import { Parameter } from "./parameter";
import { ITimeSignatureParameter } from "./types";

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
    this.numerator = numerator;
    this.denominator = denominator;
  }

  toXmlObject(): any {
    const attributes = super.toXmlObject(); // Get attributes from Parameter
    attributes["@_numerator"] = this.numerator;
    attributes["@_denominator"] = this.denominator;
    return { TimeSignatureParameter: attributes };
  }

  fromXmlObject(xmlObject: any): this {
    super.fromXmlObject(xmlObject); // Populate inherited attributes from Parameter

    this.numerator = parseInt(xmlObject["@_numerator"], 10);
    this.denominator = parseInt(xmlObject["@_denominator"], 10);

    return this;
  }
}
