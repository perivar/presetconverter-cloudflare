// dawproject/marker.ts
import type { XsDouble, XsString } from "./project-schema";
import { Referenceable } from "./referenceable";

/**
 * Represents a single marker point on a timeline.
 * Corresponds to the 'marker' complex type in Project.xsd.
 * Inherits attributes and child elements from Nameable.
 */
export class Marker extends Referenceable {
  // XML attributes are prefixed with '@_'

  /**
   * Time position of the marker (in the parent timeline's unit).
   * (Required attribute - xs:double)
   */
  public "@_time": XsDouble; // Using number for xs:double

  // @_name is inherited from Referenceable via Nameable

  /**
   * @param time - Time position of the marker (in the parent timeline's unit). (Required attribute - xs:double)
   * @param name - The name of the marker. (Optional attribute inherited from Nameable)
   * @param color - The color of the marker. (Optional attribute inherited from Nameable)
   * @param comment - A comment for the marker. (Optional attribute inherited from Nameable)
   */
  constructor(
    time: XsDouble,
    name?: XsString,
    color?: XsString,
    comment?: XsString
  ) {
    super(name, color, comment); // Call Referenceable constructor (handles id, @_xmlns, name, color, comment)
    this["@_time"] = time;
  }
}
