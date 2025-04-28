import { Referenceable } from "./referenceable";
import { Timeline } from "./timeline/timeline";
import { XmlElement, XmlRootElement } from "./xmlDecorators";

/** Represents a clip launcher Scene of a DAW. */
@XmlRootElement({ name: "Scene" })
export class Scene extends Referenceable {
  /** Content timeline of this scene. */
  @XmlElement({ name: "Timeline", type: "Timeline" }) // Using type "Timeline" for polymorphism
  content?: Timeline;
}
