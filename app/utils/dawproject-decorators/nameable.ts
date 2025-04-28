import { XmlAttribute } from "./xmlDecorators";

/** Abstract base class for objects that have a name, color, and comment. */
export abstract class Nameable {
  /** Name/label of this object. */
  @XmlAttribute()
  name?: string;

  /** Color of this object in HTML-style format. (#rrggbb) */
  @XmlAttribute()
  color?: string;

  /** Comment/description of this object. */
  @XmlAttribute()
  comment?: string;
}
