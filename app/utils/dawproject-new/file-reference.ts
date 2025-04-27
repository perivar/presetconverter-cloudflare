// dawproject/file-reference.ts
// Does not extend any base class based on schema
import type {
  FileReference as FileReferenceType,
  XsBoolean,
  XsString,
} from "./project-schema";

/**
 * Represents a reference to an external or internal file.
 * Corresponds to the 'fileReference' complex type in Project.xsd.
 */
export class FileReference implements FileReferenceType {
  /**
   * The path to the referenced file.
   * (Required attribute)
   */
  public "@_path": XsString;

  /**
   * Indicates if the file is external to the project package.
   * (Optional attribute)
   */
  public "@_external"?: XsBoolean;

  /**
   * @param path - The path to the referenced file. (Required attribute)
   * @param external - Indicates if the file is external to the project package. (Optional attribute)
   */
  constructor(path: XsString, external: XsBoolean = false) {
    this["@_path"] = path;
    this["@_external"] = external;
  }
}
