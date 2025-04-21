import { XMLBuilder, XMLParser } from "fast-xml-parser";

import { Parameter } from "./parameter";
import { IBoolParameter } from "./types";

/** Represents a parameter which can provide a boolean (true/false) value and be used as an automation target. */
export class BoolParameter extends Parameter implements IBoolParameter {
  /** Boolean value for this parameter. */
  value?: boolean;

  constructor(
    value?: boolean,
    parameterID?: number,
    name?: string,
    color?: string,
    comment?: string
  ) {
    super(parameterID, name, color, comment);
    this.value = value;
  }

  toXmlObject(): any {
    const obj = super.getXmlAttributes(); // Get attributes from Parameter
    if (this.value !== undefined) {
      obj.value = this.value;
    }
    return { BoolParameter: obj };
  }

  toXml(): string {
    const builder = new XMLBuilder({ attributeNamePrefix: "" });
    return builder.build(this.toXmlObject());
  }

  static fromXmlObject(xmlObject: any): BoolParameter {
    const instance = new BoolParameter();
    instance.populateFromXml(xmlObject); // Populate inherited attributes from Parameter
    instance.value =
      xmlObject.value !== undefined
        ? String(xmlObject.value).toLowerCase() === "true"
        : undefined;
    return instance;
  }

  static fromXml(xmlString: string): BoolParameter {
    const parser = new XMLParser({ attributeNamePrefix: "" });
    const jsonObj = parser.parse(xmlString);
    return BoolParameter.fromXmlObject(jsonObj.BoolParameter);
  }
}
