import { BoolParameter } from "./boolParameter";
import { Device } from "./device/device"; // Will create device directory and base Device class later
import { Lane } from "./lane";
import { MixerRole } from "./mixerRole";
import { RealParameter } from "./realParameter";
import { Send } from "./send";
import {
  XmlAttribute,
  XmlElement,
  XmlElementWrapper,
  XmlIDREF,
  XmlRootElement,
} from "./xmlDecorators";

/**
 * Represents a mixer channel. It provides the ability to route signals to other channels and can contain
 * Device/Plug-in for processing.
 */
@XmlRootElement({ name: "Channel" })
export class Channel extends Lane {
  /** Role of this channel in the mixer. */
  @XmlAttribute({ required: false })
  role?: MixerRole;

  /** Number of audio-channels of this mixer channel. (1=mono, 2=stereo…) */
  @XmlAttribute({ required: false })
  audioChannels?: number = 2; // Using number for Integer type in TypeScript

  /** Channel volume */
  @XmlElement({ name: "Volume", required: false, type: "RealParameter" })
  volume?: RealParameter;

  /** Channel pan/balance */
  @XmlElement({ name: "Pan", required: false, type: "RealParameter" })
  pan?: RealParameter;

  /** Channel mute */
  @XmlElement({ name: "Mute", required: false, type: "BoolParameter" })
  mute?: BoolParameter;

  /** Channel solo */
  @XmlAttribute({ required: false })
  solo?: boolean;

  /** Output channel routing */
  @XmlAttribute()
  @XmlIDREF
  destination?: Channel; // Self-reference

  /** Send levels & destination */
  @XmlElementWrapper("Sends")
  @XmlElement({ name: "Send", type: "Send" })
  sends: Send[] = [];

  /** Devices & plug-ins of this channel */
  @XmlElementWrapper("Devices")
  @XmlElement({ name: "Device", type: "Device" }) // Using type "Device" for polymorphism
  devices: Device[] = [];
}
