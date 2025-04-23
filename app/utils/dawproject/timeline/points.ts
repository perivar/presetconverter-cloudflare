import { XMLBuilder, XMLParser } from "fast-xml-parser";

import type { IPoints, ITrack } from "../types";
import { Unit } from "../unit";
import { XML_BUILDER_OPTIONS, XML_PARSER_OPTIONS } from "../xml/options";
import { AutomationTarget } from "./automationTarget";
import { Point } from "./point";
import { Timeline } from "./timeline";
import { TimeUnit } from "./timeUnit";

export class Points extends Timeline implements IPoints {
  target: AutomationTarget;
  points: Point[];
  unit?: Unit;

  constructor(
    target?: AutomationTarget,
    points?: Point[],
    unit?: Unit,
    track?: ITrack,
    timeUnit?: TimeUnit,
    name?: string,
    color?: string,
    comment?: string
  ) {
    super(track, timeUnit, name, color, comment);
    this.target = target || new AutomationTarget();
    this.points = points || [];
    this.unit = unit;
  }

  toXmlObject(): any {
    const obj: any = {
      Points: {
        ...super.getXmlAttributes(), // Get attributes from Timeline
      },
    };

    // Append Target element
    if (this.target) {
      obj.Points.Target = this.target.toXmlObject(); // Assuming AutomationTarget has toXmlObject
    }

    // Append child elements for each point
    if (this.points && this.points.length > 0) {
      obj.Points.Point = this.points.map(point => point.toXmlObject()); // Assuming Point subclasses have toXmlObject
    }

    if (this.unit !== undefined) {
      obj.Points["@_unit"] = this.unit;
    }

    return obj;
  }

  toXml(): string {
    const builder = new XMLBuilder(XML_BUILDER_OPTIONS);
    return builder.build(this.toXmlObject());
  }

  static fromXmlObject(xmlObject: any): Points {
    const instance = new Points(); // Create instance of Points
    instance.populateFromXml(xmlObject); // Populate inherited attributes from Timeline

    // Process Target element
    if (xmlObject.Target) {
      instance.target = AutomationTarget.fromXmlObject(xmlObject.Target); // Assuming AutomationTarget has a static fromXmlObject
    }

    // Process child elements of type Point and its subclasses
    const points: Point[] = [];
    if (xmlObject.Point) {
      const pointArray = Array.isArray(xmlObject.Point)
        ? xmlObject.Point
        : [xmlObject.Point];
      pointArray.forEach((pointObj: any) => {
        // This part needs a mechanism to determine the correct subclass of Point
        // based on the XML element tag (e.g., RealPoint, EnumPoint, etc.)
        // For now, we'll skip deserialization of nested points
        console.warn(
          `Skipping deserialization of nested point elements in Points`
        );
      });
    }
    instance.points = points;

    instance.unit = xmlObject.unit ? (xmlObject.unit as Unit) : undefined; // Cast string to Unit

    return instance;
  }

  static fromXml(xmlString: string): Points {
    const parser = new XMLParser(XML_PARSER_OPTIONS);
    const jsonObj = parser.parse(xmlString);
    return Points.fromXmlObject(jsonObj.Points);
  }
}
