import { BoolParameter } from "../boolParameter";
import { IFileReference, IParameter, IVst2Plugin } from "../types";
import { DeviceRole } from "./deviceRole";
import { Plugin } from "./plugin";

/** A VST2 Plug-in instance.
 * The VST2 plug-in state should be stored in FXB or FXP format.
 */
export class Vst2Plugin extends Plugin implements IVst2Plugin {
  constructor(
    // Make required fields optional for deserialization, provide defaults
    deviceName?: string,
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
    // Provide default placeholders for required fields
    super(
      DeviceRole.AUDIO_FX, // Default to audio effect role
      deviceName || "", // Default placeholder
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
    const pluginContent = super.toXmlObject(); // Get attributes and children from Plugin's toXmlObject

    return {
      Vst2Plugin: pluginContent, // Wrap the content in the Vst2Plugin tag
    };
  }
}
