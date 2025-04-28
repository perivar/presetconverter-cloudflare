import { Application } from "./application";
import { Arrangement } from "./arrangement";
import { Lane } from "./lane";
import { Scene } from "./scene";
import { Transport } from "./transport";
import {
  XmlAttribute,
  XmlElement,
  XmlElementRef,
  XmlElementWrapper,
  XmlRootElement,
} from "./xmlDecorators";

// For XmlSeeAlso equivalent in classRegistry

/** The main root element of the DAWPROJECT format. */
@XmlRootElement({ name: "Project" })
export class Project {
  /** Version of DAWPROJECT format this file was saved as. */
  @XmlAttribute({ required: true })
  version: string = "1.0";

  /** Metadata (name/version) about the application that saved this file. */
  @XmlElement({ name: "Application", required: true, type: "Application" })
  application: Application = new Application("", ""); // Initialize with default values

  /** Transport element containing playback parameters such as Tempo and Time-signature. */
  @XmlElement({ name: "Transport", type: "Transport" })
  transport?: Transport;

  /** Track/Channel structure of this file. */
  @XmlElementWrapper({ name: "Structure" })
  @XmlElementRef()
  structure: Lane[] = [];

  /** The main Arrangement timeline of this file. */
  @XmlElement({ name: "Arrangement", type: "Arrangement", required: false })
  arrangement?: Arrangement;

  /** Clip Launcher scenes of this file. */
  @XmlElementWrapper({ name: "Scenes" })
  @XmlElement({ name: "Scene", type: "Scene" })
  scenes: Scene[] = [];
}
