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
    numerator?: number,
    denominator?: number,
    parameterID?: number,
    name?: string,
    color?: string,
    comment?: string
  ) {
    super(parameterID, name, color, comment);
    // Make numerator and denominator optional for deserialization, fromXmlObject will set it
    this.numerator = numerator || 4; // Default to 4
    this.denominator = denominator || 4; // Default to 4
  }

  toXmlObject(): any {
    const attributes = super.toXmlObject(); // Get attributes from Parameter

    // Add required numerator attribute
    if (this.numerator !== undefined) {
      attributes["@_numerator"] = this.numerator;
    } else {
      throw new Error(
        "Required attribute 'numerator' missing for TimeSignatureParameter"
      );
    }

    // Add required denominator attribute
    if (this.denominator !== undefined) {
      attributes["@_denominator"] = this.denominator;
    } else {
      throw new Error(
        "Required attribute 'denominator' missing for TimeSignatureParameter"
      );
    }

    return { TimeSignatureParameter: attributes };
  }

  fromXmlObject(xmlObject: any): this {
    super.fromXmlObject(xmlObject); // Populate inherited attributes from Parameter

    // Validate and populate required numerator attribute
    if (!xmlObject["@_numerator"]) {
      throw new Error("Required attribute 'numerator' missing in XML");
    }
    this.numerator = parseInt(xmlObject["@_numerator"], 10);
    if (isNaN(this.numerator)) {
      throw new Error("Invalid numerator value in XML");
    }

    // Validate and populate required denominator attribute
    if (!xmlObject["@_denominator"]) {
      throw new Error("Required attribute 'denominator' missing in XML");
    }
    this.denominator = parseInt(xmlObject["@_denominator"], 10);
    if (isNaN(this.denominator)) {
      throw new Error("Invalid denominator value in XML");
    }

    return this;
  }
}
