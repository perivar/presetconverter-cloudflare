import { XMLBuilder, XMLParser } from "fast-xml-parser";

import { Arrangement } from "../arrangement";
import { Channel } from "../channel";
import { Scene } from "../scene";
import { Track } from "../track";
import { ILanes } from "../types";
import { Audio } from "./audio";
import { Clips } from "./clips";
import { ClipSlot } from "./clipSlot";
import { Markers } from "./markers";
import { Notes } from "./notes";
import { Points } from "./points";
import { Timeline } from "./timeline";
import { Video } from "./video";
import { Warps } from "./warps";

export class Lanes extends Timeline implements ILanes {
  lanes: Timeline[];

  constructor(
    lanes?: Timeline[],
    track?: string,
    timeUnit?: string, // Use string for now, will refine with TimeUnit enum later
    name?: string,
    color?: string,
    comment?: string
  ) {
    super(track, timeUnit as any, name, color, comment); // Cast timeUnit for now
    this.lanes = lanes || [];
  }

  toXmlObject(): any {
    const obj: any = {
      Lanes: {
        ...super.getXmlAttributes(), // Get attributes from Timeline
      },
    };

    // Append child elements for each lane
    if (this.lanes && this.lanes.length > 0) {
      // Need to handle different types of Timeline subclasses
      obj.Lanes = {
        ...obj.Lanes, // Keep existing attributes
        ...this.lanes.reduce((acc: any, lane) => {
          const laneObj = lane.toXmlObject();
          const tagName = Object.keys(laneObj)[0]; // Get the root tag name from the object
          if (!acc[tagName]) {
            acc[tagName] = [];
          }
          acc[tagName].push(laneObj[tagName]);
          return acc;
        }, {}),
      };
    }

    return obj;
  }

  toXml(): string {
    const builder = new XMLBuilder({ attributeNamePrefix: "" });
    return builder.build(this.toXmlObject());
  }

  static fromXmlObject(xmlObject: any): Lanes {
    const instance = new Lanes(); // Create instance of Lanes
    instance.populateFromXml(xmlObject); // Populate inherited attributes from Timeline

    // Process child elements of type Timeline
    const lanes: Timeline[] = [];
    // Need a mechanism to determine the correct subclass of Timeline
    // based on the XML element tag (e.g., Timeline, Lanes, Notes, Clips, etc.)
    // This requires mapping tag names to their corresponding fromXmlObject methods.
    const timelineTypeMap: { [key: string]: (obj: any) => any } = {
      // Changed return type to any
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
      Warps: Warps.fromXmlObject,
      // Add other Timeline subclasses here
    };

    for (const tagName in xmlObject) {
      if (timelineTypeMap[tagName]) {
        const laneData = xmlObject[tagName];
        const laneArray = Array.isArray(laneData) ? laneData : [laneData];
        laneArray.forEach((laneObj: any) => {
          try {
            lanes.push(timelineTypeMap[tagName](laneObj) as Timeline); // Cast to Timeline
          } catch (e) {
            console.error(
              `Error deserializing nested timeline element ${tagName}:`,
              e
            );
          }
        });
      }
    }
    instance.lanes = lanes;

    return instance;
  }

  static fromXml(xmlString: string): Lanes {
    const parser = new XMLParser({ attributeNamePrefix: "" });
    const jsonObj = parser.parse(xmlString);
    return Lanes.fromXmlObject(jsonObj.Lanes);
  }
}
