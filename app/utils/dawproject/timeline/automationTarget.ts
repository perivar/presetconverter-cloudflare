import { XMLBuilder, XMLParser } from "fast-xml-parser";

import { ExpressionType } from "../expressionType";
import { IAutomationTarget } from "../types";

export class AutomationTarget implements IAutomationTarget {
  parameter?: string; // Assuming parameter is an IDREF string
  expression?: ExpressionType;
  channel?: number;
  key?: number;
  controller?: number;

  constructor(
    parameter?: string,
    expression?: ExpressionType,
    channel?: number,
    key?: number,
    controller?: number
  ) {
    this.parameter = parameter;
    this.expression = expression;
    this.channel = channel;
    this.key = key;
    this.controller = controller;
  }

  toXmlObject(): any {
    const obj: any = {};
    if (this.parameter !== undefined) {
      obj.parameter = this.parameter;
    }
    if (this.expression !== undefined) {
      obj.expression = this.expression;
    }
    if (this.channel !== undefined) {
      obj.channel = this.channel;
    }
    if (this.key !== undefined) {
      obj.key = this.key;
    }
    if (this.controller !== undefined) {
      obj.controller = this.controller;
    }
    return obj;
  }

  toXml(): string {
    const builder = new XMLBuilder({ attributeNamePrefix: "" });
    return builder.build({ Target: this.toXmlObject() });
  }

  static fromXmlObject(xmlObject: any): AutomationTarget {
    const parameter = xmlObject.parameter || undefined;
    const expression = (xmlObject.expression as ExpressionType) || undefined; // Cast string to ExpressionType
    const channel =
      xmlObject.channel !== undefined
        ? parseInt(xmlObject.channel, 10)
        : undefined;
    const key =
      xmlObject.key !== undefined ? parseInt(xmlObject.key, 10) : undefined;
    const controller =
      xmlObject.controller !== undefined
        ? parseInt(xmlObject.controller, 10)
        : undefined;

    return new AutomationTarget(
      parameter,
      expression,
      channel,
      key,
      controller
    );
  }

  static fromXml(xmlString: string): AutomationTarget {
    const parser = new XMLParser({ attributeNamePrefix: "" });
    const jsonObj = parser.parse(xmlString);
    return AutomationTarget.fromXmlObject(jsonObj.Target);
  }
}
