import { XmlAttribute } from "../xmlDecorators";

/** Abstract base class for automation points. */
export abstract class Point {
  /** Time of the point in the timeline's time unit. */
  @XmlAttribute({ required: true })
  time: number; // Using number for Double type in TypeScript

  constructor(time: number) {
    this.time = time;
  }
}
