import { XMLBuilder, XMLParser } from "fast-xml-parser";

import { Arrangement } from "../arrangement";
import { Channel } from "../channel";
import { Scene } from "../scene";
import { Track } from "../track";
import { IWarps } from "../types";
import { Audio } from "./audio";
import { Clips } from "./clips";
import { ClipSlot } from "./clipSlot";
import { Markers } from "./markers";
import { Notes } from "./notes";
import { Points } from "./points";
import { Timeline } from "./timeline";
import { TimeUnit } from "./timeUnit";
import { Video } from "./video";
import { Warp } from "./warp";
import { Warps as WarpsTimeline } from "./warps"; // Renamed to avoid conflict

export class Warps extends Timeline implements IWarps {
  points: Warp[]; // Renamed from events and made required
  content?: Timeline;
  contentTimeUnit: TimeUnit; // Made required

  constructor(
    points: Warp[], // Made required
    contentTimeUnit: TimeUnit, // Made required
    content?: Timeline,
    track?: string,
    timeUnit?: TimeUnit,
    name?: string,
    color?: string,
    comment?: string
  ) {
    super(track, timeUnit, name, color, comment); // Pass relevant args to Timeline constructor
    this.points = points; // Assign required points
    this.content = content;
    this.contentTimeUnit = contentTimeUnit; // Assign required contentTimeUnit
  }

  toXmlObject(): any {
    const obj: any = {
      Warps: {
        ...super.getXmlAttributes(), // Populate inherited attributes from Timeline
        contentTimeUnit: this.contentTimeUnit, // contentTimeUnit is required
      },
    };

    // Append the nested content (e.g., another Timeline)
    if (this.content) {
      // Assuming content is a Timeline subclass and has a toXmlObject method
      const contentObj = this.content.toXmlObject();
      const tagName = Object.keys(contentObj)[0];
      obj.Warps.Content = { [tagName]: contentObj[tagName] }; // Wrap in "Content" tag
    }

    // Recursively add nested Warp elements
    if (this.points && this.points.length > 0) {
      obj.Warps.Warp = this.points.map(warp => warp.toXmlObject().Warp); // Assuming Warp has toXmlObject and returns { Warp: ... }
    }

    return obj;
  }

  toXml(): string {
    const builder = new XMLBuilder({ attributeNamePrefix: "" });
    return builder.build(this.toXmlObject());
  }

  static fromXmlObject(xmlObject: any): Warps {
    // Parse content (which should be a Timeline or subclass)
    let content: Timeline | undefined;
    if (xmlObject.Content) {
      // Handling content which is wrapped in a "Content" tag
      const contentObj = xmlObject.Content;
      const tagName = Object.keys(contentObj)[0]; // Get the actual content tag name

      // Need a mechanism to determine the correct subclass of Timeline
      // based on the XML element tag (e.g., Timeline, Lanes, Notes, Clips, etc.)
      const timelineTypeMap: { [key: string]: (obj: any) => any } = {
        Clips: Clips.fromXmlObject,
        Notes: Notes.fromXmlObject,
        Audio: Audio.fromXmlObject,
        Video: Video.fromXmlObject,
        Markers: Markers.fromXmlObject,
        Arrangement: Arrangement.fromXmlObject,
        Scene: Scene.fromXmlObject,
        Track: Track.fromXmlObject,
        Channel: Channel.fromXmlObject,
        ClipSlot: ClipSlot.fromXmlObject,
        Points: Points.fromXmlObject,
        Warps: WarpsTimeline.fromXmlObject, // Use the renamed import
        // Add other Timeline subclasses here
      };

      if (timelineTypeMap[tagName]) {
        try {
          content = timelineTypeMap[tagName](contentObj[tagName]) as Timeline; // Cast to Timeline
        } catch (e) {
          console.error(
            `Error deserializing nested timeline content ${tagName} in Warps:`,
            e
          );
        }
      } else {
        console.warn(
          `Skipping deserialization of unknown nested timeline content in Warps: ${tagName}`
        );
      }
    }

    // Recursively parse nested Warp elements
    const points: Warp[] = []; // Renamed from events
    if (xmlObject.Warp) {
      const warpArray = Array.isArray(xmlObject.Warp)
        ? xmlObject.Warp
        : [xmlObject.Warp];
      warpArray.forEach((warpObj: any) => {
        points.push(Warp.fromXmlObject(warpObj)); // Assuming Warp has fromXmlObject
      });
    }

    // Parse the contentTimeUnit attribute
    const contentTimeUnit = xmlObject.contentTimeUnit
      ? (xmlObject.contentTimeUnit as TimeUnit)
      : undefined; // Cast string to TimeUnit

    // Create instance with required properties
    const instance = new Warps(points, contentTimeUnit as TimeUnit, content); // Pass required properties

    instance.populateFromXml(xmlObject); // Populate inherited attributes from Timeline

    return instance;
  }

  static fromXml(xmlString: string): Warps {
    const parser = new XMLParser({ attributeNamePrefix: "" });
    const jsonObj = parser.parse(xmlString);
    return Warps.fromXmlObject(jsonObj.Warps);
  }
}
