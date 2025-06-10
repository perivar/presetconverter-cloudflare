import { SSLNativeBusCompressor } from "../preset/SSLNativeBusCompressor";
import { MultiFormatConverter } from "./MultiFormatConverter";

export const SSLNativeBusCompressorToRawFXP: MultiFormatConverter<
  SSLNativeBusCompressor,
  SSLNativeBusCompressor
> = {
  from: "SSLNativeBusCompressor",
  to: "SSLNativeBusCompressor",
  displayName: "SSL Native Bus Compressor",

  convertBase(preset: SSLNativeBusCompressor): SSLNativeBusCompressor {
    // This converter doesn't perform any actual conversion,
    // it just makes the raw FXP data available for download.
    return preset;
  },

  outputFormats: [
    {
      formatId: "rawfxp",
      extension: ".fxp",
      displayName: "Raw FXP File",
      convert(preset: SSLNativeBusCompressor): Uint8Array | undefined {
        return preset.writeFXP();
      },
    },
  ],
};
