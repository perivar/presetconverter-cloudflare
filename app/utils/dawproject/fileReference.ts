import { XMLBuilder, XMLParser } from "fast-xml-parser";

/** References a file either within a DAWPROJECT container or on disk. */
import { IFileReference } from "./types";
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
      path: this.path,
    };
    if (this.external !== undefined) {
      obj.external = this.external;
    }
    return obj;
  }

  toXml(): string {
    const builder = new XMLBuilder({ attributeNamePrefix: "" });
    return builder.build({ State: this.toXmlObject() });
  }

  static fromXmlObject(xmlObject: any): FileReference {
    const path = xmlObject.path || "";
    const external =
      xmlObject.external !== undefined
        ? String(xmlObject.external).toLowerCase() === "true"
        : false;
    return new FileReference(path, external);
  }

  static fromXml(xmlString: string): FileReference {
    const parser = new XMLParser({ attributeNamePrefix: "" });
    const jsonObj = parser.parse(xmlString);
    return FileReference.fromXmlObject(jsonObj.State);
  }
}
