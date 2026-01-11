import { FabFilterProQBase } from "../preset/FabFilterProQBase";
import { SteinbergFrequency } from "../preset/SteinbergFrequency";
import { convertFabFilterProQBaseToSteinbergFrequency } from "./FabFilterProQBaseToSteinbergFrequency";
import { MultiFormatConverter } from "./MultiFormatConverter";

export const FabFilterProQBaseToSteinbergFrequency2: MultiFormatConverter<
  FabFilterProQBase,
  SteinbergFrequency
> = {
  from: "FabFilterProQBase", // this gets overridden during registration
  to: "SteinbergFrequency2",
  displayName: "Steinberg Frequency2",

  convertBase(eq: FabFilterProQBase) {
    return convertFabFilterProQBaseToSteinbergFrequency(eq, 2);
  },

  outputFormats: [
    {
      formatId: "vstpreset",
      extension: ".vstpreset",
      displayName: "VSTPreset",
      convert(preset: FabFilterProQBase) {
        const result =
          FabFilterProQBaseToSteinbergFrequency2.convertBase(preset);
        return result.write();
      },
    },
  ],
};
