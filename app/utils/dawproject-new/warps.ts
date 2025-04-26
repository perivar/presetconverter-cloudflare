// dawproject/warps.ts
import type { TimeUnit, Warps as WarpsType } from "./project-schema";
import { Timeline } from "./timeline";
import type { Warp } from "./warp";

/** Represents a collection of warp points for audio stretching. */
export class Warps extends Timeline implements WarpsType {
  // Property corresponding to child elements
  public Warp: Warp[] = []; // Use singular "Warp" for XML element name

  constructor(timeUnit: TimeUnit = "beats") {
    super(timeUnit);
  }
}
