// dawproject/time-signature-point.ts
import { Point } from "./point";
import type {
  TimeSignaturePoint as TimeSignaturePointType,
  XsInt,
  XsString,
} from "./project-schema";

/**
 * Represents an automation point for time signature changes.
 * Corresponds to the 'timeSignaturePoint' complex type in Project.xsd.
 * Inherits attributes and child elements from Point.
 */
export class TimeSignaturePoint
  extends Point
  implements TimeSignaturePointType
{
  /**
   * The numerator of the time signature.
   * (Required attribute - xs:int)
   */
  public "@_numerator": XsInt;

  /**
   * The denominator of the time signature.
   * (Required attribute - xs:int)
   */
  public "@_denominator": XsInt;

  /**
   * @param time - The time position within the parent timeline. (Required attribute inherited from Point - xs:string)
   * @param numerator - The numerator of the time signature. (Required attribute - xs:int)
   * @param denominator - The denominator of the time signature. (Required attribute - xs:int)
   */
  constructor(time: XsString, numerator: XsInt, denominator: XsInt) {
    super(time); // Call Point constructor with XsString time
    this["@_numerator"] = numerator;
    this["@_denominator"] = denominator;
  }
}
