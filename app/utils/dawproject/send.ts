import { RealParameter } from "./realParameter";
import { Referenceable } from "./referenceable";
import { SendType } from "./sendType";
import { ISend } from "./types";

/** A single send of a mixer channel. */
export class Send extends Referenceable implements ISend {
  /** Send level. */
  volume?: RealParameter;
  /** Send pan/balance. */
  pan?: RealParameter;
  /** Send type. */
  type?: SendType;
  /** Send destination. */
  destination?: Referenceable;

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
        ...super.toXmlObject(), // Get attributes from Referenceable
      },
    };

    if (this.volume) {
      obj.Send.Volume = this.volume.toXmlObject().RealParameter;
    }
    if (this.pan) {
      obj.Send.Pan = this.pan.toXmlObject().RealParameter;
    }
    if (this.type !== undefined) {
      obj.Send["@_type"] = this.type;
    }
    if (this.destination !== undefined) {
      obj.Send["@_destination"] = this.destination.id;
    }

    return obj;
  }

  fromXmlObject(xmlObject: any): this {
    super.fromXmlObject(xmlObject); // Populate inherited attributes from Referenceable

    if (xmlObject.Volume) {
      this.volume = new RealParameter().fromXmlObject({
        RealParameter: xmlObject.Volume,
      });
    }

    if (xmlObject.Pan) {
      this.pan = new RealParameter().fromXmlObject({
        RealParameter: xmlObject.Pan,
      });
    }

    this.type = xmlObject["@_type"]
      ? (xmlObject["@_type"] as SendType)
      : undefined; // Cast string to SendType

    const destinationId = xmlObject["@_destination"];
    if (destinationId) {
      // TODO:: This requires a way to look up Referenceable instances by ID
      // For now, we'll leave it as undefined
      console.warn(
        `Skipping deserialization of Send destination with ID: ${destinationId}`
      );
    }

    return this;
  }
}
