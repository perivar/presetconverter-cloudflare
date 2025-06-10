import { SSLNativeChannel } from "../preset/SSLNativeChannel";
import { MultiFormatConverter } from "./MultiFormatConverter";

export const SSLNativeChannelToRawFXP: MultiFormatConverter<
  SSLNativeChannel,
  SSLNativeChannel
> = {
  from: "SSLNativeChannel",
  to: "SSLNativeChannel",
  displayName: "SSL Native Channel",

  convertBase(preset: SSLNativeChannel): SSLNativeChannel {
    // This converter doesn't perform any actual conversion,
    // it just makes the raw FXP data available for download.
    return preset;
  },

  outputFormats: [
    {
      formatId: "rawfxp",
      extension: ".fxp",
      displayName: "Raw FXP File",
      convert(preset: SSLNativeChannel): Uint8Array | undefined {
        return preset.writeFXP();
      },
    },
  ],
};
