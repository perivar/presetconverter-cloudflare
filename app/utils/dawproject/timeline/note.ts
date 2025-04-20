import { XMLBuilder, XMLParser } from "fast-xml-parser";

import { Arrangement } from "../arrangement";
import { Channel } from "../channel";
import { DoubleAdapter } from "../doubleAdapter";
import { Scene } from "../scene";
import { Track } from "../track";
import { Audio } from "./audio";
import { Clips } from "./clips";
import { ClipSlot } from "./clipSlot";
import { Markers } from "./markers";
import { Notes as NotesTimeline } from "./notes"; // Renamed to avoid conflict

import { Points } from "./points";
import { ITimeline, Timeline } from "./timeline";
import { Video } from "./video";
import { Warps } from "./warps";

export interface INote {
  time: number;
  duration: number;
  key: number;
  channel?: number;
  velocity?: number;
  releaseVelocity?: number;
  content?: ITimeline;
}

export class Note implements INote {
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

    let content: Timeline | undefined;
    if (xmlObject.Content) {
      // Handling content which is wrapped in a "Content" tag
      const contentObj = xmlObject.Content;
      const tagName = Object.keys(contentObj)[0]; // Get the actual content tag name

      // Need a mechanism to determine the correct subclass of Timeline
      // based on the XML element tag (e.g., Timeline, Lanes, Notes, Clips, etc.)
      const timelineTypeMap: { [key: string]: (obj: any) => any } = {
        Clips: Clips.fromXmlObject,
        Notes: NotesTimeline.fromXmlObject, // Use the renamed import
        Audio: Audio.fromXmlObject,
        Video: Video.fromXmlObject,
        Markers: Markers.fromXmlObject,
        Arrangement: Arrangement.fromXmlObject,
        Scene: Scene.fromXmlObject,
        Track: Track.fromXmlObject,
        Channel: Channel.fromXmlObject,
        ClipSlot: ClipSlot.fromXmlObject,
        Points: Points.fromXmlObject,
        Warps: Warps.fromXmlObject,
        // Add other Timeline subclasses here
      };

      if (timelineTypeMap[tagName]) {
        try {
          content = timelineTypeMap[tagName](contentObj[tagName]) as Timeline; // Cast to Timeline
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
