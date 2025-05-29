// app/utils/ableton/AbletonUnwrapper.ts
import { FXPPresetFactory } from "~/utils/preset/FXPPresetFactory";
import { GenericFXP } from "~/utils/preset/GenericFXP"; // Import GenericFXP
import { GenericXML } from "~/utils/preset/GenericXML"; // Import GenericXML

import { AbletonDevicePreset } from "./AbletonDevicePreset";
import { AbletonPlugin } from "./AbletonPlugin";

/**
 * Unwraps an AbletonDevicePreset to provide data in a format suitable
 * for the TargetConversion component.
 *
 * @param preset The AbletonDevicePreset instance.
 * @returns An object containing sourceData and sourceFormatId.
 */
export function unwrapAbletonDevicePreset(preset: AbletonDevicePreset): {
  sourceData: any;
  sourceFormatId: string;
} {
  let sourceData: any = preset.content;
  let sourceFormatId: string = "";

  // Check if the format is fxp and if raw data is available in preset.data
  if (preset.format === "fxp" && preset.content instanceof Uint8Array) {
    const fxpResult = FXPPresetFactory.getPresetFromFXP(preset.content);
    if (fxpResult.preset) {
      // Successfully parsed a specific FXP preset type
      sourceData = fxpResult.preset;
      sourceFormatId =
        sourceData.PlugInName || fxpResult.source || "Unknown FXP Preset";
    } else {
      // It's an FXP, but not a recognized specific type
      sourceData = new GenericFXP(preset.content, preset.pluginName); // Create GenericFXP instance
      sourceFormatId = "GenericFXP"; // Set sourceFormatId to match the new type
    }
  } else if (preset.format === "xml" && typeof preset.content === "string") {
    // It's an XML, but not a recognized specific type
    sourceData = new GenericXML(preset.content, preset.pluginName); // Create GenericXML instance
    sourceFormatId = "GenericXML"; // Set sourceFormatId to match the new type
  } else if (sourceData instanceof AbletonPlugin) {
    // If the content is an AbletonPlugin instance, use its constructor name
    sourceFormatId = sourceData.constructor.name;
  } else if (preset.pluginName) {
    // Fallback to pluginName if available
    sourceFormatId = preset.pluginName;
  } else {
    // Final fallback: combine format and filename (without extension)
    const filenameWithoutExt = preset.filename; // filename property is already without extension
    sourceFormatId = `${preset.format}_${filenameWithoutExt}`;
  }

  return {
    sourceData: sourceData,
    sourceFormatId: sourceFormatId,
  };
}
