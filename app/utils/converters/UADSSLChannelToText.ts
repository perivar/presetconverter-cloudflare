import { UADSSLChannel } from "../preset/UADSSLChannel";
import { MultiFormatConverter } from "./MultiFormatConverter";

export const UADSSLChannelToText: MultiFormatConverter<UADSSLChannel, string> =
  {
    from: "UADSSLChannel",
    to: "Text",
    displayName: "UAD SSL Channel",

    convertBase(preset: UADSSLChannel): string {
      // This converter doesn't perform any actual conversion,
      // it just makes the string representation of the preset available for download.
      return preset.toString();
    },

    outputFormats: [
      {
        formatId: "txt",
        extension: ".txt",
        displayName: "Text Format",
        convert(preset: UADSSLChannel): string | undefined {
          return preset.toString();
        },
      },
    ],
  };
