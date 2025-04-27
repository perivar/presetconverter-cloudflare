// dawproject/point.ts
import type { Point as PointType, XsString } from "./project-schema";

/**
 * Base class for automation points.
 * Corresponds to the 'point' abstract complex type in Project.xsd.
 */
export abstract class Point implements PointType {
  /**
   * Time position within the parent timeline (in the parent timeline's unit).
   * (Required attribute - xs:string)
   */
  public "@_time": XsString;

  /**
   * @param time - Time position within the parent timeline (in the parent timeline's unit). (Required attribute - xs:string)
   */
  constructor(time: XsString) {
    this["@_time"] = time;
  }
}
