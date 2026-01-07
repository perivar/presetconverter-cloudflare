import { VstPreset } from "../preset/VstPreset";
import { MultiFormatConverter } from "./MultiFormatConverter";

export const VstPresetToRawText: MultiFormatConverter<VstPreset, string> = {
  from: "VstPreset",
  to: "Text",
  displayName: "VstPreset Raw Text",

  convertBase(preset: VstPreset): string {
    // This converter doesn't perform any actual conversion,
    // it just makes the string representation of the preset available for download.
    return VstPreset.prototype.toString.call(preset);
  },

  outputFormats: [
    {
      formatId: "text",
      extension: ".txt",
      displayName: "Text",
      convert(preset: VstPreset): string | undefined {
        return VstPreset.prototype.toString.call(preset);
      },
    },
  ],
};
