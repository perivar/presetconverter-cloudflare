import { XMLBuilder, XMLParser } from "fast-xml-parser";

export interface IApplication {
  name: string;
  version: string;
}

/** Metadata about the application which saved the DAWPROJECT file. */
export class Application implements IApplication {
  /** Name of the application. */
  name: string;
  /** Version number of the application. */
  version: string;

  constructor(name: string, version: string) {
    this.name = name;
    this.version = version;
  }

  toXmlObject(): any {
    const obj = {
      Application: {
        name: this.name,
        version: this.version,
      },
    };
    return obj;
  }

  toXml(): string {
    const builder = new XMLBuilder({ attributeNamePrefix: "" });
    return builder.build(this.toXmlObject());
  }

  static fromXmlObject(xmlObject: any): Application {
    const applicationData = xmlObject.Application;
    const name = applicationData.name || "";
    const version = applicationData.version || "";
    return new Application(name, version);
  }

  static fromXml(xmlString: string): Application {
    const parser = new XMLParser({ attributeNamePrefix: "" });
    const jsonObj = parser.parse(xmlString);
    return Application.fromXmlObject(jsonObj);
  }
}
