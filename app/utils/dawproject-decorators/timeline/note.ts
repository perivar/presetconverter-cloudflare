import { DoubleAdapter } from "../doubleAdapter";
import { Referenceable } from "../referenceable";
import {
  XmlAttribute,
  XmlElementRef,
  XmlRootElement,
  XmlTypeAdapter,
} from "../xmlDecorators";
import { Timeline } from "./timeline";

/** Represents a musical note. */
@XmlRootElement({ name: "Note" })
export class Note extends Referenceable {
  /** Time position of the note. */
  @XmlAttribute({ required: true })
  @XmlTypeAdapter(DoubleAdapter)
  time: number;

  /** Duration of the note. */
  @XmlAttribute({ required: true })
  @XmlTypeAdapter(DoubleAdapter)
  duration: number;

  /** MIDI Key number (0-127). */
  @XmlAttribute({ required: true })
  key: number; // Integer

  /** MIDI Channel (0-15). */
  @XmlAttribute({ required: false })
  channel?: number; // Integer

  /** Note-on velocity (0.0-1.0). */
  @XmlAttribute({ required: false })
  @XmlTypeAdapter(DoubleAdapter)
  velocity?: number;

  /** Note-off velocity (0.0-1.0). */
  @XmlAttribute({ required: false })
  @XmlTypeAdapter(DoubleAdapter)
  releaseVelocity?: number;

  constructor(
    time: number,
    duration: number,
    key: number,
    channel?: number,
    velocity?: number,
    releaseVelocity?: number
  ) {
    super();
    this.time = time;
    this.duration = duration;
    this.key = key;
    this.channel = channel;
    this.velocity = velocity;
    this.releaseVelocity = releaseVelocity;
  }

  /** Per-note expressions can be stored within the note object as timelines. */
  @XmlElementRef({ name: "Content" })
  content?: Timeline;
}
