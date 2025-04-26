// dawproject/application.ts
import type {
  Application as ApplicationType,
  XsString,
} from "./project-schema";

/**
 * Represents the host application that created the project file.
 * Corresponds to the 'application' complex type in Project.xsd.
 */
export class Application implements ApplicationType {
  // XmlElement properties for XML serialization
  public "@_xmlns"?: string;
  [ns: `@_xmlns:${string}`]: string | undefined;

  // XML attributes are prefixed with '@_'

  /**
   * The name of the application.
   * (Required attribute)
   */
  public "@_name": XsString;

  /**
   * The version of the application.
   * (Required attribute)
   */
  public "@_version": XsString;

  /**
   * @param name - The name of the application. (Required attribute)
   * @param version - The version of the application. (Required attribute)
   */
  constructor(name: XsString, version: XsString) {
    this["@_name"] = name;
    this["@_version"] = version;
  }
}
