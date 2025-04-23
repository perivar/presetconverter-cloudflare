import { XMLBuilder, XMLParser } from "fast-xml-parser";

import { DoubleAdapter } from "./doubleAdapter";
import { Parameter } from "./parameter";
import { IRealParameter } from "./types";
import { Unit } from "./unit";
import { XML_BUILDER_OPTIONS, XML_PARSER_OPTIONS } from "./xml/options";

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
    const obj = super.getXmlAttributes(); // Get attributes from Parameter
    if (this.value !== undefined) {
      obj["@_value"] = DoubleAdapter.toXml(this.value) || "";
    }
    if (this.unit !== undefined) {
      obj["@_unit"] = this.unit;
    }
    if (this.min !== undefined) {
      obj["@_min"] = DoubleAdapter.toXml(this.min) || "";
    }
    if (this.max !== undefined) {
      obj["@_max"] = DoubleAdapter.toXml(this.max) || "";
    }
    return { RealParameter: obj };
  }

  toXml(): string {
    const builder = new XMLBuilder(XML_BUILDER_OPTIONS);
    return builder.build(this.toXmlObject());
  }

  static fromXmlObject(xmlObject: any): RealParameter {
    const instance = new RealParameter();
    instance.populateFromXml(xmlObject); // Populate inherited attributes from Parameter

    instance.value =
      xmlObject["@_value"] !== undefined
        ? DoubleAdapter.fromXml(xmlObject["@_value"])
        : undefined;
    instance.unit = xmlObject["@_unit"]
      ? (xmlObject["@_unit"] as Unit)
      : undefined; // Cast string to Unit
    instance.min =
      xmlObject["@_min"] !== undefined
        ? DoubleAdapter.fromXml(xmlObject["@_min"])
        : undefined;
    instance.max =
      xmlObject["@_max"] !== undefined
        ? DoubleAdapter.fromXml(xmlObject["@_max"])
        : undefined;

    return instance;
  }

  static fromXml(xmlString: string): RealParameter {
    const parser = new XMLParser(XML_PARSER_OPTIONS);
    const jsonObj = parser.parse(xmlString);
    return RealParameter.fromXmlObject(jsonObj.RealParameter);
  }
}
