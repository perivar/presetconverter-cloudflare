import { FabFilterProQ } from "./FabFilterProQ";
import { FabFilterProQ2 } from "./FabFilterProQ2";
import { FabFilterProQ3 } from "./FabFilterProQ3";
import { FabFilterProQBase } from "./FabFilterProQBase";
import { FXP } from "./FXP";
import { Preset } from "./Preset"; // Assuming the new factory will return a generic Preset or specific types
import { ReaEQ } from "./ReaEQ";

/**
 * A helper class to get a Preset object from FXP data
 */
export class FXPPresetFactory {
  /**
   * Reads an FXP file, determines the plugin version based on FxID,
   * initializes the corresponding class, and returns it.
   * @param presetBytes - The Uint8Array content of the FXP file.
   * @returns An initialized Preset instance or null if parsing fails or plugin is unknown.
   */
  static getPresetFromFXP(presetBytes: Uint8Array): {
    preset: Preset | null;
    source: string | null;
  } {
    try {
      const fxp = new FXP(presetBytes);
      let presetInstance: Preset | null = null;
      let source: string | null = null;

      // Instantiate correct class based on FxID
      switch (fxp.content?.FxID) {
        case "FPQr":
          source = "FabFilterProQ";
          presetInstance = new FabFilterProQ();
          break;
        case "FQ2p":
          source = "FabFilterProQ2";
          presetInstance = new FabFilterProQ2();
          break;
        case "FQ3p":
          source = "FabFilterProQ3";
          presetInstance = new FabFilterProQ3();
          break;
        case "reeq":
          source = "ReaEQ";
          presetInstance = new ReaEQ();
          presetInstance.read(presetBytes);
          break;
        // Add cases for other FXP-supported classes here
        default:
          console.error(`Unknown or missing FxID: ${fxp.content?.FxID}`);
          return { preset: null, source: null }; // Unknown or missing FxID
      }

      // Check if fxp.content exists before accessing parameters
      if (!fxp.content) {
        console.error("Failed to parse FXP content.");
        return { preset: null, source: null };
      }

      // Add the fxp object to the preset instance if it's a FabFilterProQBase
      if (presetInstance instanceof FabFilterProQBase) {
        presetInstance.FXP = fxp;
      } else if (presetInstance instanceof FXP) {
        // If the preset is the FXP itself, maybe handle differently?
        // For now, assuming we instantiate a Preset class *from* FXP
      }

      // Initialize from FXP parameters. The concrete implementations will use the attached FXP object or parameters.
      // This assumes all Preset classes have an initFromParameters method or similar
      if (
        "initFromParameters" in presetInstance &&
        typeof presetInstance.initFromParameters === "function"
      ) {
        presetInstance.initFromParameters();
      } else if (presetInstance instanceof FXP) {
        // If the preset is the FXP itself, no initFromParameters needed
      } else {
        console.warn(
          `Preset instance of type ${presetInstance?.constructor.name} does not have an initFromParameters method.`
        );
      }

      return { preset: presetInstance, source: source };
    } catch (error) {
      console.error("Error reading or processing FXP file:", error);
      return { preset: null, source: null }; // Error during FXP parsing or processing
    }
  }
}
