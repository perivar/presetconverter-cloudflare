import { XMLBuilder, XMLParser } from "fast-xml-parser";

import { BoolParameter, IBoolParameter } from "./boolParameter";
import { BuiltInDevice } from "./device/builtInDevice";
import { Compressor } from "./device/compressor";
import { Device, IDevice } from "./device/device";
import { Equalizer } from "./device/equalizer";
import { ILane, Lane } from "./lane";
import { MixerRole } from "./mixerRole";
import { IRealParameter, RealParameter } from "./realParameter";
import { ISend, Send } from "./send";

// Import other concrete Device subclasses here

/**
 * Represents a mixer channel. It provides the ability to route signals to other channels and can contain
 * Device/Plug-in for processing.
 */
export interface IChannel extends ILane {
  /** Role of this channel in the mixer. */
  role?: MixerRole;
  /** Number of audio-channels of this mixer channel. (1=mono, 2=stereo…) */
  audioChannels?: number;
  /** Channel volume */
  volume?: IRealParameter;
  /** Channel pan/balance */
  pan?: IRealParameter;
  /** Channel mute */
  mute?: IBoolParameter;
  /** Channel solo */
  solo?: boolean;
  /** Output channel routing */
  destination?: IChannel; // Assuming destination is a reference to another Channel
  /** Send levels & destination */
  sends: ISend[];
  /** Devices & plug-ins of this channel */
  devices: IDevice[];
}

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
  destination?: Channel; // Assuming destination is a reference to another Channel
  /** Send levels & destination */
  sends: Send[];
  /** Devices & plug-ins of this channel */
  devices: Device[];

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
    const obj: any = {
      Channel: {
        ...super.getXmlAttributes(), // Get attributes from Lane
      },
    };

    // Set attributes for the Channel element
    if (this.role !== undefined) {
      obj.Channel.role = this.role;
    }
    if (this.audioChannels !== undefined) {
      obj.Channel.audioChannels = this.audioChannels;
    }
    if (this.solo !== undefined) {
      obj.Channel.solo = this.solo;
    }
    if (this.destination !== undefined) {
      // Assuming destination has an id attribute
      obj.Channel.destination = this.destination.id;
    }

    // Append complex elements if they exist
    if (this.devices && this.devices.length > 0) {
      obj.Channel.Devices = {
        // Need to handle different types of Device subclasses
        ...this.devices.reduce((acc: any, device) => {
          const deviceObj = device.toXmlObject();
          const tagName = Object.keys(deviceObj)[0]; // Get the root tag name from the object
          if (!acc[tagName]) {
            acc[tagName] = [];
          }
          acc[tagName].push(deviceObj[tagName]);
          return acc;
        }, {}),
      };
    }
    if (this.mute) {
      obj.Channel.Mute = this.mute.toXmlObject().BoolParameter; // Assuming BoolParameter has toXmlObject and returns { BoolParameter: ... }
    }
    if (this.pan) {
      obj.Channel.Pan = this.pan.toXmlObject().RealParameter; // Assuming RealParameter has toXmlObject and returns { RealParameter: ... }
    }
    if (this.sends && this.sends.length > 0) {
      obj.Channel.Sends = {
        Send: this.sends.map(send => send.toXmlObject().Send), // Assuming Send has toXmlObject and returns { Send: ... }
      };
    }
    if (this.volume) {
      obj.Channel.Volume = this.volume.toXmlObject().RealParameter; // Assuming RealParameter has toXmlObject and returns { RealParameter: ... }
    }

    return obj;
  }

  toXml(): string {
    const builder = new XMLBuilder({ attributeNamePrefix: "" });
    return builder.build(this.toXmlObject());
  }

  static fromXmlObject(xmlObject: any): Channel {
    const instance = new Channel(); // Create instance of Channel
    instance.populateFromXml(xmlObject); // Populate inherited attributes

    instance.role = xmlObject.role ? (xmlObject.role as MixerRole) : undefined;
    instance.audioChannels =
      xmlObject.audioChannels !== undefined
        ? parseInt(xmlObject.audioChannels, 10)
        : 2;

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

    if (xmlObject.Mute) {
      instance.mute = BoolParameter.fromXmlObject({
        BoolParameter: xmlObject.Mute,
      }); // Wrap in expected structure
    }

    instance.solo =
      xmlObject.solo !== undefined
        ? String(xmlObject.solo).toLowerCase() === "true"
        : undefined;

    const destinationId = xmlObject.destination;
    if (destinationId) {
      // This requires a way to look up Channel instances by ID
      // For now, we'll leave it as undefined
      console.warn(
        `Skipping deserialization of Channel destination with ID: ${destinationId}`
      );
    }

    const sends: Send[] = [];
    if (xmlObject.Sends && xmlObject.Sends.Send) {
      const sendArray = Array.isArray(xmlObject.Sends.Send)
        ? xmlObject.Sends.Send
        : [xmlObject.Sends.Send];
      sendArray.forEach((sendObj: any) => {
        sends.push(Send.fromXmlObject(sendObj)); // Assuming Send has fromXmlObject
      });
    }
    instance.sends = sends;

    const devices: Device[] = [];
    if (xmlObject.Devices) {
      // Need a mechanism to determine the correct subclass of Device
      // based on the XML element tag (e.g., BuiltinDevice, Equalizer, Compressor, etc.)
      const deviceTypeMap: { [key: string]: (obj: any) => any } = {
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
              devices.push(deviceTypeMap[tagName](deviceObj) as Device); // Cast to Device
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
    const parser = new XMLParser({ attributeNamePrefix: "" });
    const jsonObj = parser.parse(xmlString);
    return Channel.fromXmlObject(jsonObj.Channel);
  }
}
