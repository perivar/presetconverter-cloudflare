import { XMLBuilder, XMLParser } from "fast-xml-parser";

import { ExpressionType } from "../expressionType";
import type { IAutomationTarget } from "../types";
import { XML_BUILDER_OPTIONS, XML_PARSER_OPTIONS } from "../xml/options";
import { XmlObject } from "../XmlObject";

export class AutomationTarget extends XmlObject implements IAutomationTarget {
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

  toXml(): string {
    const builder = new XMLBuilder(XML_BUILDER_OPTIONS);
    return builder.build(this.toXmlObject());
  }

  static fromXmlObject(xmlObject: any): AutomationTarget {
    if (!xmlObject) {
      throw new Error("Required Target element missing in XML");
    }

    // Parse elements
    const parameter = xmlObject.parameter;
    const expression = xmlObject.expression
      ? (xmlObject.expression as ExpressionType)
      : undefined;
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
    const parser = new XMLParser(XML_PARSER_OPTIONS);
    const jsonObj = parser.parse(xmlString);
    return AutomationTarget.fromXmlObject(jsonObj.Target);
  }
}
