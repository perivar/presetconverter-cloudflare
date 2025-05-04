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
    const attributes = super.toXmlObject(); // Get inherited attributes first

    // Add Parameter-specific attribute
    if (this.parameterID !== undefined) {
      attributes["@_parameterID"] = this.parameterID;
    }

    return attributes;
  }

  fromXmlObject(xmlObject: any): this {
    super.fromXmlObject(xmlObject); // Populate inherited attributes from Referenceable

    // Populate Parameter-specific attribute
    if (xmlObject["@_parameterID"] !== undefined) {
      this.parameterID = parseInt(xmlObject["@_parameterID"], 10);
    }

    return this;
  }
}
