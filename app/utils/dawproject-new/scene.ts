// dawproject/scene.ts
import type { Audio } from "./audio";
import type { ClipSlot } from "./clip-slot";
import type { Clips } from "./clips";
import type { Lanes } from "./lanes";
import type { Markers } from "./markers";
import type { Notes } from "./notes";
import type { Points } from "./points";
import type { Scene as SceneType, XsString } from "./project-schema";
import { Referenceable } from "./referenceable";
import type { Timeline } from "./timeline";
import type { Video } from "./video";
import type { Warps } from "./warps";

// Union type for different kinds of child elements within Scene
export type SceneChildElement =
  | Timeline
  | Lanes
  | Notes
  | Clips
  | ClipSlot
  | Markers
  | Warps
  | Audio
  | Video
  | Points;

/**
 * Represents a scene in a clip launcher or arrangement view.
 * Corresponds to the 'scene' complex type in Project.xsd.
 * Inherits attributes and child elements from Referenceable.
 */
export class Scene extends Referenceable implements SceneType {
  // Properties corresponding to child elements (part of a choice, only one can be present)

  /**
   * A nested timeline within the scene.
   * (Optional child element - choice)
   */
  public Timeline?: Timeline;

  /**
   * A nested lanes container within the scene.
   * (Optional child element - choice)
   */
  public Lanes?: Lanes;

  /**
   * A nested notes container within the scene.
   * (Optional child element - choice)
   */
  public Notes?: Notes;

  /**
   * A nested clips container within the scene.
   * (Optional child element - choice)
   */
  public Clips?: Clips;

  /**
   * A nested clip slot within the scene.
   * (Optional child element - choice)
   */
  public ClipSlot?: ClipSlot;

  /**
   * A nested markers collection within the scene.
   * (Optional child element - choice)
   */
  public Markers?: Markers; // Note: schema uses 'markers' lowercase

  /**
   * A nested warps collection within the scene.
   * (Optional child element - choice)
   */
  public Warps?: Warps;

  /**
   * Nested audio content within the scene.
   * (Optional child element - choice)
   */
  public Audio?: Audio;

  /**
   * Nested video content within the scene.
   * (Optional child element - choice)
   */
  public Video?: Video;

  /**
   * Nested automation points within the scene.
   * (Optional child element - choice)
   */
  public Points?: Points;

  /**
   * @param name - The name of the scene. (Optional attribute inherited from Nameable)
   * @param color - The color of the scene. (Optional attribute inherited from Nameable)
   * @param comment - A comment for the scene. (Optional attribute inherited from Nameable)
   */
  constructor(name?: XsString, color?: XsString, comment?: XsString) {
    super(name, color, comment);
  }
}
