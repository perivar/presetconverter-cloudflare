// dawproject/lane.ts
import type { Lane as LaneType, XsString } from "./project-schema";
import { Referenceable } from "./referenceable";

/**
 * Abstract base class for a lane within a timeline or track structure.
 * Corresponds to the 'lane' abstract complex type in Project.xsd.
 * Inherits attributes and child elements from Referenceable.
 */
export abstract class Lane extends Referenceable implements LaneType {
  /**
   * @param name - The name of the lane. (Optional attribute inherited from Nameable)
   * @param color - The color of the lane. (Optional attribute inherited from Nameable)
   * @param comment - A comment for the lane. (Optional attribute inherited from Nameable)
   */
  constructor(name?: XsString, color?: XsString, comment?: XsString) {
    super(name, color, comment);
  }
}
