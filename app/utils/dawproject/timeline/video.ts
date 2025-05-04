import { FileReference } from "../fileReference";
import type { IFileReference, IVideo } from "../types"; // Import IFileReference

import { MediaFile } from "./mediaFile";
import { TimeUnit } from "./timeUnit";

export class Video extends MediaFile implements IVideo {
  algorithm?: string;
  channels: number;
  sampleRate: number;

  constructor(
    // Make required fields optional for deserialization, provide defaults
    sampleRate?: number,
    channels?: number,
    duration?: number,
    file?: IFileReference,
    algorithm?: string,
    name?: string,
    timeUnit?: TimeUnit
  ) {
    // Provide default placeholders for required fields
    super(file || new FileReference(""), duration || 0, name, timeUnit);
    this.sampleRate = sampleRate || 0; // Default placeholder
    this.channels = channels || 0; // Default placeholder
    this.algorithm = algorithm;
    // duration and file are handled by the super constructor
  }

  toXmlObject(): any {
    const obj: any = {
      Video: {
        ...super.toXmlObject(), // Get attributes and children from MediaFile's toXmlObject
        sampleRate: this.sampleRate,
        channels: this.channels,
      },
    };

    if (this.algorithm !== undefined) {
      obj.Video.algorithm = this.algorithm;
    }

    return obj;
  }

  fromXmlObject(xmlObject: any): this {
    super.fromXmlObject(xmlObject); // Populate inherited attributes from MediaFile

    // Extract required sampleRate, channels, duration, and file from xmlObject
    this.sampleRate =
      xmlObject.sampleRate !== undefined
        ? parseInt(xmlObject.sampleRate, 10)
        : 0;
    this.channels =
      xmlObject.channels !== undefined ? parseInt(xmlObject.channels, 10) : 0;
    this.duration =
      xmlObject.duration !== undefined ? parseFloat(xmlObject.duration) : 0;
    this.file = xmlObject.File
      ? new FileReference().fromXmlObject(xmlObject.File)
      : new FileReference("");

    this.algorithm = xmlObject.algorithm || undefined;

    return this;
  }
}
