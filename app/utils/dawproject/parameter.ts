import { Referenceable } from "./referenceable";
import { IParameter } from "./types";

/** Represents a parameter which can provide a value and be used as an automation target. */
export abstract class Parameter extends Referenceable implements IParameter {
  /** Parameter ID as used by VST2 (index), VST3(ParamID) */
  parameterID?: number;

  constructor(
    parameterID?: number,
    name?: string,
    color?: string,
    comment?: string
  ) {
    super(name, color, comment);
    this.parameterID = parameterID;
  }

  protected getXmlAttributes(): any {
    const attributes = super.getXmlAttributes(); // Get attributes from Referenceable
    if (this.parameterID !== undefined) {
      attributes.parameterID = this.parameterID;
    }
    return attributes;
  }

  protected populateFromXml(xmlObject: any): void {
    super.populateFromXml(xmlObject); // Populate inherited attributes from Referenceable
    this.parameterID =
      xmlObject.parameterID !== undefined
        ? parseInt(xmlObject.parameterID, 10)
        : undefined;
  }
}
