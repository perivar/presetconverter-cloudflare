// dawproject/nameable.ts
import type { Nameable as NameableType, XsString } from "./project-schema"; // Import Nameable type

/**
 * Base class for elements that have a name, color, and comment.
 * Corresponds to the 'nameable' abstract complex type in Project.xsd.
 */
export abstract class Nameable implements NameableType {
  // XmlElement properties for XML serialization
  public "@_xmlns"?: string;
  [ns: `@_xmlns:${string}`]: string | undefined;

  // XML attributes are prefixed with '@_'

  /**
   * The name of the element.
   * (Optional attribute)
   */
  public "@_name"?: XsString;

  /**
   * The color associated with the element (e.g., for UI representation).
   * Should be a hex color string like #RRGGBB or #RRGGBBAA.
   * (Optional attribute)
   */
  public "@_color"?: XsString;

  /**
   * A comment or description for the element.
   * (Optional attribute)
   */
  public "@_comment"?: XsString;

  /**
   * @param name - The name of the element. (Optional attribute)
   * @param color - The color associated with the element. (Optional attribute)
   * @param comment - A comment or description for the element. (Optional attribute)
   */
  constructor(name?: XsString, color?: XsString, comment?: XsString) {
    this["@_name"] = name;
    this["@_color"] = color;
    this["@_comment"] = comment;
  }
}
