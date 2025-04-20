import { XMLBuilder, XMLParser } from "fast-xml-parser";

import { FileReference } from "../fileReference";
import { IMediaFile, MediaFile } from "./mediaFile";
import { TimeUnit } from "./timeUnit";

export interface IAudio extends IMediaFile {
  sampleRate: number;
  channels: number;
  algorithm?: string;
}

export class Audio extends MediaFile implements IAudio {
  sampleRate: number;
  channels: number;
  algorithm?: string;

  constructor(
    sampleRate: number,
    channels: number,
    duration: number,
    algorithm?: string,
    file?: FileReference,
    name?: string,
    timeUnit?: TimeUnit
  ) {
    super(file, duration, name, timeUnit); // Pass timeUnit to MediaFile constructor
    this.sampleRate = sampleRate;
    this.channels = channels;
    this.algorithm = algorithm;
  }

  toXmlObject(): any {
    const obj: any = {
      Audio: {
        ...super.getXmlAttributes(), // Get attributes from MediaFile
        ...super.getXmlChildren(), // Get children from MediaFile
        sampleRate: this.sampleRate,
        channels: this.channels,
      },
    };

    if (this.algorithm !== undefined) {
      obj.Audio.algorithm = this.algorithm;
    }

    return obj;
  }

  toXml(): string {
    const builder = new XMLBuilder({ attributeNamePrefix: "" });
    return builder.build(this.toXmlObject());
  }

  static fromXmlObject(xmlObject: any): Audio {
    const instance = new Audio(0, 0, 0); // Create instance with default values
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

  static fromXml(xmlString: string): Audio {
    const parser = new XMLParser({ attributeNamePrefix: "" });
    const jsonObj = parser.parse(xmlString);
    return Audio.fromXmlObject(jsonObj.Audio);
  }
}
