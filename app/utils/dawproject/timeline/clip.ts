import { DoubleAdapter } from "../doubleAdapter";
import { Nameable } from "../nameable";
import { TimelineRegistry } from "../registry/timelineRegistry";
import type { IClip } from "../types";
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
    // Make time optional for deserialization, fromXmlObject will set it
    time?: number,
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
    this.time = time || 0; // Provide a default placeholder
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
        ...super.toXmlObject(), // Get attributes from Nameable
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

  fromXmlObject(xmlObject: any): this {
    super.fromXmlObject(xmlObject); // Populate inherited attributes

    this.time =
      xmlObject["@_time"] !== undefined
        ? DoubleAdapter.fromXml(xmlObject["@_time"]) || 0
        : 0;
    this.duration =
      xmlObject["@_duration"] !== undefined
        ? DoubleAdapter.fromXml(xmlObject["@_duration"])
        : undefined;
    this.contentTimeUnit = xmlObject["@_contentTimeUnit"]
      ? (xmlObject["@_contentTimeUnit"] as TimeUnit)
      : undefined;
    this.playStart =
      xmlObject["@_playStart"] !== undefined
        ? DoubleAdapter.fromXml(xmlObject["@_playStart"])
        : undefined;
    this.playStop =
      xmlObject["@_playStop"] !== undefined
        ? DoubleAdapter.fromXml(xmlObject["@_playStop"])
        : undefined;
    this.loopStart =
      xmlObject["@_loopStart"] !== undefined
        ? DoubleAdapter.fromXml(xmlObject["@_loopStart"])
        : undefined;
    this.loopEnd =
      xmlObject["@_loopEnd"] !== undefined
        ? DoubleAdapter.fromXml(xmlObject["@_loopEnd"])
        : undefined;
    this.fadeTimeUnit = xmlObject["@_fadeTimeUnit"]
      ? (xmlObject["@_fadeTimeUnit"] as TimeUnit)
      : undefined;
    this.fadeInTime =
      xmlObject["@_fadeInTime"] !== undefined
        ? DoubleAdapter.fromXml(xmlObject["@_fadeInTime"])
        : undefined;
    this.fadeOutTime =
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

      // Use the new createTimelineFromXml method
      const timelineInstance = TimelineRegistry.createTimelineFromXml(
        tagName,
        xmlObject[tagName]
      );
      if (timelineInstance) {
        this.content = timelineInstance;
        break; // We found and processed the content
      } else {
        console.warn(
          `Skipping deserialization of unknown nested timeline content in Clip: ${tagName}`
        );
      }
    }

    this.reference = xmlObject["@_reference"]; // Assign string directly

    return this;
  }
}
