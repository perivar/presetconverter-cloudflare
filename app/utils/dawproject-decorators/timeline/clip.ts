import { Nameable } from "../nameable";
import {
  XmlAttribute,
  XmlElement,
  XmlIDREF,
  XmlRootElement,
} from "../xmlDecorators";
import { Timeline } from "./timeline";
import { TimeUnit } from "./timeUnit";

/** A Clip provides a clipped view on to a Timeline. */
@XmlRootElement({ name: "Clip" })
export class Clip extends Nameable {
  /** Time on the parent timeline where this clips starts playing. */
  @XmlAttribute({ required: true })
  time: number; // Using number for double type in TypeScript

  /** Duration on the parent timeline of this clip. */
  @XmlAttribute({ required: false })
  duration?: number; // Using number for Double type in TypeScript

  /** The TimeUnit used by the scope inside this timeline. */
  @XmlAttribute({ required: false })
  contentTimeUnit?: TimeUnit;

  /** Time inside the content timeline (or reference) where the clip starts playing. */
  @XmlAttribute({ required: false })
  playStart?: number; // Using number for Double type in TypeScript

  /** Time inside the content timeline (or reference) where the clip stops playing. */
  @XmlAttribute({ required: false })
  playStop?: number; // Using number for Double type in TypeScript

  /** Time inside the content timeline (or reference) where the clip loop starts. */
  @XmlAttribute({ required: false })
  loopStart?: number; // Using number for Double type in TypeScript

  /** Time inside the content timeline (or reference) where the clip loop ends. */
  @XmlAttribute({ required: false })
  loopEnd?: number; // Using number for Double type in TypeScript

  /** The TimeUnit used by the fadeInTime and fadeOutTime. */
  @XmlAttribute({ required: false })
  fadeTimeUnit?: TimeUnit;

  /** Duration of fade-in. */
  @XmlAttribute({ required: false })
  fadeInTime?: number; // Using number for Double type in TypeScript

  /** Duration of fade-out. */
  @XmlAttribute({ required: false })
  fadeOutTime?: number; // Using number for Double type in TypeScript

  /** Content Timeline this clip is playing. */
  @XmlElement({ name: "Timeline", required: false, type: "Timeline" }) // Using type "Timeline" for polymorphism
  content?: Timeline;

  /** Reference to a Content Timeline this clip is playing. */
  @XmlAttribute({ required: false })
  @XmlIDREF
  reference?: Timeline;

  constructor(time: number) {
    super();
    this.time = time;
  }
}
