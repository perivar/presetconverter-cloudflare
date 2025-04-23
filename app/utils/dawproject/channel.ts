import { XMLBuilder, XMLParser } from "fast-xml-parser";

import { BoolParameter } from "./boolParameter";
import { BuiltInDevice } from "./device/builtInDevice";
import { Compressor } from "./device/compressor";
import { Device } from "./device/device";
import { Equalizer } from "./device/equalizer";
import { Lane } from "./lane";
import { MixerRole } from "./mixerRole";
import { RealParameter } from "./realParameter";
import { Send } from "./send";
import { IChannel, IDevice } from "./types";
import { XML_BUILDER_OPTIONS, XML_PARSER_OPTIONS } from "./xml/options";

// Import other concrete Device subclasses here

/**
 * Represents a mixer channel. It provides the ability to route signals to other channels and can contain
 * Device/Plug-in for processing.
 */
export class Channel extends Lane implements IChannel {
  /** Role of this channel in the mixer. */
  role?: MixerRole;
  /** Number of audio-channels of this mixer channel. (1=mono, 2=stereo…) */
  audioChannels?: number;
  /** Channel volume */
  volume?: RealParameter;
  /** Channel pan/balance */
  pan?: RealParameter;
  /** Channel mute */
  mute?: BoolParameter;
  /** Channel solo */
  solo?: boolean;
  /** Output channel routing */
  destination?: IChannel; // Reference to another Channel
  /** Send levels & destination */
  sends: Send[];
  /** Devices & plug-ins of this channel */
  devices: IDevice[];

  constructor(
    role?: MixerRole,
    audioChannels: number = 2,
    volume?: RealParameter,
    pan?: RealParameter,
    mute?: BoolParameter,
    solo?: boolean,
    destination?: Channel,
    sends?: Send[],
    devices?: Device[],
    name?: string,
    color?: string,
    comment?: string
  ) {
    super(name, color, comment);
    this.role = role;
    this.audioChannels = audioChannels;
    this.volume = volume;
    this.pan = pan;
    this.mute = mute;
    this.solo = solo;
    this.destination = destination;
    this.sends = sends || [];
    this.devices = devices || [];
  }

  toXmlObject(): any {
    // Get base attributes from Lane
    const attributes = super.getXmlAttributes();

    // Add Channel-specific attributes
    if (this.role !== undefined) {
      attributes["@_role"] = this.role;
    }
    if (this.audioChannels !== undefined) {
      attributes["@_audioChannels"] = this.audioChannels;
    }
    if (this.solo !== undefined) {
      attributes["@_solo"] = this.solo;
    }
    if (this.destination !== undefined) {
      attributes["@_destination"] = this.destination.id;
    }

    // Build object with elements
    const obj: any = {
      Channel: {
        ...attributes,
      },
    };

    // Add elements
    if (this.devices && this.devices.length > 0) {
      // Devices element with nested device elements
      obj.Channel.Devices = {
        ...this.devices.reduce((acc: any, device) => {
          const deviceObj = (device as Device).toXmlObject();
          const tagName = Object.keys(deviceObj)[0];
          if (!acc[tagName]) {
            acc[tagName] = [];
          }
          acc[tagName].push(deviceObj[tagName]);
          return acc;
        }, {}),
      };
    }

    // Add optional elements, each in their proper XML element form
    if (this.mute) {
      obj.Channel.Mute = this.mute.toXmlObject().BoolParameter;
    }
    if (this.pan) {
      obj.Channel.Pan = this.pan.toXmlObject().RealParameter;
    }
    if (this.volume) {
      obj.Channel.Volume = this.volume.toXmlObject().RealParameter;
    }
    if (this.sends && this.sends.length > 0) {
      obj.Channel.Sends = {
        Send: this.sends.map(send => send.toXmlObject().Send),
      };
    }

    return obj;
  }

  toXml(): string {
    const builder = new XMLBuilder(XML_BUILDER_OPTIONS);
    return builder.build(this.toXmlObject());
  }

  static fromXmlObject(xmlObject: any): Channel {
    // Create instance of Channel
    const instance = new Channel();

    // Populate inherited attributes
    instance.populateFromXml(xmlObject);

    // Handle required attribute role
    if (!xmlObject["@_role"]) {
      throw new Error("Required attribute 'role' missing in Channel XML");
    }
    instance.role = xmlObject["@_role"] as MixerRole;

    // Handle required attribute audioChannels
    if (!xmlObject["@_audioChannels"]) {
      throw new Error(
        "Required attribute 'audioChannels' missing in Channel XML"
      );
    }
    const audioChannels = parseInt(xmlObject["@_audioChannels"], 10);
    if (isNaN(audioChannels) || audioChannels < 1) {
      throw new Error("Invalid audioChannels value in Channel XML");
    }
    instance.audioChannels = audioChannels;

    // Handle optional elements
    if (xmlObject.Volume) {
      instance.volume = RealParameter.fromXmlObject({
        RealParameter: xmlObject.Volume,
      });
    }

    if (xmlObject.Pan) {
      instance.pan = RealParameter.fromXmlObject({
        RealParameter: xmlObject.Pan,
      });
    }

    if (xmlObject.Mute) {
      instance.mute = BoolParameter.fromXmlObject({
        BoolParameter: xmlObject.Mute,
      });
    }

    // Handle optional solo attribute
    if (xmlObject["@_solo"] !== undefined) {
      instance.solo = String(xmlObject["@_solo"]).toLowerCase() === "true";
    }

    const destinationId = xmlObject["@_destination"];
    if (destinationId) {
      // This requires a way to look up Channel instances by ID
      // For now, we'll leave it as undefined
      console.warn(
        `Skipping deserialization of Channel destination with ID: ${destinationId}`
      );
    }

    // Handle sends array with proper error handling
    instance.sends = [];
    if (xmlObject.Sends?.Send) {
      const sendArray = Array.isArray(xmlObject.Sends.Send)
        ? xmlObject.Sends.Send
        : [xmlObject.Sends.Send];

      instance.sends = sendArray.map((sendObj: any) => {
        try {
          return Send.fromXmlObject(sendObj);
        } catch (error: unknown) {
          const message =
            error instanceof Error ? error.message : String(error);
          throw new Error(`Failed to parse Send: ${message}`);
        }
      });
    }

    const devices: IDevice[] = [];
    if (xmlObject.Devices) {
      // Need a mechanism to determine the correct subclass of Device
      // based on the XML element tag (e.g., BuiltinDevice, Equalizer, Compressor, etc.)
      const deviceTypeMap: { [key: string]: (obj: any) => IDevice } = {
        // Return type is IDevice
        BuiltinDevice: BuiltInDevice.fromXmlObject,
        Equalizer: Equalizer.fromXmlObject,
        Compressor: Compressor.fromXmlObject,
        // Add other concrete Device subclasses here
      };

      for (const tagName in xmlObject.Devices) {
        if (deviceTypeMap[tagName]) {
          const deviceData = xmlObject.Devices[tagName];
          const deviceArray = Array.isArray(deviceData)
            ? deviceData
            : [deviceData];
          deviceArray.forEach((deviceObj: any) => {
            try {
              devices.push(deviceTypeMap[tagName](deviceObj));
            } catch (e) {
              console.error(
                `Error deserializing nested device element ${tagName} in Channel:`,
                e
              );
            }
          });
        } else {
          console.warn(
            `Skipping deserialization of unknown nested device element in Channel: ${tagName}`
          );
        }
      }
    }
    instance.devices = devices;

    return instance;
  }

  static fromXml(xmlString: string): Channel {
    const parser = new XMLParser(XML_PARSER_OPTIONS);
    const jsonObj = parser.parse(xmlString);
    return Channel.fromXmlObject(jsonObj.Channel);
  }
}
