// dawproject/notes.ts
import type { Note } from "./note";
import type { Notes as NotesType, TimeUnit, XsString } from "./project-schema";
import { Timeline } from "./timeline";

/**
 * Represents a container for musical notes, often used as clip content.
 * Corresponds to the 'notes' complex type in Project.xsd.
 * Inherits attributes and child elements from Timeline.
 */
export class Notes extends Timeline implements NotesType {
  // Property corresponding to child elements

  /**
   * A collection of musical notes.
   * (Optional child element - unbounded)
   */
  public Note: Note[] = []; // Initialized as empty array for unbounded element

  /**
   * @param timeUnit - The time unit used for the timeline. (Optional attribute inherited from Timeline)
   * @param track - A reference to the track this timeline belongs to. (Optional attribute inherited from Timeline - xs:IDREF)
   * @param name - The name of the notes container. (Optional attribute inherited from Nameable)
   * @param color - The color of the notes container. (Optional attribute inherited from Nameable)
   * @param comment - A comment for the notes container. (Optional attribute inherited from Nameable)
   */
  constructor(
    timeUnit: TimeUnit = "beats",
    track?: XsString,
    name?: XsString,
    color?: XsString,
    comment?: XsString
  ) {
    super(timeUnit, track, name, color, comment);
  }
}
