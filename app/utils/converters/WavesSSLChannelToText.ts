import { WavesSSLChannel } from "../preset/WavesSSLChannel";
import { MultiFormatConverter } from "./MultiFormatConverter";

export const WavesSSLChannelToText: MultiFormatConverter<
  WavesSSLChannel,
  string
> = {
  from: "WavesSSLChannel",
  to: "Text",
  displayName: "Waves SSL Channel",

  convertBase(preset: WavesSSLChannel): string {
    // This converter doesn't perform any actual conversion,
    // it just makes the string representation of the preset available for download.
    return preset.toString();
  },

  outputFormats: [
    {
      formatId: "text",
      extension: ".txt",
      displayName: "Text",
      convert(preset: WavesSSLChannel): string | undefined {
        return preset.toString();
      },
    },
  ],
};
