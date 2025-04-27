// dawproject/real-parameter.ts
import { Parameter } from "./parameter";
import type {
  RealParameter as RealParameterType,
  Unit,
  XsInt,
  XsString,
} from "./project-schema";

/**
 * Represents a real (floating-point) parameter.
 * Corresponds to the 'realParameter' complex type in Project.xsd.
 * Inherits attributes and child elements from Parameter.
 */
export class RealParameter extends Parameter implements RealParameterType {
  /**
   * The current real value of the parameter.
   * (Optional attribute - xs:string)
   */
  public "@_value"?: XsString;

  /**
   * The maximum possible real value for the parameter.
   * (Optional attribute - xs:string)
   */
  public "@_max"?: XsString;

  /**
   * The minimum possible real value for the parameter.
   * (Optional attribute - xs:string)
   */
  public "@_min"?: XsString;

  /**
   * The unit of the parameter value.
   * (Required attribute - unit enum)
   */
  public "@_unit": Unit;

  // Note: The XSD does not define an 'Automation' child element for realParameter.

  /**
   * @param unit - The unit of the parameter value. (Required attribute - unit enum)
   * @param name - The name of the parameter. (Optional attribute inherited from Nameable)
   * @param color - The color of the parameter. (Optional attribute inherited from Nameable)
   * @param comment - A comment for the parameter. (Optional attribute inherited from Nameable)
   * @param parameterID - A unique identifier for the parameter within its device. (Optional attribute inherited from Parameter - xs:int)
   * @param value - The current real value of the parameter. (Optional attribute - xs:string)
   * @param max - The maximum possible real value for the parameter. (Optional attribute - xs:string)
   * @param min - The minimum possible real value for the parameter. (Optional attribute - xs:string)
   */
  constructor(
    unit: Unit,
    name?: XsString,
    color?: XsString,
    comment?: XsString,
    parameterID?: XsInt,
    value?: XsString,
    max?: XsString,
    min?: XsString
  ) {
    // Corrected super call to pass inherited parameters
    super(name, color, comment, parameterID);

    this["@_unit"] = unit;
    this["@_value"] = value;
    this["@_max"] = max;
    this["@_min"] = min;
  }
}
