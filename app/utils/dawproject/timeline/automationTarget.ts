import { ExpressionType } from "../expressionType";
import { Parameter } from "../parameter";
import { Referenceable } from "../referenceable"; // Import Referenceable
import type { IAutomationTarget } from "../types";
import { XmlObject } from "../XmlObject";

export class AutomationTarget extends XmlObject implements IAutomationTarget {
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
    const target: any = {
      Target: {},
    };

    // Add optional elements
    if (this.parameter !== undefined) {
      target.Target.parameter = this.parameter;
    }
    if (this.expression !== undefined) {
      target.Target.expression = this.expression;
    }
    if (this.channel !== undefined) {
      target.Target.channel = this.channel;
    }
    if (this.key !== undefined) {
      target.Target.key = this.key;
    }
    if (this.controller !== undefined) {
      target.Target.controller = this.controller;
    }

    return target;
  }

  fromXmlObject(xmlObject: any): this {
    if (!xmlObject) {
      throw new Error("Required Target element missing in XML");
    }

    // Parse parameter attribute and get the referenced Parameter object
    if (xmlObject["@_parameter"]) {
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
    } else {
      this.parameter = undefined;
    }

    this.expression = xmlObject.expression
      ? (xmlObject.expression as ExpressionType)
      : undefined;
    this.channel =
      xmlObject.channel !== undefined
        ? parseInt(xmlObject.channel, 10)
        : undefined;
    this.key =
      xmlObject.key !== undefined ? parseInt(xmlObject.key, 10) : undefined;
    this.controller =
      xmlObject.controller !== undefined
        ? parseInt(xmlObject.controller, 10)
        : undefined;

    return this;
  }
}
