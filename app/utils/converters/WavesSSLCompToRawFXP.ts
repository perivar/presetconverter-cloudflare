import { WavesSSLComp } from "../preset/WavesSSLComp";
import { MultiFormatConverter } from "./MultiFormatConverter";

export const WavesSSLCompToRawFXP: MultiFormatConverter<
  WavesSSLComp,
  WavesSSLComp
> = {
  from: "WavesSSLComp",
  to: "WavesSSLComp",
  displayName: "Waves SSL Comp",

  convertBase(preset: WavesSSLComp): WavesSSLComp {
    // This converter doesn't perform any actual conversion,
    // it just makes the raw FXP data available for download.
    return preset;
  },

  outputFormats: [
    {
      formatId: "rawfxp",
      extension: ".fxp",
      displayName: "Raw FXP File",
      convert(preset: WavesSSLComp): Uint8Array | undefined {
        return preset.writeFXP();
      },
    },
  ],
};
