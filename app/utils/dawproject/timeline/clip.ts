import { XMLBuilder, XMLParser } from "fast-xml-parser";

import { DoubleAdapter } from "../doubleAdapter";
import { Nameable } from "../nameable";
import { TimelineRegistry } from "../registry/timelineRegistry";
import type { IClip } from "../types";
import { XML_BUILDER_OPTIONS, XML_PARSER_OPTIONS } from "../xml/options";
import { Timeline } from "./timeline";
import { TimeUnit } from "./timeUnit";

export class Clip extends Nameable implements IClip {
  time: number;
  duration?: number;
  contentTimeUnit?: TimeUnit;
  playStart?: number;
  playStop?: number;
  loopStart?: number;
  loopEnd?: number;
  fadeTimeUnit?: TimeUnit;
  fadeInTime?: number;
  fadeOutTime?: number;
  content?: Timeline;
  reference?: string; // Change type to string | undefined

  constructor(
    time: number,
    duration?: number,
    contentTimeUnit?: TimeUnit,
    playStart?: number,
    playStop?: number,
    loopStart?: number,
    loopEnd?: number,
    fadeTimeUnit?: TimeUnit,
    fadeInTime?: number,
    fadeOutTime?: number,
    content?: Timeline,
    reference?: string, // Change type to string | undefined
    name?: string,
    color?: string,
    comment?: string
  ) {
    super(name, color, comment);
    this.time = time;
    this.duration = duration;
    this.contentTimeUnit = contentTimeUnit;
    this.playStart = playStart;
    this.playStop = playStop;
    this.loopStart = loopStart;
    this.loopEnd = loopEnd;
    this.fadeTimeUnit = fadeTimeUnit;
    this.fadeInTime = fadeInTime;
    this.fadeOutTime = fadeOutTime;
    this.content = content;
    this.reference = reference; // Assign string directly
  }

  toXmlObject(): any {
    const obj: any = {
      Clip: {
        ...super.getXmlAttributes(), // Get attributes from Nameable
        "@_time": DoubleAdapter.toXml(this.time) || "",
      },
    };

    if (this.duration !== undefined) {
      obj.Clip["@_duration"] = DoubleAdapter.toXml(this.duration) || "";
    }
    if (this.contentTimeUnit !== undefined) {
      obj.Clip["@_contentTimeUnit"] = this.contentTimeUnit;
    }
    if (this.playStart !== undefined) {
      obj.Clip["@_playStart"] = DoubleAdapter.toXml(this.playStart) || "";
    }
    if (this.playStop !== undefined) {
      obj.Clip["@_playStop"] = DoubleAdapter.toXml(this.playStop) || "";
    }
    if (this.loopStart !== undefined) {
      obj.Clip["@_loopStart"] = DoubleAdapter.toXml(this.loopStart) || "";
    }
    if (this.loopEnd !== undefined) {
      obj.Clip["@_loopEnd"] = DoubleAdapter.toXml(this.loopEnd) || "";
    }
    if (this.fadeTimeUnit !== undefined) {
      obj.Clip["@_fadeTimeUnit"] = this.fadeTimeUnit;
    }
    if (this.fadeInTime !== undefined) {
      obj.Clip["@_fadeInTime"] = DoubleAdapter.toXml(this.fadeInTime) || "";
    }
    if (this.fadeOutTime !== undefined) {
      obj.Clip["@_fadeOutTime"] = DoubleAdapter.toXml(this.fadeOutTime) || "";
    }

    // Append content if present
    if (this.content !== undefined) {
      // Assuming content is a Timeline subclass and has a toXmlObject method
      const contentObj = this.content.toXmlObject();
      const tagName = Object.keys(contentObj)[0];
      obj.Clip[tagName] = contentObj[tagName];
    }

    // Reference handling
    if (this.reference !== undefined) {
      obj.Clip["@_reference"] = this.reference; // Assign string directly
    }

    return obj;
  }

  toXml(): string {
    const builder = new XMLBuilder(XML_BUILDER_OPTIONS);
    return builder.build(this.toXmlObject());
  }

  static fromXmlObject(xmlObject: any): Clip {
    const instance = new Clip(0); // Create instance with a default time
    instance.populateFromXml(xmlObject); // Populate inherited attributes

    instance.time =
      xmlObject["@_time"] !== undefined
        ? DoubleAdapter.fromXml(xmlObject["@_time"]) || 0
        : 0;
    instance.duration =
      xmlObject["@_duration"] !== undefined
        ? DoubleAdapter.fromXml(xmlObject["@_duration"])
        : undefined;
    instance.contentTimeUnit = xmlObject["@_contentTimeUnit"]
      ? (xmlObject["@_contentTimeUnit"] as TimeUnit)
      : undefined;
    instance.playStart =
      xmlObject["@_playStart"] !== undefined
        ? DoubleAdapter.fromXml(xmlObject["@_playStart"])
        : undefined;
    instance.playStop =
      xmlObject["@_playStop"] !== undefined
        ? DoubleAdapter.fromXml(xmlObject["@_playStop"])
        : undefined;
    instance.loopStart =
      xmlObject["@_loopStart"] !== undefined
        ? DoubleAdapter.fromXml(xmlObject["@_loopStart"])
        : undefined;
    instance.loopEnd =
      xmlObject["@_loopEnd"] !== undefined
        ? DoubleAdapter.fromXml(xmlObject["@_loopEnd"])
        : undefined;
    instance.fadeTimeUnit = xmlObject["@_fadeTimeUnit"]
      ? (xmlObject["@_fadeTimeUnit"] as TimeUnit)
      : undefined;
    instance.fadeInTime =
      xmlObject["@_fadeInTime"] !== undefined
        ? DoubleAdapter.fromXml(xmlObject["@_fadeInTime"])
        : undefined;
    instance.fadeOutTime =
      xmlObject["@_fadeOutTime"] !== undefined
        ? DoubleAdapter.fromXml(xmlObject["@_fadeOutTime"])
        : undefined;

    // Handle content if present
    for (const tagName in xmlObject) {
      if (
        tagName === "@_time" ||
        tagName === "@_duration" ||
        tagName === "@_contentTimeUnit" ||
        tagName === "@_playStart" ||
        tagName === "@_playStop" ||
        tagName === "@_loopStart" ||
        tagName === "@_loopEnd" ||
        tagName === "@_fadeTimeUnit" ||
        tagName === "@_fadeInTime" ||
        tagName === "@_fadeOutTime" ||
        tagName === "@_reference"
      ) {
        continue; // Skip known properties
      }

      const TimelineClass = TimelineRegistry.getTimelineClass(tagName);
      if (TimelineClass) {
        try {
          instance.content = TimelineClass.fromXmlObject(xmlObject[tagName]);
          break; // We found and processed the content
        } catch (e) {
          console.error(
            `Error deserializing nested timeline content ${tagName} in Clip:`,
            e
          );
        }
      }
    }

    instance.reference = xmlObject["@_reference"]; // Assign string directly

    return instance;
  }

  static fromXml(xmlString: string): Clip {
    const parser = new XMLParser(XML_PARSER_OPTIONS);
    const jsonObj = parser.parse(xmlString);
    return Clip.fromXmlObject(jsonObj.Clip);
  }
}
