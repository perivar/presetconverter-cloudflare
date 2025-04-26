// dawproject/enum-point.ts
import { Point } from "./point";
import type {
  EnumPoint as EnumPointType,
  XsInt,
  XsString,
} from "./project-schema";

/**
 * Represents an automation point with an enumeration value.
 * Corresponds to the 'enumPoint' complex type in Project.xsd.
 * Inherits attributes and child elements from Point.
 */
export class EnumPoint extends Point implements EnumPointType {
  // XML attribute is prefixed with '@_'

  /**
   * The integer value of the enumeration point.
   * (Required attribute - xs:int)
   */
  public "@_value": XsInt;

  /**
   * @param time - The time position within the parent timeline. (Required attribute inherited from Point)
   * @param value - The enum value of the point. (Required attribute)
   */
  constructor(time: XsString, value: XsInt) {
    super(time);
    this["@_value"] = value;
  }
}
