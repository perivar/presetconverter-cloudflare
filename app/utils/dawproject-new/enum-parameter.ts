// dawproject/enum-parameter.ts
import { Parameter } from "./parameter";
import type {
  EnumParameter as EnumParameterType,
  XsInt,
  XsString,
} from "./project-schema";

/**
 * Represents an enumeration parameter.
 * Corresponds to the 'enumParameter' complex type in Project.xsd.
 * Inherits attributes and child elements from Parameter.
 */
export class EnumParameter extends Parameter implements EnumParameterType {
  /**
   * The total number of possible values for the enumeration.
   * (Required attribute - xs:int)
   */
  public "@_count": XsInt;

  /**
   * A space-separated string of labels for the enumeration values.
   * (Optional attribute - list of xs:string)
   */
  public "@_labels"?: XsString;

  /**
   * The current integer value of the enumeration.
   * (Optional attribute - xs:int)
   */
  public "@_value"?: XsInt;

  // Note: The XSD does not define an 'Automation' child element for enumParameter.

  /**
   * @param count - The total number of possible values for the enumeration. (Required attribute - xs:int)
   * @param value - The current integer value of the enumeration. (Optional attribute - xs:int)
   * @param labels - A space-separated string of labels for the enumeration values. (Optional attribute - list of xs:string)
   * @param name - The name of the parameter. (Optional attribute inherited from Nameable)
   * @param color - The color of the parameter. (Optional attribute inherited from Nameable)
   * @param comment - A comment for the parameter. (Optional attribute inherited from Nameable)
   * @param parameterID - A unique identifier for the parameter within its device. (Optional attribute inherited from Parameter)
   */
  constructor(
    count: XsInt,
    value?: XsInt,
    labels?: XsString,
    name?: XsString,
    color?: XsString,
    comment?: XsString,
    parameterID?: XsInt
  ) {
    super(name, color, comment, parameterID);

    this["@_count"] = count;
    this["@_value"] = value;
    this["@_labels"] = labels;
  }
}
