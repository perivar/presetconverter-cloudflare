import {
  XmlElement,
  XmlElementWrapper,
  XmlRootElement,
} from "../xmlDecorators";
import { Note } from "./note";
import { Timeline } from "./timeline";

/** Represents a timeline containing musical notes. */
@XmlRootElement({ name: "Notes" })
export class Notes extends Timeline {
  /** List of notes on this timeline. */
  @XmlElementWrapper({ name: "Notes" })
  @XmlElement({ name: "Note", type: "Note" })
  notes: Note[] = [];
}
