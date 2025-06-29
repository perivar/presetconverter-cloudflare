import { FabFilterProQ } from "./FabFilterProQ";
import { FabFilterProQ2 } from "./FabFilterProQ2";
import { FabFilterProQ3 } from "./FabFilterProQ3";
import { FXP } from "./FXP";
import { Preset } from "./Preset"; // Assuming the new factory will return a generic Preset or specific types
import { ReaEQ } from "./ReaEQ";
import { UADSSLChannel } from "./UADSSLChannel";
import { VstPreset } from "./VstPreset";

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
    fxp: FXP | null;
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
        case "J9AU":
          source = "UADSSLChannel";
          presetInstance = new UADSSLChannel();
          break;
        case "reeq":
          source = "ReaEQ";
          presetInstance = new ReaEQ();
          break;
        // Add cases for other FXP-supported classes here
        default:
          console.warn(`Unknown or missing FxID: ${fxp.content?.FxID}`);
          return { preset: null, source: null, fxp }; // Unknown or missing FxID
      }

      // Check if fxp.content exists before accessing parameters
      if (!fxp.content) {
        console.warn("Failed to parse FXP content.");
        return { preset: null, source: null, fxp };
      }

      // Add the fxp object to the preset instance if it's a VstPreset
      if (presetInstance instanceof VstPreset) {
        presetInstance.FXP = fxp;
      }

      // make sure to check it there is a initFromParameters method
      // this makes sure that all subclasses of VstPreset are supported
      // but also pure Preset subclasses that have implemented the optional initFromParameters method
      if (presetInstance) {
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
      }

      return { preset: presetInstance, source: source, fxp };
    } catch (error) {
      console.error("Error reading or processing FXP file:", error);
      return { preset: null, source: null, fxp: null }; // Error during FXP parsing or processing
    }
  }
}
