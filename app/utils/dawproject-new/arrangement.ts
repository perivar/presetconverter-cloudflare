// dawproject/arrangement.ts
import { Lanes } from "./lanes"; // Removed 'type'

import { Markers } from "./markers"; // Removed 'type'
import { Points } from "./points"; // Removed 'type'
import type {
  Arrangement as ArrangementType,
  XsString,
} from "./project-schema";
// Added XsString
import { Referenceable } from "./referenceable";

/**
 * Represents the main arrangement or timeline view of the project.
 * Corresponds to the 'arrangement' complex type in Project.xsd.
 */
export class Arrangement extends Referenceable implements ArrangementType {
  // Properties corresponding to child elements

  /**
   * The main timeline lanes container.
   * (Optional child element)
   */
  public Lanes?: Lanes;

  /**
   * Arrangement markers.
   * (Optional child element)
   */
  public Markers?: Markers;

  /**
   * Tempo automation points.
   * (Optional child element)
   */
  public TempoAutomation?: Points;

  /**
   * Time signature automation points.
   * (Optional child element)
   */
  public TimeSignatureAutomation?: Points;

  /**
   * @param name - The name of the arrangement. (Inherited from Nameable)
   * @param color - The color of the arrangement. (Inherited from Nameable)
   * @param comment - A comment for the arrangement. (Inherited from Nameable)
   */
  constructor(name?: XsString, color?: XsString, comment?: XsString) {
    super(name, color, comment);
  }
}
