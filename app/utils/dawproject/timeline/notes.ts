import type { INotes, ITrack } from "../types";
import { Note } from "./note";
import { Timeline } from "./timeline";
import { TimeUnit } from "./timeUnit";

export class Notes extends Timeline implements INotes {
  notes: Note[];

  constructor(
    notes?: Note[],
    track?: ITrack,
    timeUnit?: TimeUnit,
    name?: string,
    color?: string,
    comment?: string
  ) {
    super(track, timeUnit, name, color, comment);
    this.notes = notes || [];
  }

  toXmlObject(): any {
    const obj: any = {
      Notes: {
        ...super.toXmlObject(), // Get attributes from Timeline
      },
    };

    // Append child elements for each note
    if (this.notes && this.notes.length > 0) {
      obj.Notes.Note = this.notes.map(note => note.toXmlObject().Note);
    }

    return obj;
  }

  fromXmlObject(xmlObject: any): this {
    super.fromXmlObject(xmlObject); // Populate inherited attributes from Timeline

    // Process child elements of type Note
    const notes: Note[] = [];
    if (xmlObject.Note) {
      const noteArray = Array.isArray(xmlObject.Note)
        ? xmlObject.Note
        : [xmlObject.Note];
      noteArray.forEach((noteObj: any) => {
        notes.push(new Note().fromXmlObject(noteObj));
      });
    }
    this.notes = notes;

    return this;
  }
}
