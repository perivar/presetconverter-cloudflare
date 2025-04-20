import { XMLBuilder, XMLParser } from "fast-xml-parser";

import { INote, Note } from "./note";
import { ITimeline, Timeline } from "./timeline";

export interface INotes extends ITimeline {
  notes: INote[];
}

export class Notes extends Timeline implements INotes {
  notes: Note[];

  constructor(
    notes?: Note[],
    track?: string,
    timeUnit?: string, // Use string for now, will refine with TimeUnit enum later
    name?: string,
    color?: string,
    comment?: string
  ) {
    super(track, timeUnit as any, name, color, comment); // Cast timeUnit for now
    this.notes = notes || [];
  }

  toXmlObject(): any {
    const obj: any = {
      Notes: {
        ...super.getXmlAttributes(), // Get attributes from Timeline
      },
    };

    // Append child elements for each note
    if (this.notes && this.notes.length > 0) {
      obj.Notes.Note = this.notes.map(note => note.toXmlObject().Note); // Assuming Note has toXmlObject and returns { Note: ... }
    }

    return obj;
  }

  toXml(): string {
    const builder = new XMLBuilder({ attributeNamePrefix: "" });
    return builder.build(this.toXmlObject());
  }

  static fromXmlObject(xmlObject: any): Notes {
    const instance = new Notes(); // Create instance of Notes
    instance.populateFromXml(xmlObject); // Populate inherited attributes from Timeline

    // Process child elements of type Note
    const notes: Note[] = [];
    if (xmlObject.Note) {
      const noteArray = Array.isArray(xmlObject.Note)
        ? xmlObject.Note
        : [xmlObject.Note];
      noteArray.forEach((noteObj: any) => {
        notes.push(Note.fromXmlObject(noteObj)); // Assuming Note has a static fromXmlObject
      });
    }
    instance.notes = notes;

    return instance;
  }

  static fromXml(xmlString: string): Notes {
    const parser = new XMLParser({ attributeNamePrefix: "" });
    const jsonObj = parser.parse(xmlString);
    return Notes.fromXmlObject(jsonObj.Notes);
  }
}
