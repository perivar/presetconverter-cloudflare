// dawproject/real-point.ts
import { Point } from "./point";
import type {
  Interpolation,
  RealPoint as RealPointType,
  XsString,
} from "./project-schema";

/**
 * Represents an automation point with a floating-point value and interpolation.
 * Corresponds to the 'realPoint' complex type in Project.xsd.
 * Inherits attributes and child elements from Point.
 */
export class RealPoint extends Point implements RealPointType {
  /**
   * The floating-point value of the point.
   * (Required attribute - xs:string)
   */
  public "@_value": XsString; // Using XsString for xs:string

  /**
   * How the value changes to the next point.
   * (Optional attribute - interpolation enum)
   */
  public "@_interpolation"?: Interpolation;

  /**
   * @param time - The time position within the parent timeline. (Required attribute inherited from Point - xs:string)
   * @param value - The floating-point value of the point. (Required attribute - xs:string)
   * @param interpolation - How the value changes to the next point. (Optional attribute - interpolation enum)
   */
  constructor(time: XsString, value: XsString, interpolation?: Interpolation) {
    super(time); // Call Point constructor with XsString time
    this["@_value"] = value;
    this["@_interpolation"] = interpolation;
  }
}
