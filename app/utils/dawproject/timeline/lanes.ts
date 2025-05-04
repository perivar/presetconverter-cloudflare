import {
  registerTimeline,
  TimelineRegistry,
} from "../registry/timelineRegistry";
import type { ILanes, ITrack } from "../types";
import { Timeline } from "./timeline";
import { TimeUnit } from "./timeUnit";

const lanesFactory = (xmlObject: any): Lanes => {
  const instance = new Lanes();
  instance.fromXmlObject(xmlObject.Lanes); // Assuming XML is wrapped in <Lanes>
  return instance;
};

@registerTimeline("Lanes", lanesFactory)
export class Lanes extends Timeline implements ILanes {
  lanes: Timeline[];

  constructor(
    lanes?: Timeline[],
    track?: ITrack,
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
        ...super.toXmlObject(), // Get attributes from Timeline
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

  override fromXmlObject(xmlObject: any): this {
    super.fromXmlObject(xmlObject); // Populate inherited attributes from Timeline

    const lanes: Timeline[] = [];

    // Iterate through all properties in xmlObject to find Timeline elements
    for (const tagName in xmlObject) {
      // Skip attributes (those starting with @_) and root Lanes element
      if (tagName === "Lanes" || tagName.startsWith("@_")) continue;

      // Use the new createTimelineFromXml method
      const timelineInstance = TimelineRegistry.createTimelineFromXml(
        tagName,
        xmlObject[tagName]
      );
      if (timelineInstance) {
        lanes.push(timelineInstance);
      } else {
        console.warn(
          `Skipping deserialization of unknown nested timeline element: ${tagName}`
        );
      }
    }

    this.lanes = lanes;
    return this;
  }
}
