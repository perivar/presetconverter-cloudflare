import { XMLBuilder, XMLParser } from "fast-xml-parser";

import {
  registerTimeline,
  TimelineRegistry,
} from "../registry/timelineRegistry";
import type { ITrack, IWarps } from "../types";
import { XML_BUILDER_OPTIONS, XML_PARSER_OPTIONS } from "../xml/options";
import { Timeline } from "./timeline";
import { TimeUnit } from "./timeUnit";
import { Warp } from "./warp";

@registerTimeline("Warps")
export class Warps extends Timeline implements IWarps {
  points: Warp[]; // Renamed from events and made required
  content?: Timeline;
  contentTimeUnit: TimeUnit; // Made required

  constructor(
    points: Warp[], // Made required
    contentTimeUnit: TimeUnit, // Made required
    content?: Timeline,
    track?: ITrack,
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
    const builder = new XMLBuilder(XML_BUILDER_OPTIONS);
    return builder.build(this.toXmlObject());
  }

  static fromXmlObject(xmlObject: any): Warps {
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
    const parser = new XMLParser(XML_PARSER_OPTIONS);
    const jsonObj = parser.parse(xmlString);
    return Warps.fromXmlObject(jsonObj.Warps);
  }
}
