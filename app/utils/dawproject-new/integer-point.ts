// dawproject/integer-point.ts
import { Point } from "./point";
import type {
  IntegerPoint as IntegerPointType,
  XsInt,
  XsString,
} from "./project-schema";

/**
 * Represents an automation point with an integer value.
 * Corresponds to the 'integerPoint' complex type in Project.xsd.
 * Inherits attributes and child elements from Point.
 */
export class IntegerPoint extends Point implements IntegerPointType {
  // XML attribute is prefixed with '@_'

  /**
   * The integer value of the point.
   * (Required attribute - xs:int)
   */
  public "@_value": XsInt;

  /**
   * @param time - The time position within the parent timeline. (Required attribute inherited from Point - xs:string)
   * @param value - The integer value of the point. (Required attribute - xs:int)
   */
  constructor(time: XsString, value: XsInt) {
    super(time); // Call Point constructor with XsString time and inherited properties
    this["@_value"] = value;
  }
}
