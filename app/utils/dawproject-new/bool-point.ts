// dawproject/bool-point.ts
import { Point } from "./point";
import type {
  BoolPoint as BoolPointType,
  XsBoolean,
  XsString,
} from "./project-schema";

/**
 * Represents an automation point with a boolean value.
 * Corresponds to the 'boolPoint' complex type in Project.xsd.
 * Inherits attributes and child elements from Point.
 */
export class BoolPoint extends Point implements BoolPointType {
  /**
   * The boolean value of the point.
   * (Required attribute)
   */
  public "@_value": XsBoolean;

  /**
   * @param time - The time position within the parent timeline. (Required attribute inherited from Point)
   * @param value - The boolean value of the point. (Required attribute)
   */
  constructor(time: XsString, value: XsBoolean) {
    super(time);
    this["@_value"] = value;
  }
}
