import { XMLBuilder, XMLParser } from "fast-xml-parser";

import { FileReference } from "../fileReference";
import type { IAudio } from "../types"; // Import IFileReference
import { MediaFile } from "./mediaFile";
import { TimeUnit } from "./timeUnit";

export class Audio extends MediaFile implements IAudio {
  sampleRate: number;
  channels: number;
  algorithm?: string;
  duration: number; // Explicitly declare duration
  file: FileReference; // Explicitly declare file with concrete type

  constructor(
    sampleRate: number,
    channels: number,
    duration: number,
    file: FileReference,
    algorithm?: string,
    name?: string,
    timeUnit?: TimeUnit
  ) {
    super(file, duration, name, timeUnit);
    this.sampleRate = sampleRate;
    this.channels = channels;
    this.algorithm = algorithm;
    this.duration = duration; // Assign duration
    this.file = file; // Assign file
  }

  toXmlObject(): any {
    const obj: any = {
      Audio: {
        ...super.getXmlAttributes(),
        ...super.getXmlChildren(),
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
    const sampleRate =
      xmlObject.sampleRate !== undefined
        ? parseInt(xmlObject.sampleRate, 10)
        : 0;
    const channels =
      xmlObject.channels !== undefined ? parseInt(xmlObject.channels, 10) : 0;
    const duration =
      xmlObject.duration !== undefined ? parseFloat(xmlObject.duration) : 0;
    const file = xmlObject.File
      ? FileReference.fromXmlObject(xmlObject.File)
      : new FileReference("");

    const instance = new Audio(sampleRate, channels, duration, file);
    instance.populateFromXml(xmlObject);

    instance.algorithm = xmlObject.algorithm || undefined;

    return instance;
  }

  static fromXml(xmlString: string): Audio {
    const parser = new XMLParser({ attributeNamePrefix: "" });
    const jsonObj = parser.parse(xmlString);
    return Audio.fromXmlObject(jsonObj.Audio);
  }
}
