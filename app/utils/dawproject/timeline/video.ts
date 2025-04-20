import { XMLBuilder, XMLParser } from "fast-xml-parser";

import { FileReference } from "../fileReference";
import { IMediaFile, MediaFile } from "./mediaFile";
import { TimeUnit } from "./timeUnit";

export interface IVideo extends IMediaFile {
  algorithm?: string;
  channels: number; // Assuming video also has channels based on XSD
  sampleRate: number; // Assuming video also has sampleRate based on XSD
}

export class Video extends MediaFile implements IVideo {
  algorithm?: string;
  channels: number;
  sampleRate: number;

  constructor(
    sampleRate: number,
    channels: number,
    duration: number,
    algorithm?: string,
    file?: FileReference,
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
    const builder = new XMLBuilder({ attributeNamePrefix: "" });
    return builder.build(this.toXmlObject());
  }

  static fromXmlObject(xmlObject: any): Video {
    const instance = new Video(0, 0, 0); // Create instance with default values
    instance.populateFromXml(xmlObject); // Populate inherited attributes from MediaFile

    instance.sampleRate =
      xmlObject.sampleRate !== undefined
        ? parseInt(xmlObject.sampleRate, 10)
        : 0;
    instance.channels =
      xmlObject.channels !== undefined ? parseInt(xmlObject.channels, 10) : 0;
    instance.algorithm = xmlObject.algorithm || undefined;

    return instance;
  }

  static fromXml(xmlString: string): Video {
    const parser = new XMLParser({ attributeNamePrefix: "" });
    const jsonObj = parser.parse(xmlString);
    return Video.fromXmlObject(jsonObj.Video);
  }
}
