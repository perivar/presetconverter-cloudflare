// dawproject/project.ts
import type { Application } from "./application";
import type { Arrangement } from "./arrangement";
import type { Channel } from "./channel";
import { Lane } from "./lane";
import type { Project as ProjectType, XsString } from "./project-schema";
import type { Scene } from "./scene";
import type { Track } from "./track";
import type { Transport } from "./transport";

// Union type for elements allowed in Structure
export type StructureElement = Track | Channel;

/**
 * The root object representing a DAW project.
 * Corresponds to the 'project' complex type in Project.xsd.
 */
export class Project implements ProjectType {
  // Add XmlElement properties (inherited from the type definition)
  public "@_xmlns"?: string;
  [ns: `@_xmlns:${string}`]: string | undefined;

  // XML attribute is prefixed with '@_'

  /**
   * The version of the project file format.
   * (Required attribute)
   */
  public "@_version": XsString = "1.0.0"; // Default or specify based on schema/standard version

  // Properties corresponding to child elements

  /**
   * The host application that created the project file.
   * (Required child element)
   */
  public Application: Application; // Changed to required

  /**
   * The transport section of the project (tempo, time signature, etc.).
   * (Optional child element)
   */
  public Transport?: Transport;

  /**
   * The top-level structure of the project (e.g., tracks, folders).
   * (Optional child element - unbounded choice)
   * Changed to an array of Lane not StructureElement
   */
  public Structure: Lane[] = []; // Initialized as empty array for unbounded element

  /**
   * The main arrangement or timeline view of the project.
   * (Optional child element)
   */
  public Arrangement?: Arrangement;

  /**
   * A collection of scenes in a clip launcher or arrangement view.
   * (Optional child element - unbounded)
   */
  public Scenes: Scene[] = []; // Initialized as empty array for unbounded element

  /**
   * @param application - The host application that created the project file. (Required child element)
   * @param version - The version of the project file format. (Required attribute)
   * @param transport - The transport section of the project. (Optional child element)
   * @param structure - The top-level structure of the project. (Optional child element - unbounded choice)
   * @param arrangement - The main arrangement or timeline view of the project. (Optional child element)
   * @param scenes - A collection of scenes. (Optional child element - unbounded)
   */
  constructor(
    application: Application,
    version: XsString = "1.0.0",
    transport?: Transport,
    structure?: Lane[], // Changed to an array of Lane not StructureElement
    arrangement?: Arrangement,
    scenes?: Scene[]
  ) {
    this.Application = application;
    this["@_version"] = version;
    this.Transport = transport;
    this.Structure = structure || [];
    this.Arrangement = arrangement;
    this.Scenes = scenes || [];
  }
}
