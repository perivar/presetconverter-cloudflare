import { Nameable } from "./nameable";
import { XmlAttribute } from "./xmlDecorators";

/** Abstract base class for objects that can be referenced by ID. */
export abstract class Referenceable extends Nameable {
  /** Unique string identifier of this element. This is used for referencing this instance from other elements. */
  @XmlAttribute()
  // @XmlID() // XmlID is not directly supported by the current decorators, XmlIDREF is for referencing
  id: string;

  private static ID = 0;

  constructor() {
    super();
    this.id = "id" + Referenceable.ID++;
  }

  /** call before export */
  static resetID(): void {
    Referenceable.ID = 0;
  }
}
