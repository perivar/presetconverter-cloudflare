import { DoubleAdapter } from "../doubleAdapter";
import { TimelineRegistry } from "../registry/timelineRegistry";
import type { INote } from "../types";
import { XmlObject } from "../XmlObject";
import { Timeline } from "./timeline";

export class Note extends XmlObject implements INote {
  time: number;
  duration: number;
  key: number;
  channel?: number;
  velocity?: number;
  releaseVelocity?: number;
  content?: Timeline;

  constructor(
    // Make required fields optional for deserialization, provide defaults
    time?: number,
    duration?: number,
    key?: number,
    channel: number = 0,
    velocity?: number,
    releaseVelocity?: number,
    content?: Timeline
  ) {
    super();
    // Provide default placeholders for required fields
    this.time = time || 0;
    this.duration = duration || 0;
    this.key = key || 0;
    this.channel = channel;
    this.velocity = velocity;
    this.releaseVelocity = releaseVelocity;
    this.content = content;
  }

  toXmlObject(): any {
    const obj: any = {
      Note: {
        "@_time": DoubleAdapter.toXml(this.time) || "",
        "@_duration": DoubleAdapter.toXml(this.duration) || "",
        "@_key": this.key,
      },
    };

    if (this.channel !== undefined) {
      obj.Note["@_channel"] = this.channel;
    }
    if (this.velocity !== undefined) {
      obj.Note["@_vel"] = DoubleAdapter.toXml(this.velocity) || "";
    }
    if (this.releaseVelocity !== undefined) {
      obj.Note["@_rel"] = DoubleAdapter.toXml(this.releaseVelocity) || "";
    }
    if (this.content !== undefined) {
      const contentObj = this.content.toXmlObject();
      const tagName = Object.keys(contentObj)[0];
      obj.Note.Content = { [tagName]: contentObj[tagName] }; // Wrap in "Content" tag
    }

    return obj;
  }

  fromXmlObject(xmlObject: any): this {
    this.time =
      xmlObject["@_time"] !== undefined
        ? DoubleAdapter.fromXml(xmlObject["@_time"]) || 0
        : 0;
    this.duration =
      xmlObject["@_duration"] !== undefined
        ? DoubleAdapter.fromXml(xmlObject["@_duration"]) || 0
        : 0;
    this.key =
      xmlObject["@_key"] !== undefined ? parseInt(xmlObject["@_key"], 10) : 0;
    this.channel =
      xmlObject["@_channel"] !== undefined
        ? parseInt(xmlObject["@_channel"], 10)
        : 0;
    this.velocity =
      xmlObject["@_vel"] !== undefined
        ? DoubleAdapter.fromXml(xmlObject["@_vel"])
        : undefined;
    this.releaseVelocity =
      xmlObject["@_rel"] !== undefined
        ? DoubleAdapter.fromXml(xmlObject["@_rel"])
        : undefined;

    // Handle content if present
    if (xmlObject.Content) {
      const contentObj = xmlObject.Content;
      const tagName = Object.keys(contentObj)[0]; // Get the actual content tag name
      const TimelineClass = TimelineRegistry.getTimelineClass(tagName);

      if (TimelineClass) {
        try {
          this.content = new TimelineClass().fromXmlObject(contentObj[tagName]);
        } catch (e) {
          console.error(
            `Error deserializing nested timeline content ${tagName} in Note:`,
            e
          );
        }
      } else {
        console.warn(
          `Skipping deserialization of unknown nested timeline content in Note: ${tagName}`
        );
      }
    }

    return this;
  }
}
