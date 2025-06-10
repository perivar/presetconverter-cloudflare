import { UADSSLChannel } from "../preset/UADSSLChannel";
import { MultiFormatConverter } from "./MultiFormatConverter";

export const UADSSLChannelToRawFXP: MultiFormatConverter<
  UADSSLChannel,
  UADSSLChannel
> = {
  from: "UADSSLChannel",
  to: "UADSSLChannel",
  displayName: "UAD SSL Channel",

  convertBase(preset: UADSSLChannel): UADSSLChannel {
    // This converter doesn't perform any actual conversion,
    // it just makes the raw FXP data available for download.
    return preset;
  },

  outputFormats: [
    {
      formatId: "rawfxp",
      extension: ".fxp",
      displayName: "Raw FXP File",
      convert(preset: UADSSLChannel): Uint8Array | undefined {
        return preset.writeFXP();
      },
    },
  ],
};
