// dawproject/time-signature-parameter.ts
import { Parameter } from "./parameter";
import type {
  TimeSignatureParameter as TimeSignatureParameterType,
  XsInt,
  XsString,
} from "./project-schema";

/**
 * Represents a time signature parameter.
 * Corresponds to the 'timeSignatureParameter' complex type in Project.xsd.
 * Inherits attributes and child elements from Parameter.
 */
export class TimeSignatureParameter
  extends Parameter
  implements TimeSignatureParameterType
{
  // XML attributes are prefixed with '@_'

  /**
   * The denominator of the time signature.
   * (Required attribute - xs:int)
   */
  public "@_denominator": XsInt;

  /**
   * The numerator of the time signature.
   * (Required attribute - xs:int)
   */
  public "@_numerator": XsInt;

  // Note: The XSD does not define an 'Automation' child element for timeSignatureParameter.

  /**
   * @param numerator - The numerator of the time signature. (Required attribute - xs:int)
   * @param denominator - The denominator of the time signature. (Required attribute - xs:int)
   * @param name - The name of the parameter. (Optional attribute inherited from Nameable)
   * @param color - The color of the parameter. (Optional attribute inherited from Nameable)
   * @param comment - A comment for the parameter. (Optional attribute inherited from Nameable)
   * @param parameterID - A unique identifier for the parameter within its device. (Optional attribute inherited from Parameter - xs:int)
   */
  constructor(
    numerator: XsInt,
    denominator: XsInt,
    name?: XsString,
    color?: XsString,
    comment?: XsString,
    parameterID?: XsInt
  ) {
    // Corrected super call to pass inherited parameters
    super(name, color, comment, parameterID);

    this["@_numerator"] = numerator;
    this["@_denominator"] = denominator;
  }
}
