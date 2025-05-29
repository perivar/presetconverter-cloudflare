import { GenericFXP } from "../preset/GenericFXP";
import { MultiFormatConverter } from "./MultiFormatConverter";

export const GenericFXPConverter: MultiFormatConverter<GenericFXP, GenericFXP> =
  {
    from: "GenericFXP",
    to: "GenericFXP",
    displayName: "Raw FXP Data",

    convertBase(preset: GenericFXP): GenericFXP {
      // This converter doesn't perform any actual conversion,
      // it just makes the raw FXP data available for download.
      return preset;
    },

    outputFormats: [
      {
        formatId: "rawfxp",
        extension: ".fxp",
        displayName: "Raw FXP File",
        convert(preset: GenericFXP): Uint8Array | undefined {
          return preset.content;
        },
      },
    ],
  };
