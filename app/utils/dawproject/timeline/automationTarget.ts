import { ExpressionType } from "../expressionType";
import { Parameter } from "../parameter";
import { Referenceable } from "../referenceable"; // Import Referenceable
import type { IAutomationTarget } from "../types";
import { XmlObject } from "../XmlObject";

export class AutomationTarget extends XmlObject implements IAutomationTarget {
  // Attributes
  parameter?: Parameter;
  expression?: ExpressionType;
  channel?: number;
  key?: number;
  controller?: number;

  constructor(
    parameter?: Parameter,
    expression?: ExpressionType,
    channel?: number,
    key?: number,
    controller?: number
  ) {
    super();
    this.parameter = parameter;
    this.expression = expression;
    this.channel = channel;
    this.key = key;
    this.controller = controller;
  }

  toXmlObject(): any {
    // Create target object with nested elements
    const obj: any = {
      Target: {},
    };

    // Add optional elements
    if (this.parameter !== undefined) {
      obj.Target["@_parameter"] = this.parameter;
    }
    if (this.expression !== undefined) {
      obj.Target["@_expression"] = this.expression;
    }
    if (this.channel !== undefined) {
      obj.Target["@_channel"] = this.channel;
    }
    if (this.key !== undefined) {
      obj.Target["@_key"] = this.key;
    }
    if (this.controller !== undefined) {
      obj.Target["@_controller"] = this.controller;
    }

    return obj;
  }

  fromXmlObject(xmlObject: any): this {
    // Parse parameter attribute and get the referenced Parameter object
    if (xmlObject["@_parameter"] !== undefined) {
      const parameterId = xmlObject["@_parameter"];
      const referencedParameter = Referenceable.getById(parameterId);
      if (referencedParameter instanceof Parameter) {
        this.parameter = referencedParameter;
      } else {
        console.warn(
          `Could not find referenced Parameter with id: ${parameterId}`
        );
        this.parameter = undefined; // Or handle error appropriately
      }
    }

    if (xmlObject["@_expression"] !== undefined) {
      this.expression = xmlObject["@_expression"] as ExpressionType;
    }

    if (xmlObject["@_channel"] !== undefined) {
      this.channel = parseInt(xmlObject["@_channel"], 10);
    }

    if (xmlObject["@_key"] !== undefined) {
      this.key = parseInt(xmlObject["@_key"], 10);
    }

    if (xmlObject["@_controller"] !== undefined) {
      this.controller = parseInt(xmlObject["@_controller"], 10);
    }

    return this;
  }
}
