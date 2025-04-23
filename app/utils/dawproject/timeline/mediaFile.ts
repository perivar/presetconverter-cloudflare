import { FileReference } from "../fileReference";
import type { IFileReference, IMediaFile } from "../types"; // Added IFileReference
import { Timeline } from "./timeline";
import { TimeUnit } from "./timeUnit";

export abstract class MediaFile extends Timeline implements IMediaFile {
  file: IFileReference; // Made required and changed type to interface
  duration: number;

  constructor(
    file: IFileReference, // Made required and changed type to interface
    duration: number = 0.0,
    name?: string,
    timeUnit?: TimeUnit
  ) {
    super(undefined, timeUnit, name); // MediaFile doesn't have a track attribute directly
    this.file = file;
    this.duration = duration;
  }

  protected getXmlAttributes(): any {
    const attributes = super.getXmlAttributes(); // Get attributes from Timeline
    attributes["@_duration"] = this.duration;
    return attributes;
  }

  protected getXmlChildren(): any {
    const children: any = {};
    // Need to ensure file has toXmlObject if it's an IFileReference
    // Assuming concrete implementations will pass FileReference instances
    if (this.file && "toXmlObject" in this.file) {
      children.File = (this.file as FileReference).toXmlObject();
    } else if (this.file) {
      // Handle case where file is IFileReference but not FileReference
      // This might require a different approach or assumption about implementation
      console.warn(
        "File property is IFileReference but not FileReference instance. Cannot call toXmlObject."
      );
    }
    return children;
  }

  protected populateFromXml(xmlObject: any): void {
    super.populateFromXml(xmlObject); // Populate inherited attributes from Timeline
    this.duration =
      xmlObject.duration !== undefined ? parseFloat(xmlObject.duration) : 0.0;
    if (xmlObject.File) {
      this.file = FileReference.fromXmlObject(xmlObject.File); // Assuming FileReference has fromXmlObject
    } else {
      // Handle missing required file
      console.warn(
        "Missing required 'File' element in XML for MediaFile. Assigning default."
      );
      this.file = new FileReference(""); // Assign a default or throw error
    }
  }
}
