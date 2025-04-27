// dawproject/integer-parameter.ts
import { Parameter } from "./parameter";
import type {
  IntegerParameter as IntegerParameterType,
  XsInt,
  XsString,
} from "./project-schema";

/**
 * Represents an integer parameter.
 * Corresponds to the 'integerParameter' complex type in Project.xsd.
 * Inherits attributes and child elements from Parameter.
 */
export class IntegerParameter
  extends Parameter
  implements IntegerParameterType
{
  /**
   * The current integer value of the parameter.
   * (Optional attribute - xs:int)
   */
  public "@_value"?: XsInt;

  /**
   * The maximum possible integer value for the parameter.
   * (Optional attribute - xs:int)
   */
  public "@_max"?: XsInt;

  /**
   * The minimum possible integer value for the parameter.
   * (Optional attribute - xs:int)
   */
  public "@_min"?: XsInt;

  // Note: The XSD does not define an 'Automation' child element for integerParameter.

  /**
   * @param name - The name of the parameter. (Optional attribute inherited from Nameable)
   * @param color - The color of the parameter. (Optional attribute inherited from Nameable)
   * @param comment - A comment for the parameter. (Optional attribute inherited from Nameable)
   * @param parameterID - A unique identifier for the parameter within its device. (Optional attribute inherited from Parameter)
   * @param value - The current integer value of the parameter. (Optional attribute - xs:int)
   * @param max - The maximum possible integer value for the parameter. (Optional attribute - xs:int)
   * @param min - The minimum possible integer value for the parameter. (Optional attribute - xs:int)
   */
  constructor(
    name?: XsString,
    color?: XsString,
    comment?: XsString,
    parameterID?: XsInt,
    value?: XsInt,
    max?: XsInt,
    min?: XsInt
  ) {
    // Corrected super call to pass inherited parameters
    super(name, color, comment, parameterID);

    this["@_value"] = value;
    this["@_max"] = max;
    this["@_min"] = min;
  }
}
