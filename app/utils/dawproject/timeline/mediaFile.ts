import { FileReference, IFileReference } from "../fileReference";
import { ITimeline, Timeline } from "./timeline";
import { TimeUnit } from "./timeUnit";

export interface IMediaFile extends ITimeline {
  file?: IFileReference;
  duration: number;
}

export abstract class MediaFile extends Timeline implements IMediaFile {
  file?: FileReference;
  duration: number;

  constructor(
    file?: FileReference,
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
    attributes.duration = this.duration;
    return attributes;
  }

  protected getXmlChildren(): any {
    const children: any = {};
    if (this.file) {
      children.File = this.file.toXmlObject(); // Assuming FileReference has toXmlObject
    }
    return children;
  }

  protected populateFromXml(xmlObject: any): void {
    super.populateFromXml(xmlObject); // Populate inherited attributes from Timeline
    this.duration =
      xmlObject.duration !== undefined ? parseFloat(xmlObject.duration) : 0.0;
    if (xmlObject.File) {
      this.file = FileReference.fromXmlObject(xmlObject.File); // Assuming FileReference has fromXmlObject
    }
  }

  // Concrete subclasses will implement their own toXmlObject and fromXmlObject methods
  abstract toXmlObject(): any;
  static fromXmlObject(xmlObject: any): MediaFile {
    throw new Error("fromXmlObject must be implemented by subclasses");
  }
}
