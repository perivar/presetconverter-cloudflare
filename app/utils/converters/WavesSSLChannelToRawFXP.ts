import { WavesSSLChannel } from "../preset/WavesSSLChannel";
import { MultiFormatConverter } from "./MultiFormatConverter";

export const WavesSSLChannelToRawFXP: MultiFormatConverter<
  WavesSSLChannel,
  WavesSSLChannel
> = {
  from: "WavesSSLChannel",
  to: "WavesSSLChannel",
  displayName: "Waves SSL Channel",

  convertBase(preset: WavesSSLChannel): WavesSSLChannel {
    // This converter doesn't perform any actual conversion,
    // it just makes the raw FXP data available for download.
    return preset;
  },

  outputFormats: [
    {
      formatId: "rawfxp",
      extension: ".fxp",
      displayName: "Raw FXP File",
      convert(preset: WavesSSLChannel): Uint8Array | undefined {
        return preset.writeFXP();
      },
    },
  ],
};
