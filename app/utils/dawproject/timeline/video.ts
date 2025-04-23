import { XMLBuilder, XMLParser } from "fast-xml-parser";

import { FileReference } from "../fileReference";
import type { IFileReference, IVideo } from "../types"; // Import IFileReference

import { XML_BUILDER_OPTIONS, XML_PARSER_OPTIONS } from "../xml/options";
import { MediaFile } from "./mediaFile";
import { TimeUnit } from "./timeUnit";

export class Video extends MediaFile implements IVideo {
  algorithm?: string;
  channels: number;
  sampleRate: number;

  constructor(
    sampleRate: number,
    channels: number,
    duration: number,
    file: IFileReference, // Made required and changed type to interface
    algorithm?: string,
    name?: string,
    timeUnit?: TimeUnit
  ) {
    super(file, duration, name, timeUnit); // Pass relevant args to MediaFile constructor
    this.sampleRate = sampleRate;
    this.channels = channels;
    this.algorithm = algorithm;
  }

  toXmlObject(): any {
    const obj: any = {
      Video: {
        ...super.getXmlAttributes(), // Get attributes from MediaFile
        ...super.getXmlChildren(), // Get children from MediaFile
        sampleRate: this.sampleRate,
        channels: this.channels,
      },
    };

    if (this.algorithm !== undefined) {
      obj.Video.algorithm = this.algorithm;
    }

    return obj;
  }

  toXml(): string {
    const builder = new XMLBuilder(XML_BUILDER_OPTIONS);
    return builder.build(this.toXmlObject());
  }

  static fromXmlObject(xmlObject: any): Video {
    // Extract required sampleRate, channels, duration, and file from xmlObject
    const sampleRate =
      xmlObject.sampleRate !== undefined
        ? parseInt(xmlObject.sampleRate, 10)
        : 0;
    const channels =
      xmlObject.channels !== undefined ? parseInt(xmlObject.channels, 10) : 0;
    const duration =
      xmlObject.duration !== undefined ? parseFloat(xmlObject.duration) : 0; // Assuming duration is a float
    const file = xmlObject.File
      ? FileReference.fromXmlObject(xmlObject.File)
      : new FileReference(""); // Assuming FileReference has fromXmlObject and requires a path

    const instance = new Video(sampleRate, channels, duration, file); // Create instance with required properties
    instance.populateFromXml(xmlObject); // Populate inherited attributes from MediaFile

    instance.algorithm = xmlObject.algorithm || undefined;

    return instance;
  }

  static fromXml(xmlString: string): Video {
    const parser = new XMLParser(XML_PARSER_OPTIONS);
    const jsonObj = parser.parse(xmlString);
    return Video.fromXmlObject(jsonObj.Video);
  }
}
