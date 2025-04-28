import { FileReference } from "../fileReference";
import { XmlAttribute, XmlElement } from "../xmlDecorators";
import { Timeline } from "./timeline";

/** Abstract base class for media files used in timelines. */
export abstract class MediaFile extends Timeline {
  /** Loudness of the media file in LUFS. */
  @XmlAttribute({ required: false })
  loudness?: number; // Using number for Double type in TypeScript

  /** File reference to the media file. */
  @XmlElement({ name: "File", required: true, type: "FileReference" })
  file: FileReference;

  constructor(file: FileReference) {
    super();
    this.file = file;
  }
}
