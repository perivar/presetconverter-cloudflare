import { FileReference } from "../fileReference";
import type { IFileReference, IMediaFile } from "../types"; // Added IFileReference
import { Timeline } from "./timeline";
import { TimeUnit } from "./timeUnit";

export abstract class MediaFile extends Timeline implements IMediaFile {
  file: IFileReference; // Made required and changed type to interface
  duration: number;

  constructor(
    // Make file optional for deserialization, fromXmlObject will set it
    file?: IFileReference,
    duration: number = 0.0,
    name?: string,
    timeUnit?: TimeUnit
  ) {
    super(undefined, timeUnit, name); // MediaFile doesn't have a track attribute directly
    // Provide a default placeholder for file
    this.file = file || new FileReference("");
    this.duration = duration;
  }

  toXmlObject(): any {
    const obj: any = super.toXmlObject(); // Get attributes from Timeline
    obj["@_duration"] = this.duration;

    // Handle the 'File' child directly
    if (this.file && "toXmlObject" in this.file) {
      obj.File = (this.file as FileReference).toXmlObject();
    } else if (this.file) {
      // Handle case where file is IFileReference but not FileReference
      console.warn(
        "File property is IFileReference but not FileReference instance. Cannot call toXmlObject."
      );
    }

    // Since MediaFile is abstract, it doesn't return a root element itself.
    // Subclasses will wrap these attributes and children in their specific root tag.
    return obj;
  }

  fromXmlObject(xmlObject: any): this {
    super.fromXmlObject(xmlObject); // Populate inherited attributes from Timeline
    this.duration =
      xmlObject.duration !== undefined ? parseFloat(xmlObject.duration) : 0.0;
    if (xmlObject.File) {
      this.file = new FileReference().fromXmlObject(xmlObject.File);
    } else {
      // Handle missing required file
      console.warn(
        "Missing required 'File' element in XML for MediaFile. Assigning default."
      );
      this.file = new FileReference(""); // Assign a default or throw error
    }
    return this;
  }
}
