import { XMLBuilder, XMLParser } from "fast-xml-parser";

import { Parameter } from "./parameter";
import { IBoolParameter } from "./types";
import { XML_BUILDER_OPTIONS, XML_PARSER_OPTIONS } from "./xml/options";

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
    // Get inherited attributes
    const attributes = super.getXmlAttributes(); // Get attributes from Parameter

    // Add BoolParameter-specific attribute
    if (this.value !== undefined) {
      attributes["@_value"] = this.value;
    }

    // Return with proper structure
    return {
      BoolParameter: {
        ...attributes,
      },
    };
  }

  toXml(): string {
    const builder = new XMLBuilder(XML_BUILDER_OPTIONS);
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
    const parser = new XMLParser(XML_PARSER_OPTIONS);
    const jsonObj = parser.parse(xmlString);
    return BoolParameter.fromXmlObject(jsonObj.BoolParameter);
  }
}
