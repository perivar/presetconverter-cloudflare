import { XMLBuilder, XMLParser } from "fast-xml-parser";

import { BoolParameter } from "../boolParameter";
import { IFileReference, IParameter, IVst2Plugin } from "../types";
import { DeviceRole } from "./deviceRole";
import { Plugin } from "./plugin";

/** A VST2 Plug-in instance.
 * The VST2 plug-in state should be stored in FXB or FXP format.
 */
export class Vst2Plugin extends Plugin implements IVst2Plugin {
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
      Vst2Plugin: {
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

  static fromXmlObject(xmlObject: any): Vst2Plugin {
    const instance = new Vst2Plugin(xmlObject.deviceName || "");
    instance.populateFromXml(xmlObject);
    return instance;
  }

  static fromXml(xmlString: string): Vst2Plugin {
    const parser = new XMLParser({ attributeNamePrefix: "" });
    const jsonObj = parser.parse(xmlString);
    return Vst2Plugin.fromXmlObject(jsonObj.Vst2Plugin);
  }
}
