import { XMLBuilder, XMLParser } from "fast-xml-parser";

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
    time: number,
    duration: number,
    key: number,
    channel: number = 0,
    velocity?: number,
    releaseVelocity?: number,
    content?: Timeline
  ) {
    super();
    this.time = time;
    this.duration = duration;
    this.key = key;
    this.channel = channel;
    this.velocity = velocity;
    this.releaseVelocity = releaseVelocity;
    this.content = content;
  }

  toXmlObject(): any {
    const obj: any = {
      Note: {
        time: DoubleAdapter.toXml(this.time) || "",
        duration: DoubleAdapter.toXml(this.duration) || "",
        key: this.key,
      },
    };

    if (this.channel !== undefined) {
      obj.Note.channel = this.channel;
    }
    if (this.velocity !== undefined) {
      obj.Note.vel = DoubleAdapter.toXml(this.velocity) || "";
    }
    if (this.releaseVelocity !== undefined) {
      obj.Note.rel = DoubleAdapter.toXml(this.releaseVelocity) || "";
    }
    if (this.content !== undefined) {
      // Assuming content is a Timeline subclass and has a toXmlObject method
      const contentObj = this.content.toXmlObject();
      const tagName = Object.keys(contentObj)[0];
      obj.Note.Content = { [tagName]: contentObj[tagName] }; // Wrap in "Content" tag
    }

    return obj;
  }

  toXml(): string {
    const builder = new XMLBuilder({ attributeNamePrefix: "" });
    return builder.build(this.toXmlObject());
  }

  static fromXmlObject(xmlObject: any): Note {
    const time =
      xmlObject.time !== undefined
        ? DoubleAdapter.fromXml(xmlObject.time) || 0
        : 0;
    const duration =
      xmlObject.duration !== undefined
        ? DoubleAdapter.fromXml(xmlObject.duration) || 0
        : 0;
    const key = xmlObject.key !== undefined ? parseInt(xmlObject.key, 10) : 0;
    const channel =
      xmlObject.channel !== undefined ? parseInt(xmlObject.channel, 10) : 0;
    const velocity =
      xmlObject.vel !== undefined
        ? DoubleAdapter.fromXml(xmlObject.vel)
        : undefined;
    const releaseVelocity =
      xmlObject.rel !== undefined
        ? DoubleAdapter.fromXml(xmlObject.rel)
        : undefined;

    // Handle content if present
    let content: Timeline | undefined;
    if (xmlObject.Content) {
      const contentObj = xmlObject.Content;
      const tagName = Object.keys(contentObj)[0]; // Get the actual content tag name
      const TimelineClass = TimelineRegistry.getTimelineClass(tagName);

      if (TimelineClass) {
        try {
          content = TimelineClass.fromXmlObject(contentObj[tagName]);
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

    return new Note(
      time,
      duration,
      key,
      channel,
      velocity,
      releaseVelocity,
      content
    );
  }

  static fromXml(xmlString: string): Note {
    const parser = new XMLParser({ attributeNamePrefix: "" });
    const jsonObj = parser.parse(xmlString);
    return Note.fromXmlObject(jsonObj.Note);
  }
}
