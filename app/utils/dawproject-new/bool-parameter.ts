// dawproject/bool-parameter.ts
import { Parameter } from "./parameter";
import type {
  BoolParameter as BoolParameterType,
  XsBoolean,
  XsInt,
  XsString,
} from "./project-schema";

/**
 * Represents a boolean parameter.
 * Corresponds to the 'boolParameter' complex type in Project.xsd.
 * Inherits attributes and child elements from Parameter.
 */
export class BoolParameter extends Parameter implements BoolParameterType {
  /**
   * The boolean value of the parameter.
   * (Optional attribute)
   */
  public "@_value"?: XsBoolean;

  /**
   * @param name - The name of the parameter. (Optional attribute inherited from Nameable)
   * @param color - The color of the parameter. (Optional attribute inherited from Nameable)
   * @param comment - A comment for the parameter. (Optional attribute inherited from Nameable)
   * @param parameterID - A unique identifier for the parameter within its device. (Optional attribute inherited from Parameter)
   * @param value - The boolean value of the parameter. (Optional attribute)
   */
  constructor(
    name?: XsString,
    color?: XsString,
    comment?: XsString,
    parameterID?: XsInt,
    value?: XsBoolean
  ) {
    super(name, color, comment, parameterID);
    this["@_value"] = value;
  }
}
