// dawproject/channel.ts
import type { AuPlugin } from "./au-plugin";
import type { BoolParameter } from "./bool-parameter";
import type { BuiltinDevice } from "./builtin-device";
import type { ClapPlugin } from "./clap-plugin";
import type { Compressor } from "./compressor";
import type { Device } from "./device";
import type { Equalizer } from "./equalizer";
import { Lane } from "./lane";
import type { Limiter } from "./limiter";
import type { NoiseGate } from "./noise-gate";
import type {
  Channel as ChannelType,
  MixerRole,
  XsBoolean,
  XsInt,
  XsString,
} from "./project-schema";
import type { RealParameter } from "./real-parameter";
import type { Send } from "./send";
import type { Vst2Plugin } from "./vst2-plugin";
import type { Vst3Plugin } from "./vst3-plugin";

// Union type for different kinds of devices
export type DeviceChoice =
  | Device
  | Vst2Plugin
  | Vst3Plugin
  | ClapPlugin
  | BuiltinDevice
  | Equalizer
  | Compressor
  | NoiseGate
  | Limiter
  | AuPlugin;

/**
 * Represents a channel in the mixer.
 * Corresponds to the 'channel' complex type in Project.xsd.
 * Inherits attributes and child elements from Lane.
 */
export class Channel extends Lane implements ChannelType {
  // XML attributes are prefixed with '@_'

  /**
   * The number of audio channels for this mixer channel.
   * (Optional attribute)
   */
  public "@_audioChannels"?: XsInt;

  /**
   * A reference to the destination channel (e.g., for sends or submixes).
   * (Optional attribute - xs:IDREF)
   */
  public "@_destination"?: XsString;

  /**
   * The role of the mixer channel (e.g., regular, master, effect).
   * (Optional attribute)
   */
  public "@_role"?: MixerRole;

  /**
   * Indicates if the channel is soloed.
   * (Optional attribute)
   */
  public "@_solo"?: XsBoolean;

  // Child elements

  /**
   * A collection of devices (plugins, built-in effects) on this channel.
   * (Optional child element - unbounded choice)
   */
  public Device?: DeviceChoice[];

  /**
   * The mute parameter for the channel.
   * (Optional child element)
   */
  public Mute?: BoolParameter;

  /**
   * The pan parameter for the channel.
   * (Optional child element)
   */
  public Pan?: RealParameter;

  /**
   * A collection of sends from this channel.
   * (Optional child element - unbounded)
   */
  public Send: Send[] = []; // Initialized as empty array for unbounded element

  /**
   * The volume parameter for the channel.
   * (Optional child element)
   */
  public Volume?: RealParameter;

  /**
   * @param role - The role of the mixer channel. (Optional attribute)
   * @param audioChannels - The number of audio channels for this mixer channel. (Optional attribute)
   * @param volume - The volume parameter for the channel. (Optional child element)
   * @param pan - The pan parameter for the channel. (Optional child element)
   * @param mute - The mute parameter for the channel. (Optional child element)
   * @param solo - Indicates if the channel is soloed. (Optional attribute)
   * @param destination - A reference to the destination channel. (Optional attribute - xs:IDREF)
   * @param send - A collection of sends from this channel. (Optional child element - unbounded)
   * @param device - A collection of devices on this channel. (Optional child element - unbounded choice)
   * @param name - The name of the channel. (Optional attribute inherited from Nameable)
   * @param color - The color of the channel. (Optional attribute inherited from Nameable)
   * @param comment - A comment for the channel. (Optional attribute inherited from Nameable)
   */
  constructor(
    role?: MixerRole,
    audioChannels?: XsInt,
    volume?: RealParameter,
    pan?: RealParameter,
    mute?: BoolParameter,
    solo?: XsBoolean,
    destination?: XsString,
    send?: Send[],
    device?: DeviceChoice[],
    name?: XsString,
    color?: XsString,
    comment?: XsString
  ) {
    super(name, color, comment); // Call Lane constructor
    this["@_role"] = role;
    this["@_audioChannels"] = audioChannels;
    this.Volume = volume;
    this.Pan = pan;
    this.Mute = mute;
    this["@_solo"] = solo;
    this["@_destination"] = destination;
    this.Send = send || [];
    this.Device = device || [];
  }
}
