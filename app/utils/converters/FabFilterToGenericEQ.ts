import { FabFilterProQBase } from "../preset/FabFilterProQBase";
import { GenericEQPreset } from "../preset/GenericEQPreset";
import {
  convertFabFilterBand,
  FabFilterBand,
} from "./FabFilterToGenericEQHelpers";
import { MultiFormatConverter } from "./MultiFormatConverter";

export const FabFilterToGenericEQ: MultiFormatConverter<
  FabFilterProQBase,
  GenericEQPreset
> = {
  from: "FabFilter Pro-Q",
  to: "GenericEQPreset",
  displayName: "Generic EQ Preset",

  convertBase(preset: FabFilterProQBase) {
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
      convert(preset: FabFilterProQBase) {
        const result = FabFilterToGenericEQ.convertBase(preset);
        return result.toString();
      },
    },
  ],
};
