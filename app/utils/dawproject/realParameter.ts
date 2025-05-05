import { DoubleAdapter } from "./doubleAdapter";
import { Parameter } from "./parameter";
import { IRealParameter } from "./types";
import { Unit } from "./unit";

/** Represents a real valued (double) parameter which can provide a value and be used as an automation target. */
export class RealParameter extends Parameter implements IRealParameter {
  /** Real (double) value for this parameter.
   * <p>When serializing value to text for XML, infinite values are allowed and should be represented as inf and -inf. </p>*/
  value?: number;
  /** Unit in which value, min and max are defined.
   * <p>Using this rather than normalized value ranges allows transfer of parameter values and automation data.</p> */
  unit?: Unit;
  /** Minimum value this parameter can have (inclusive). */
  min?: number;
  /** Maximum value this parameter can have (inclusive). */
  max?: number;

  constructor(
    value?: number,
    unit?: Unit,
    min?: number,
    max?: number,
    parameterID?: number,
    name?: string,
    color?: string,
    comment?: string
  ) {
    super(parameterID, name, color, comment);
    this.value = value;
    this.unit = unit;
    this.min = min;
    this.max = max;
  }

  toXmlObject(): any {
    const attributes = super.toXmlObject(); // Get attributes from Parameter
    if (this.value !== undefined) {
      attributes["@_value"] = DoubleAdapter.toXml(this.value) || "";
    }
    if (this.unit !== undefined) {
      attributes["@_unit"] = this.unit;
    }
    if (this.min !== undefined) {
      attributes["@_min"] = DoubleAdapter.toXml(this.min) || "";
    }
    if (this.max !== undefined) {
      attributes["@_max"] = DoubleAdapter.toXml(this.max) || "";
    }
    return { RealParameter: attributes };
  }

  fromXmlObject(xmlObject: any): this {
    super.fromXmlObject(xmlObject); // Populate inherited attributes from Parameter

    if (xmlObject["@_value"] !== undefined) {
      this.value = DoubleAdapter.fromXml(xmlObject["@_value"]);
    }
    if (xmlObject["@_unit"] !== undefined) {
      this.unit = xmlObject["@_unit"] as Unit; // Cast string to Unit
    }
    if (xmlObject["@_min"] !== undefined) {
      this.min = DoubleAdapter.fromXml(xmlObject["@_min"]);
    }
    if (xmlObject["@_max"] !== undefined) {
      this.max = DoubleAdapter.fromXml(xmlObject["@_max"]);
    }

    return this;
  }
}
