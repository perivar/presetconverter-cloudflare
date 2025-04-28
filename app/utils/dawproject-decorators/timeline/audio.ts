import { FileReference } from "../fileReference"; // Import FileReference for constructor
import { XmlAttribute, XmlRootElement } from "../xmlDecorators";
import { MediaFile } from "./mediaFile";

/** Represents an audio media file used in a timeline. */
@XmlRootElement({ name: "Audio" })
export class Audio extends MediaFile {
  /** Sample rate of the audio file. */
  @XmlAttribute({ required: false })
  sampleRate?: number; // Using number for Integer type in TypeScript

  /** Number of audio channels. */
  @XmlAttribute({ required: false })
  channels?: number; // Using number for Integer type in TypeScript

  /** Duration of the audio file in seconds. */
  @XmlAttribute({ required: false })
  duration?: number; // Using number for Double type in TypeScript

  constructor(
    file: FileReference,
    sampleRate?: number,
    channels?: number,
    duration?: number
  ) {
    super(file);
    this.sampleRate = sampleRate;
    this.channels = channels;
    this.duration = duration;
  }
}
