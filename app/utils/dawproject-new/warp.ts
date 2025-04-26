// dawproject/warp.ts
import type { Warp as WarpType, XsDouble } from "./project-schema";
import { Referenceable } from "./referenceable";

/** Represents a single warp point for audio stretching. */
export class Warp extends Referenceable implements WarpType {
  // XML attributes are prefixed with '@_'
  public "@_time": XsDouble; // Required attribute (time in the warped audio)
  public "@_contentTime": XsDouble; // Required attribute (time in the original audio content)

  constructor(time: XsDouble, contentTime: XsDouble) {
    super(); // Call Referenceable constructor
    this["@_time"] = time;
    this["@_contentTime"] = contentTime;
  }
}
