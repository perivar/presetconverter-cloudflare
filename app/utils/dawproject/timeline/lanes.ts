import { XMLBuilder, XMLParser } from "fast-xml-parser";

import type { ILanes } from "../types";
import { Timeline } from "./timeline";
import { registerTimeline, TimelineRegistry } from "./timelineRegistry";
import { TimeUnit } from "./timeUnit";

@registerTimeline("Lanes")
export class Lanes extends Timeline implements ILanes {
  lanes: Timeline[];

  constructor(
    lanes?: Timeline[],
    track?: string,
    timeUnit?: TimeUnit,
    name?: string,
    color?: string,
    comment?: string
  ) {
    super(track, timeUnit, name, color, comment);
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

  static override fromXmlObject(xmlObject: any): Lanes {
    const instance = new Lanes();
    instance.populateFromXml(xmlObject);

    const lanes: Timeline[] = [];

    // Iterate through all properties in xmlObject to find Timeline elements
    for (const tagName in xmlObject) {
      if (tagName === "Lanes") continue; // Skip the root Lanes element itself

      const TimelineClass = TimelineRegistry.getTimelineClass(tagName);
      if (TimelineClass) {
        const laneData = xmlObject[tagName];
        const laneArray = Array.isArray(laneData) ? laneData : [laneData];

        for (const laneObj of laneArray) {
          try {
            const timelineInstance = TimelineClass.fromXmlObject(laneObj);
            lanes.push(timelineInstance);
          } catch (e) {
            console.error(
              `Error deserializing nested timeline element ${tagName}:`,
              e
            );
          }
        }
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
