import { SSLNativeChannel } from "../preset/SSLNativeChannel";
import { MultiFormatConverter } from "./MultiFormatConverter";

export const SSLNativeChannelToText: MultiFormatConverter<
  SSLNativeChannel,
  string
> = {
  from: "SSLNativeChannel",
  to: "Text",
  displayName: "SSL Native Channel",

  convertBase(preset: SSLNativeChannel): string {
    // This converter doesn't perform any actual conversion,
    // it just makes the string representation of the preset available for download.
    return preset.toString();
  },

  outputFormats: [
    {
      formatId: "text",
      extension: ".txt",
      displayName: "Text File",
      convert(preset: SSLNativeChannel): string | undefined {
        return preset.toString();
      },
    },
  ],
};
