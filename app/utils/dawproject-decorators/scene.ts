import { Referenceable } from "./referenceable";
import { Timeline } from "./timeline/timeline";
import { XmlElementRef, XmlRootElement } from "./xmlDecorators";

/** Represents a clip launcher Scene of a DAW. */
@XmlRootElement({ name: "Scene" })
export class Scene extends Referenceable {
  /** Content timeline of this scene. */
  @XmlElementRef({ name: "Timeline" })
  content?: Timeline;
}
