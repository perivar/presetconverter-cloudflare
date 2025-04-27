// dawproject/send.ts
import type { SendType, Send as SendTyping, XsString } from "./project-schema";
import type { RealParameter } from "./real-parameter";
import { Referenceable } from "./referenceable";

/**
 * Represents a send from a channel.
 * Corresponds to the 'send' complex type in Project.xsd.
 * Inherits attributes and child elements from Referenceable.
 */
export class Send extends Referenceable implements SendTyping {
  /**
   * A reference to the destination channel.
   * (Optional attribute - xs:IDREF)
   */
  public "@_destination"?: XsString;

  /**
   * The type of send (e.g., pre-fader, post-fader).
   * (Optional attribute)
   */
  public "@_type"?: SendType;

  // Properties corresponding to child elements

  /**
   * The pan parameter for the send.
   * (Optional child element)
   */
  public Pan?: RealParameter;

  /**
   * The volume parameter for the send.
   * (Required child element)
   */
  public Volume: RealParameter;

  /**
   * @param volume - The volume parameter for the send. (Required child element)
   * @param destination - A reference to the destination channel. (Optional attribute - xs:IDREF)
   * @param type - The type of send. (Optional attribute)
   * @param name - The name of the send. (Optional attribute inherited from Nameable)
   * @param color - The color of the send. (Optional attribute inherited from Nameable)
   * @param comment - A comment for the send. (Optional attribute inherited from Nameable)
   */
  constructor(
    volume: RealParameter,
    destination?: XsString,
    type?: SendType,
    name?: XsString,
    color?: XsString,
    comment?: XsString
  ) {
    super(name, color, comment); // Call Referenceable constructor (handles id, @_xmlns, name, color, comment)
    this.Volume = volume;
    this["@_destination"] = destination;
    this["@_type"] = type;
  }
}
