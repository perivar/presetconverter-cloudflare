import { XMLBuilder, XMLParser } from "fast-xml-parser";

import { BoolParameter } from "../boolParameter";
import { IFileReference, IParameter, IVst3Plugin } from "../types";
import { DeviceRole } from "./deviceRole";
import { Plugin } from "./plugin";

/** A VST3 Plug-in instance.
 * The VST3 plug-in state should be stored in .vstpreset format.
 */
export class Vst3Plugin extends Plugin implements IVst3Plugin {
  constructor(
    deviceName: string,
    pluginVersion?: string,
    enabled?: BoolParameter,
    loaded: boolean = true,
    deviceID?: string,
    deviceVendor?: string,
    state?: IFileReference,
    parameters?: IParameter[],
    name?: string,
    color?: string,
    comment?: string
  ) {
    super(
      DeviceRole.AUDIO_FX, // Default to audio effect role
      deviceName,
      enabled,
      loaded,
      deviceID,
      deviceVendor,
      state,
      parameters,
      name,
      color,
      comment,
      pluginVersion
    );
  }

  toXmlObject(): any {
    const obj: any = {
      Vst3Plugin: {
        ...this.getXmlAttributes(),
        ...this.getXmlChildren(),
      },
    };
    return obj;
  }

  toXml(): string {
    const builder = new XMLBuilder({ attributeNamePrefix: "" });
    return builder.build(this.toXmlObject());
  }

  static fromXmlObject(xmlObject: any): Vst3Plugin {
    const instance = new Vst3Plugin(xmlObject.deviceName || "");
    instance.populateFromXml(xmlObject);
    return instance;
  }

  static fromXml(xmlString: string): Vst3Plugin {
    const parser = new XMLParser({ attributeNamePrefix: "" });
    const jsonObj = parser.parse(xmlString);
    return Vst3Plugin.fromXmlObject(jsonObj.Vst3Plugin);
  }
}
