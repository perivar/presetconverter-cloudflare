import { SSLNativeBusCompressor } from "../preset/SSLNativeBusCompressor";
import { MultiFormatConverter } from "./MultiFormatConverter";

export const SSLNativeBusCompressorToText: MultiFormatConverter<
  SSLNativeBusCompressor,
  string
> = {
  from: "SSLNativeBusCompressor",
  to: "Text",
  displayName: "SSL Native Bus Compressor",

  convertBase(preset: SSLNativeBusCompressor): string {
    // This converter doesn't perform any actual conversion,
    // it just makes the string representation of the preset available for download.
    return preset.toString();
  },

  outputFormats: [
    {
      formatId: "text",
      extension: ".txt",
      displayName: "Text",
      convert(preset: SSLNativeBusCompressor): string | undefined {
        return preset.toString();
      },
    },
  ],
};
