import { XMLBuilder, XMLParser } from "fast-xml-parser";

/** References a file either within a DAWPROJECT container or on disk. */
import { IFileReference } from "./types";
import { XML_BUILDER_OPTIONS, XML_PARSER_OPTIONS } from "./xml/options";
import { XmlObject } from "./XmlObject";

/** References a file either within a DAWPROJECT container or on disk. */
export class FileReference extends XmlObject implements IFileReference {
  /** File path. either
   * <li>path within the container</li>
   * <li>relative to .dawproject file (when external = "true")</li>
   * <li>absolute path (when external = "true" and path starts with a slash or windows drive letter)</li>
   * */
  path: string;
  /** When true, the path is relative to the .dawproject file. Default value is false. */
  external?: boolean;

  constructor(path: string, external: boolean = false) {
    super();
    if (path === undefined) {
      throw new Error("The 'path' attribute is required for FileReference");
    }
    this.path = path;
    this.external = external;
  }

  toXmlObject(): any {
    const obj: any = {
      "@_path": this.path,
    };
    if (this.external !== undefined) {
      obj["@_external"] = this.external;
    }
    return obj;
  }

  toXml(): string {
    const builder = new XMLBuilder(XML_BUILDER_OPTIONS);
    return builder.build({ State: this.toXmlObject() });
  }

  static fromXmlObject(xmlObject: any): FileReference {
    const path = xmlObject["@_path"] || "";
    const external =
      xmlObject["@_external"] !== undefined
        ? String(xmlObject["@_external"]).toLowerCase() === "true"
        : false;
    return new FileReference(path, external);
  }

  static fromXml(xmlString: string): FileReference {
    const parser = new XMLParser(XML_PARSER_OPTIONS);
    const jsonObj = parser.parse(xmlString);
    return FileReference.fromXmlObject(jsonObj.State);
  }
}
