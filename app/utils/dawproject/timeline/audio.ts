import { FileReference } from "../fileReference";
import { registerTimeline } from "../registry/timelineRegistry";
import type { IAudio, IFileReference } from "../types"; // Import IFileReference

import { MediaFile } from "./mediaFile";
import { TimeUnit } from "./timeUnit";

const audioFactory = (xmlObject: any): Audio => {
  const instance = new Audio();
  instance.fromXmlObject(xmlObject);
  return instance;
};

@registerTimeline("Audio", audioFactory)
export class Audio extends MediaFile implements IAudio {
  sampleRate: number;
  channels: number;
  algorithm?: string;

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
  }

  toXmlObject(): any {
    const obj: any = {
      Audio: {
        ...super.toXmlObject(), // Get attributes and children from MediaFile's toXmlObject
        "@_sampleRate": this.sampleRate,
        "@_channels": this.channels,
      },
    };

    if (this.algorithm !== undefined) {
      obj.Audio["@_algorithm"] = this.algorithm;
    }

    return obj;
  }

  fromXmlObject(xmlObject: any): this {
    super.fromXmlObject(xmlObject);

    if (!xmlObject["@_sampleRate"]) {
      throw new Error("Required attribute 'sampleRate' missing in Audio XML");
    }
    this.sampleRate = parseInt(xmlObject["@_sampleRate"], 10);

    if (!xmlObject["@_channels"]) {
      throw new Error("Required attribute 'channels' missing in Audio XML");
    }
    this.channels = parseInt(xmlObject["@_channels"], 10);

    if (xmlObject["@_algorithm"] !== undefined) {
      this.algorithm = xmlObject["@_algorithm"];
    }

    return this;
  }
}
