import { Parameter } from "./parameter";
import { IBoolParameter } from "./types";

/** Represents a parameter which can provide a boolean (true/false) value and be used as an automation target. */
export class BoolParameter extends Parameter implements IBoolParameter {
  /** Boolean value for this parameter. */
  value?: boolean;

  constructor(
    value?: boolean,
    parameterID?: number,
    name?: string,
    color?: string,
    comment?: string
  ) {
    super(parameterID, name, color, comment);
    this.value = value;
  }

  toXmlObject(): any {
    const attributes = super.toXmlObject(); // Get attributes from Parameter

    // Add BoolParameter-specific attribute
    if (this.value !== undefined) {
      attributes["@_value"] = this.value;
    }

    // Return with proper structure
    return {
      BoolParameter: {
        ...attributes,
      },
    };
  }

  fromXmlObject(xmlObject: any): this {
    super.fromXmlObject(xmlObject); // Populate inherited attributes from Parameter
    this.value =
      xmlObject.value !== undefined
        ? String(xmlObject.value).toLowerCase() === "true"
        : undefined;
    return this;
  }
}
