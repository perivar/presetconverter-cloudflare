import { XmlAttribute, XmlRootElement } from "./xmlDecorators";

/** Metadata about the application which saved the DAWPROJECT file. */
@XmlRootElement({ name: "Application" })
export class Application {
  /** Name of the application. */
  @XmlAttribute({ required: true })
  name: string;

  /** Version number of the application. */
  @XmlAttribute({ required: true })
  version: string;

  constructor(name: string, version: string) {
    this.name = name;
    this.version = version;
  }
}
