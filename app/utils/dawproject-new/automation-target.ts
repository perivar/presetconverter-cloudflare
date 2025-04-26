// dawproject/automation-target.ts
import type {
  AutomationTarget as AutomationTargetType,
  ExpressionType,
  XsInt,
  XsString,
} from "./project-schema";

/**
 * Represents the target of automation (a parameter, expression, etc.).
 * Corresponds to the 'automationTarget' complex type in Project.xsd.
 */
export class AutomationTarget implements AutomationTargetType {
  // XmlElement properties for XML serialization
  public "@_xmlns"?: string;
  [ns: `@_xmlns:${string}`]: string | undefined;

  // XML attributes are prefixed with '@_'

  /**
   * ID or name of the parameter being automated.
   * (Optional attribute)
   */
  public "@_parameter"?: XsString;

  /**
   * Type of expression being automated.
   * (Optional attribute)
   */
  public "@_expression"?: ExpressionType;

  /**
   * MIDI channel (for expression automation).
   * (Optional attribute)
   */
  public "@_channel"?: XsInt;

  /**
   * MIDI key (for poly pressure automation).
   * (Optional attribute)
   */
  public "@_key"?: XsInt;

  /**
   * MIDI controller number (for channel controller automation).
   * (Optional attribute)
   */
  public "@_controller"?: XsInt;

  /**
   * @param parameter - ID or name of the parameter being automated. (Optional attribute)
   * @param expression - Type of expression being automated. (Optional attribute)
   * @param channel - MIDI channel (for expression automation). (Optional attribute)
   * @param key - MIDI key (for poly pressure automation). (Optional attribute)
   * @param controller - MIDI controller number (for channel controller automation). (Optional attribute)
   */
  constructor(
    parameter?: XsString,
    expression?: ExpressionType,
    channel?: XsInt,
    key?: XsInt,
    controller?: XsInt
  ) {
    this["@_parameter"] = parameter;
    this["@_expression"] = expression;
    this["@_channel"] = channel;
    this["@_key"] = key;
    this["@_controller"] = controller;
  }
}
