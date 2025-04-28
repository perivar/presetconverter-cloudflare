import { XmlElement, XmlRootElement } from "./xmlDecorators";

/** Metadata root element of the DAWPROJECT format. This is stored in the file metadata.xml file inside the container. */
@XmlRootElement({ name: "MetaData" })
export class MetaData {
  /** Title of the song/project. */
  @XmlElement({ name: "Title", required: false })
  title?: string;

  /** Recording Artist. */
  @XmlElement({ name: "Artist", required: false })
  artist?: string;

  /** Album. */
  @XmlElement({ name: "Album", required: false })
  album?: string;

  /** Original Artist. */
  @XmlElement({ name: "OriginalArtist", required: false })
  originalArtist?: string;

  /** Composer. */
  @XmlElement({ name: "Composer", required: false })
  composer?: string;

  /** Songwriter. */
  @XmlElement({ name: "Songwriter", required: false })
  songwriter?: string;

  /** Producer. */
  @XmlElement({ name: "Producer", required: false })
  producer?: string;

  /** Arranger. */
  @XmlElement({ name: "Arranger", required: false })
  arranger?: string;

  /** Year this project/song was recorded. */
  @XmlElement({ name: "Year", required: false })
  year?: string;

  /** Genre/style */
  @XmlElement({ name: "Genre", required: false })
  genre?: string;

  /** Copyright notice. */
  @XmlElement({ name: "Copyright", required: false })
  copyright?: string;

  /** URL to website related to this project. */
  @XmlElement({ name: "Website", required: false })
  website?: string;

  /** General comment or description. */
  @XmlElement({ name: "Comment", required: false })
  comment?: string;
}
