import { GenericCompressorLimiter } from "../preset/GenericCompressorLimiter";
import { SSLNativeBusCompressor } from "../preset/SSLNativeBusCompressor";
import { MultiFormatConverter } from "./MultiFormatConverter";

export const SSLNativeBusCompressorToGenericCompressorLimiter: MultiFormatConverter<
  SSLNativeBusCompressor,
  GenericCompressorLimiter
> = {
  from: "SSLNativeBusCompressor",
  to: "GenericCompressorLimiter",
  displayName: "Generic Compressor/Limiter",

  convertBase(preset: SSLNativeBusCompressor): GenericCompressorLimiter {
    return new GenericCompressorLimiter(
      preset.PresetName || "SSL Native Bus Compressor Preset",
      preset.Threshold,
      preset.Ratio,
      preset.MakeupGain,
      preset.Attack,
      preset.Release,
      6, // SSL Native Bus Compressor doesn't have a direct 'knee' parameter, default to 6 = Moderate soft knee (common)
      0, // SSL Native Bus Compressor doesn't have a 'fade' parameter
      undefined, // SSL Native Bus Compressor doesn't have a 'RateS' parameter
      !preset.CompBypass, // If CompBypass is true, IsIn should be false
      false // SSL Native Bus Compressor doesn't have an 'Analog' parameter
    );
  },

  outputFormats: [
    {
      formatId: "text",
      extension: ".txt",
      displayName: "Text",
      convert(preset: SSLNativeBusCompressor) {
        const result =
          SSLNativeBusCompressorToGenericCompressorLimiter.convertBase(preset);
        return result.toString();
      },
    },
  ],
};
