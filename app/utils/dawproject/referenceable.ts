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
    const attributes = super.getXmlAttributes(); // Get attributes from Nameable
    attributes.id = this.id;
    return attributes;
  }

  protected populateFromXml(xmlObject: any): void {
    super.populateFromXml(xmlObject); // Populate inherited attributes from Nameable
    this.id = xmlObject.id || "";
    Referenceable._instances[this.id] = this;
  }

  // Concrete subclasses will implement their own toXmlObject and fromXmlObject methods
  abstract toXmlObject(): any;
  static fromXmlObject(xmlObject: any): Referenceable {
    throw new Error("fromXmlObject must be implemented by subclasses");
  }

  static getById(id: string): Referenceable | undefined {
    return Referenceable._instances[id];
  }
}
