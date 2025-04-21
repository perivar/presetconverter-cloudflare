import { XMLBuilder, XMLParser } from "fast-xml-parser";

import type { IMarkers } from "../types";
import { Marker } from "./marker";
import { Timeline } from "./timeline";
import { TimeUnit } from "./timeUnit";

export class Markers extends Timeline implements IMarkers {
  markers: Marker[];

  constructor(
    markers?: Marker[],
    track?: string,
    timeUnit?: TimeUnit,
    name?: string,
    color?: string,
    comment?: string
  ) {
    super(track, timeUnit, name, color, comment);
    this.markers = markers || [];
  }

  toXmlObject(): any {
    const obj: any = {
      Markers: {
        ...super.getXmlAttributes(), // Get attributes from Timeline
      },
    };

    // Append child elements for each marker
    if (this.markers && this.markers.length > 0) {
      obj.Markers.Marker = this.markers.map(marker => marker.toXmlObject()); // Assuming Marker has toXmlObject
    }

    return obj;
  }

  toXml(): string {
    const builder = new XMLBuilder({ attributeNamePrefix: "" });
    return builder.build(this.toXmlObject());
  }

  static fromXmlObject(xmlObject: any): Markers {
    const instance = new Markers(); // Create instance of Markers
    instance.populateFromXml(xmlObject); // Populate inherited attributes from Timeline

    // Process child elements of type Marker
    const markers: Marker[] = [];
    if (xmlObject.Marker) {
      const markerArray = Array.isArray(xmlObject.Marker)
        ? xmlObject.Marker
        : [xmlObject.Marker];
      markerArray.forEach((markerObj: any) => {
        markers.push(Marker.fromXmlObject(markerObj)); // Assuming Marker has a static fromXmlObject
      });
    }
    instance.markers = markers;

    return instance;
  }

  static fromXml(xmlString: string): Markers {
    const parser = new XMLParser({ attributeNamePrefix: "" });
    const jsonObj = parser.parse(xmlString);
    return Markers.fromXmlObject(jsonObj.Markers);
  }
}
