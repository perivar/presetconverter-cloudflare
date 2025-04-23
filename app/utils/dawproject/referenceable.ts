import { Nameable } from "./nameable";
import { IReferenceable } from "./types";

export abstract class Referenceable extends Nameable implements IReferenceable {
  /** Unique string identifier of this element. This is used for referencing this instance from other elements. */
  id: string;
  private static ID_COUNTER = 0;
  private static _instances: { [id: string]: Referenceable } = {};

  /** call before export */
  static resetIdCounter(): void {
    Referenceable.ID_COUNTER = 0;
    Referenceable._instances = {};
  }

  constructor(name?: string, color?: string, comment?: string) {
    super(name, color, comment);
    this.id = `id${Referenceable.ID_COUNTER++}`;
    Referenceable._instances[this.id] = this;
  }

  protected getXmlAttributes(): any {
    // Get inherited attributes first
    const attributes = super.getXmlAttributes(); // Get attributes from Nameable

    // Add required id attribute (type xs:ID)
    attributes["@_id"] = this.id;

    return attributes;
  }

  protected populateFromXml(xmlObject: any): void {
    // Populate inherited attributes first
    super.populateFromXml(xmlObject);

    // Populate required id attribute
    if (!xmlObject["@_id"]) {
      throw new Error("Required attribute 'id' missing for Referenceable");
    }
    this.id = xmlObject["@_id"];

    // Register instance for reference lookup
    Referenceable._instances[this.id] = this;
  }

  static getById(id: string): Referenceable | undefined {
    return Referenceable._instances[id];
  }
}
