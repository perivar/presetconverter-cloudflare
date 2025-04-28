import { Channel } from "./channel";
import { RealParameter } from "./realParameter";
import { Referenceable } from "./referenceable";
import { SendType } from "./sendType";
import { XmlAttribute, XmlElement, XmlIDREF } from "./xmlDecorators";

/** A single send of a mixer channel. */
export class Send extends Referenceable {
  /** Send level. */
  @XmlElement({ required: true, name: "Volume", type: "RealParameter" })
  volume: RealParameter;

  /** Send pan/balance. */
  @XmlElement({ required: false, name: "Pan", type: "RealParameter" })
  pan?: RealParameter;

  /** Send type. */
  @XmlAttribute()
  type: SendType = SendType.post;

  /** Send destination. */
  @XmlAttribute()
  @XmlIDREF
  destination?: Channel;

  constructor(
    volume: RealParameter,
    pan?: RealParameter,
    type?: SendType,
    destination?: Channel
  ) {
    super();
    this.volume = volume;
    this.pan = pan;
    if (type !== undefined) {
      this.type = type;
    }
    this.destination = destination;
  }
}
