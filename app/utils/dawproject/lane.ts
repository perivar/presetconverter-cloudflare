import { Referenceable } from "./referenceable";
import { ILane } from "./types";

export abstract class Lane extends Referenceable implements ILane {
  // Lane is an abstract base class, no specific properties beyond Referenceable

  constructor(name?: string, color?: string, comment?: string) {
    super(name, color, comment);
  }

  protected getXmlAttributes(): any {
    return super.getXmlAttributes(); // Get attributes from Referenceable
  }

  protected populateFromXml(xmlObject: any): void {
    super.populateFromXml(xmlObject); // Populate inherited attributes from Referenceable
  }
}
