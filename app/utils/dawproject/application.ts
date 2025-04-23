import { XMLBuilder, XMLParser } from "fast-xml-parser";

import { IApplication } from "./types";
import { XML_BUILDER_OPTIONS, XML_PARSER_OPTIONS } from "./xml/options";
import { XmlObject } from "./XmlObject";

/** Metadata about the application which saved the DAWPROJECT file. */
export class Application extends XmlObject implements IApplication {
  /** Name of the application. */
  name: string;
  /** Version number of the application. */
  version: string;

  constructor(name: string, version: string) {
    super();
    this.name = name;
    this.version = version;
  }

  toXmlObject(): any {
    // Return object with attributes instead of child elements
    const obj = {
      Application: {
        "@_name": this.name,
        "@_version": this.version,
      },
    };
    return obj;
  }

  toXml(): string {
    const builder = new XMLBuilder(XML_BUILDER_OPTIONS);
    return builder.build(this.toXmlObject());
  }

  static fromXmlObject(xmlObject: any): Application {
    const applicationData = xmlObject.Application;
    const name = applicationData["@_name"] || "";
    const version = applicationData["@_version"] || "";
    return new Application(name, version);
  }

  static fromXml(xmlString: string): Application {
    const parser = new XMLParser(XML_PARSER_OPTIONS);
    const jsonObj = parser.parse(xmlString);
    return Application.fromXmlObject(jsonObj);
  }
}
