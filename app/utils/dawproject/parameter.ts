import { Referenceable } from "./referenceable";
import { IParameter } from "./types";

/** Represents a parameter which can provide a value and be used as an automation target. */
export abstract class Parameter extends Referenceable implements IParameter {
  /** Parameter ID as used by VST2 (index), VST3(ParamID) */
  parameterId?: number;

  constructor(
    parameterId?: number,
    name?: string,
    color?: string,
    comment?: string
  ) {
    super(name, color, comment);
    this.parameterId = parameterId;
  }

  protected getXmlAttributes(): any {
    const attributes = super.getXmlAttributes(); // Get attributes from Referenceable
    if (this.parameterId !== undefined) {
      attributes.parameterID = this.parameterId;
    }
    return attributes;
  }

  protected populateFromXml(xmlObject: any): void {
    super.populateFromXml(xmlObject); // Populate inherited attributes from Referenceable
    this.parameterId =
      xmlObject.parameterID !== undefined
        ? parseInt(xmlObject.parameterID, 10)
        : undefined;
  }
}
