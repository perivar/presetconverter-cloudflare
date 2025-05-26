import { FabfilterProQBase } from "../FabfilterProQBase";
import { GenericEQPreset } from "../GenericEQTypes";
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
    const result: GenericEQPreset = {
      Name: preset.PlugInName || "Unknown Preset",
      Bands: [],
      Version: "1", // Version is not available on base class
      Vendor: preset.PlugInVendor,
    };

    for (const band of preset.Bands) {
      const convertedBand = convertFabFilterBand(band as FabFilterBand);
      result.Bands.push(convertedBand);
    }

    return result;
  },

  outputFormats: [],
};
