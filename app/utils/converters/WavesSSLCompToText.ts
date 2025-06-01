import { WavesSSLComp } from "../preset/WavesSSLComp";
import { MultiFormatConverter } from "./MultiFormatConverter";

export const WavesSSLCompToText: MultiFormatConverter<WavesSSLComp, string> = {
  from: "WavesSSLComp",
  to: "Text",
  displayName: "Waves SSL Comp",

  convertBase(preset: WavesSSLComp): string {
    // This converter doesn't perform any actual conversion,
    // it just makes the string representation of the preset available for download.
    return preset.toString();
  },

  outputFormats: [
    {
      formatId: "text",
      extension: ".txt",
      displayName: "Text Format",
      convert(preset: WavesSSLComp): string | undefined {
        return preset.toString();
      },
    },
  ],
};
