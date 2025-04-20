import { XMLBuilder, XMLParser } from "fast-xml-parser";

import { IReferenceable, Referenceable } from "./referenceable";
import { ILanes, Lanes } from "./timeline/lanes";
import { IMarkers, Markers } from "./timeline/markers";
import { IPoints, Points } from "./timeline/points";

/** Represents the main Arrangement timeline of a DAW. */
export interface IArrangement extends IReferenceable {
  /** Automation data for time-signature inside this Arrangement.
   * <pre>{@code
   * <Arrangement>
   *   <TimeSignatureAutomation target="id-of-TimeSignatureParameter" ... >
   *     <TimeSignaturePoint time="0" numerator="7", denominator="8"/>
   *     <TimeSignaturePoint time="21" numerator="4", denominator="4"/>
   *        ...
   *   </TimeSignatureAutomation>
   * </Arrangement>
   * }</pre>
   *  */
  timeSignatureAutomation?: IPoints;
  /** Automation data for tempo inside this Arrangement, which will define the conversion between seconds and beats
   * at the root level. */
  tempoAutomation?: IPoints;
  /** Cue markers inside this arrangement */
  markers?: IMarkers;
  /** The lanes of this arrangement. Generally this would contain another Lanes timeline for (and scoped to) each
   * track which would then contain all Note, Audio, and Automation timelines. */
  lanes?: ILanes;
}

/** Represents the main Arrangement timeline of a DAW. */
export class Arrangement extends Referenceable implements IArrangement {
  /** Automation data for time-signature inside this Arrangement.
   * <pre>{@code
   * <Arrangement>
   *   <TimeSignatureAutomation target="id-of-TimeSignatureParameter" ... >
   *     <TimeSignaturePoint time="0" numerator="7", denominator="8"/>
   *     <TimeSignaturePoint time="21" numerator="4", denominator="4"/>
   *        ...
   *   </TimeSignatureAutomation>
   * </Arrangement>
   * }</pre>
   *  */
  timeSignatureAutomation?: Points;
  /** Automation data for tempo inside this Arrangement, which will define the conversion between seconds and beats
   * at the root level. */
  tempoAutomation?: Points;
  /** Cue markers inside this arrangement */
  markers?: Markers;
  /** The lanes of this arrangement. Generally this would contain another Lanes timeline for (and scoped to) each
   * track which would then contain all Note, Audio, and Automation timelines. */
  lanes?: Lanes;

  constructor(
    timeSignatureAutomation?: Points,
    tempoAutomation?: Points,
    markers?: Markers,
    lanes?: Lanes,
    name?: string,
    color?: string,
    comment?: string
  ) {
    super(name, color, comment);
    this.timeSignatureAutomation = timeSignatureAutomation;
    this.tempoAutomation = tempoAutomation;
    this.markers = markers;
    this.lanes = lanes;
  }

  toXmlObject(): any {
    const obj: any = {
      Arrangement: {
        ...super.getXmlAttributes(), // Get attributes from Referenceable
      },
    };

    if (this.timeSignatureAutomation) {
      obj.Arrangement.TimeSignatureAutomation =
        this.timeSignatureAutomation.toXmlObject().Points; // Get the inner object
    }
    if (this.tempoAutomation) {
      obj.Arrangement.TempoAutomation =
        this.tempoAutomation.toXmlObject().Points; // Get the inner object
    }
    if (this.lanes) {
      obj.Arrangement.Lanes = this.lanes.toXmlObject().Lanes; // Get the inner object
    }
    if (this.markers) {
      // Assuming Markers class has a 'markers' property which is an array of Marker instances
      if (this.markers.markers) {
        obj.Arrangement.Markers = {
          Marker: this.markers.markers.map(
            marker => marker.toXmlObject().Marker
          ), // Get the inner object
        };
      }
    }

    return obj;
  }

  toXml(): string {
    const builder = new XMLBuilder({ attributeNamePrefix: "" });
    return builder.build(this.toXmlObject());
  }

  static fromXmlObject(xmlObject: any): Arrangement {
    const instance = new Arrangement();
    instance.populateFromXml(xmlObject); // Populate inherited attributes

    if (xmlObject.TimeSignatureAutomation) {
      instance.timeSignatureAutomation = Points.fromXmlObject({
        Points: xmlObject.TimeSignatureAutomation,
      }); // Wrap in expected structure
    }
    if (xmlObject.TempoAutomation) {
      instance.tempoAutomation = Points.fromXmlObject({
        Points: xmlObject.TempoAutomation,
      }); // Wrap in expected structure
    }
    if (xmlObject.Markers) {
      instance.markers = Markers.fromXmlObject({ Markers: xmlObject.Markers }); // Wrap in expected structure
    }
    if (xmlObject.Lanes) {
      instance.lanes = Lanes.fromXmlObject({ Lanes: xmlObject.Lanes }); // Wrap in expected structure
    }

    return instance;
  }

  static fromXml(xmlString: string): Arrangement {
    const parser = new XMLParser({ attributeNamePrefix: "" });
    const jsonObj = parser.parse(xmlString);
    return Arrangement.fromXmlObject(jsonObj.Arrangement);
  }

  // Need to add methods to Referenceable to handle XML object conversion
  protected getXmlAttributes(): any {
    const attributes: any = {};
    if (this.id !== undefined) {
      attributes.id = this.id;
    }
    if (this.name !== undefined) {
      attributes.name = this.name;
    }
    if (this.color !== undefined) {
      attributes.color = this.color;
    }
    if (this.comment !== undefined) {
      attributes.comment = this.comment;
    }
    return attributes;
  }

  protected populateFromXml(xmlObject: any): void {
    if (xmlObject.id !== undefined) {
      this.id = xmlObject.id;
    }
    if (xmlObject.name !== undefined) {
      this.name = xmlObject.name;
    }
    if (xmlObject.color !== undefined) {
      this.color = xmlObject.color;
    }
    if (xmlObject.comment !== undefined) {
      this.comment = xmlObject.comment;
    }
  }
}
