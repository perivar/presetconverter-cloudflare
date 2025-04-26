// dawproject/referenceable.ts
import { Nameable } from "./nameable";
import type {
  Referenceable as ReferenceableType,
  XsString,
} from "./project-schema";

// Import Referenceable type

/**
 * Base class for elements that can be referenced by ID.
 * Corresponds to the 'referenceable' abstract complex type in Project.xsd.
 * Inherits name, color, and comment from Nameable.
 */
export abstract class Referenceable
  extends Nameable
  implements ReferenceableType
{
  /** Unique string identifier of this element. This is used for referencing this instance from other elements. */
  public static ID = 0;

  public "@_id": XsString;

  constructor(name?: XsString, color?: XsString, comment?: XsString) {
    super(name, color, comment);
    this["@_id"] = `id${Referenceable.ID++}`;
  }

  /** call before export */
  public static resetID(): void {
    Referenceable.ID = 0;
  }
}
