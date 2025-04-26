// dawproject/parameter.ts
import type {
  Parameter as ParameterType,
  XsInt,
  XsString,
} from "./project-schema";
import { Referenceable } from "./referenceable";

/**
 * Base class for all automatable parameters.
 * Corresponds to the 'parameter' abstract complex type in Project.xsd.
 * Inherits attributes and child elements from Referenceable.
 */
export abstract class Parameter extends Referenceable implements ParameterType {
  // XML attributes are prefixed with '@_'

  /**
   * A unique identifier for the parameter within its device.
   * (Optional attribute - xs:int)
   */
  public "@_parameterID"?: XsInt;

  /**
   * @param name - The name of the parameter. (Optional attribute inherited from Nameable)
   * @param color - The color of the parameter. (Optional attribute inherited from Nameable)
   * @param comment - A comment for the parameter. (Optional attribute inherited from Nameable)
   * @param parameterID - A unique identifier for the parameter within its device. (Optional attribute - xs:int)
   */
  constructor(
    name?: XsString,
    color?: XsString,
    comment?: XsString,
    parameterID?: XsInt
  ) {
    super(name, color, comment);
    this["@_parameterID"] = parameterID;
  }
}
