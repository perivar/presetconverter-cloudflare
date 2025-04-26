// dawproject/markers.ts
import { Marker } from "./marker";
import type {
  Markers as MarkersType,
  TimeUnit,
  XsString,
} from "./project-schema";
import { Timeline } from "./timeline";

/**
 * Represents a collection of markers, typically within an Arrangement or other timeline.
 * Corresponds to the 'markers' complex type in Project.xsd.
 * Inherits attributes and child elements from Timeline.
 */
export class Markers extends Timeline implements MarkersType {
  // Property corresponding to child elements

  /**
   * A collection of marker points on the timeline.
   * (Required child element - unbounded)
   */
  public Marker: Marker[] = []; // Initialized as empty array for unbounded element

  /**
   * @param timeUnit - The time unit used for the timeline. (Optional attribute inherited from Timeline)
   * @param track - A reference to the track this timeline belongs to. (Optional attribute inherited from Timeline - xs:IDREF)
   * @param name - The name of the markers collection. (Optional attribute inherited from Nameable)
   * @param color - The color of the markers collection. (Optional attribute inherited from Nameable)
   * @param comment - A comment for the markers collection. (Optional attribute inherited from Nameable)
   */
  constructor(
    timeUnit: TimeUnit = "beats",
    track?: XsString,
    name?: XsString,
    color?: XsString,
    comment?: XsString
  ) {
    super(timeUnit, track, name, color, comment);
  }
}
