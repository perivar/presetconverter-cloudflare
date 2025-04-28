import { XmlAttribute } from "./xmlDecorators";

/** References a file either within a DAWPROJECT container or on disk. */
export class FileReference {
  /** File path. either
   * <li>path within the container</li>
   * <li>relative to .dawproject file (when external = "true")</li>
   * <li>absolute path (when external = "true" and path starts with a slash or windows drive letter)</li>
   * */
  @XmlAttribute({ required: true })
  path: string;

  /** When true, the path is relative to the .dawproject file. Default value is false. */
  @XmlAttribute({ required: false })
  external?: boolean = false;

  constructor(path: string, external?: boolean) {
    this.path = path;
    if (external !== undefined) {
      this.external = external;
    }
  }
}
