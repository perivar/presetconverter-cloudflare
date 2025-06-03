import { FabFilterProQ3 } from "../preset/FabFilterProQ3";
import { GenericFXP } from "../preset/GenericFXP";
import { MultiFormatConverter } from "./MultiFormatConverter";

export const FabFilterProQ3ToGenericFXP: MultiFormatConverter<
  FabFilterProQ3,
  GenericFXP
> = {
  from: "FabFilterProQ3",
  to: "GenericFXP",
  displayName: "Generic FXP",

  convertBase(preset: FabFilterProQ3) {
    const fxpContent = preset.writeFXP(
      preset.PlugInName || "FabFilter Pro-Q 3 Preset"
    );
    if (!fxpContent) {
      throw new Error(
        "Failed to write FXP content from FabFilter Pro-Q 3 preset."
      );
    }
    return new GenericFXP(fxpContent, preset.PlugInName);
  },

  outputFormats: [
    {
      formatId: "fxp",
      extension: ".fxp",
      displayName: "FXP Format",
      convert(preset: FabFilterProQ3) {
        const result = FabFilterProQ3ToGenericFXP.convertBase(preset);
        return result.writeFXP(preset.PlugInName || "FabFilter Pro-Q 3 Preset");
      },
    },
  ],
};
