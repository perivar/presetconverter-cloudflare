import { FabfilterProQBase } from "../preset/FabfilterProQBase";
import { GenericEQPreset } from "../preset/GenericEQPreset";
import {
  convertFabFilterBand,
  FabFilterBand,
} from "./FabFilterToGenericEQHelpers";
import { MultiFormatConverter } from "./MultiFormatConverter";

export const FabFilterToGenericEQ: MultiFormatConverter<
  FabfilterProQBase,
  GenericEQPreset
> = {
  from: "FabFilter Pro-Q",
  to: "GenericEQPreset",
  displayName: "Generic EQ Preset",

  convertBase(preset: FabfilterProQBase) {
    const result = new GenericEQPreset(
      preset.PlugInName || "Unknown Preset",
      preset.Bands.map(band => convertFabFilterBand(band as FabFilterBand)),
      "1", // Version is not available on base class
      preset.PlugInVendor
    );

    return result;
  },

  outputFormats: [
    {
      formatId: "txt",
      extension: ".txt",
      displayName: "Text Format",
      convert(preset: FabfilterProQBase) {
        const result = FabFilterToGenericEQ.convertBase(preset);
        return result.toString();
      },
    },
  ],
};
