import { XMLBuilder, XMLParser } from "fast-xml-parser";

import { RealParameter } from "./realParameter";
import { Referenceable } from "./referenceable";
import { SendType } from "./sendType";
import { ISend } from "./types";
import { XML_BUILDER_OPTIONS, XML_PARSER_OPTIONS } from "./xml/options";

/** A single send of a mixer channel. */
export class Send extends Referenceable implements ISend {
  /** Send level. */
  volume?: RealParameter;
  /** Send pan/balance. */
  pan?: RealParameter;
  /** Send type. */
  type?: SendType;
  /** Send destination. */
  destination?: Referenceable; // Assuming destination is a reference to a Referenceable

  constructor(
    volume?: RealParameter,
    pan?: RealParameter,
    type?: SendType,
    destination?: Referenceable,
    name?: string,
    color?: string,
    comment?: string
  ) {
    super(name, color, comment);
    this.volume = volume;
    this.pan = pan;
    this.type = type;
    this.destination = destination;
  }

  toXmlObject(): any {
    const obj: any = {
      Send: {
        ...super.getXmlAttributes(), // Get attributes from Referenceable
      },
    };

    if (this.volume) {
      obj.Send.Volume = this.volume.toXmlObject().RealParameter; // Assuming RealParameter has toXmlObject and returns { RealParameter: ... }
    }
    if (this.pan) {
      obj.Send.Pan = this.pan.toXmlObject().RealParameter; // Assuming RealParameter has toXmlObject and returns { RealParameter: ... }
    }
    if (this.type !== undefined) {
      obj.Send["@_type"] = this.type;
    }
    if (this.destination !== undefined) {
      // Assuming destination is a Referenceable instance and has an id
      obj.Send["@_destination"] = this.destination.id;
    }

    return obj;
  }

  toXml(): string {
    const builder = new XMLBuilder(XML_BUILDER_OPTIONS);
    return builder.build(this.toXmlObject());
  }

  static fromXmlObject(xmlObject: any): Send {
    const instance = new Send(); // Create instance
    instance.populateFromXml(xmlObject); // Populate inherited attributes

    if (xmlObject.Volume) {
      instance.volume = RealParameter.fromXmlObject({
        RealParameter: xmlObject.Volume,
      }); // Wrap in expected structure
    }

    if (xmlObject.Pan) {
      instance.pan = RealParameter.fromXmlObject({
        RealParameter: xmlObject.Pan,
      }); // Wrap in expected structure
    }

    instance.type = xmlObject["@_type"]
      ? (xmlObject["@_type"] as SendType)
      : undefined; // Cast string to SendType

    const destinationId = xmlObject["@_destination"];
    if (destinationId) {
      // This requires a way to look up Referenceable instances by ID
      // For now, we'll leave it as undefined
      console.warn(
        `Skipping deserialization of Send destination with ID: ${destinationId}`
      );
    }

    return instance;
  }

  static fromXml(xmlString: string): Send {
    const parser = new XMLParser(XML_PARSER_OPTIONS);
    const jsonObj = parser.parse(xmlString);
    return Send.fromXmlObject(jsonObj.Send);
  }
}
