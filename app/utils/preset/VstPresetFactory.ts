import { FabFilterProQ } from "./FabFilterProQ";
import { FabFilterProQ2 } from "./FabFilterProQ2";
import { FabFilterProQ3 } from "./FabFilterProQ3";
import { FabFilterProQBase } from "./FabFilterProQBase";
import { FXP } from "./FXP";
import { SteinbergFrequency } from "./SteinbergFrequency";
import { SteinbergVstPreset } from "./SteinbergVstPreset";
import { VstClassIDs } from "./VstClassIDs";
import { VstPreset } from "./VstPreset";

/**
 * A helper class to get a VstPreset object
 */
export class VstPresetFactory {
  /**
   * Initialize a VstPreset using a byte array and guid
   * @param presetBytes - preset bytes
   * @param guid - plugin guid
   * @param pluginName - optional plugin name (only used for error messages)
   * @returns a VstPreset object
   */
  public static getVstPreset<T extends VstPreset>(
    presetBytes: Uint8Array,
    guid?: string,
    pluginName?: string
  ): T | null {
    let preset: VstPreset;
    let vst3ClassID = guid;

    try {
      if (!vst3ClassID) {
        // If no guid provided, read from preset bytes
        const tempPreset = new SteinbergVstPreset();
        tempPreset.read(presetBytes);
        vst3ClassID = tempPreset.Vst3ClassID;
      }

      // Create appropriate preset based on guid
      switch (vst3ClassID) {
        case VstClassIDs.FabFilterProQ:
        case VstClassIDs.FabFilterProQx64:
          preset = new FabFilterProQ();
          break;
        case VstClassIDs.FabFilterProQ2:
        case VstClassIDs.FabFilterProQ2x64:
          preset = new FabFilterProQ2();
          break;
        case VstClassIDs.FabFilterProQ3:
        case VstClassIDs.FabFilterProQ3VST3:
          preset = new FabFilterProQ3();
          break;
        case VstClassIDs.SteinbergFrequency:
          preset = new SteinbergFrequency();
          break;
        default:
          preset = new SteinbergVstPreset();
          break;
      }

      preset.Vst3ClassID = vst3ClassID;
      preset.read(presetBytes);

      // Set position/size properties
      preset.CompDataStartPos = 0;
      preset.CompDataChunkSize = presetBytes.length;
      preset.ContDataStartPos = presetBytes.length;
      preset.ContDataChunkSize = 0;
      preset.InfoXmlStartPos = presetBytes.length;

      // Reads parameters from the internal Parameters map populated by the base class constructor
      preset.initFromParameters();

      return preset as T;
    } catch (error) {
      console.error(
        `Failed initializing VstPreset${guid ? ` using guid: ${guid}` : ""}${
          pluginName ? ` and name ${pluginName}` : ""
        }. Error: ${error}`
      );
      return null;
    }
  }

  /**
   * Reads an FXP file, determines the FabFilter Pro-Q version,
   * initializes the corresponding class, and returns it.
   * @param presetBytes - The Uint8Array content of the FXP file.
   * @returns An initialized FabFilterProQBase instance or null if parsing fails or version is unknown.
   */
  static getFabFilterProQPresetFromFXP(presetBytes: Uint8Array): {
    preset: FabFilterProQBase | null;
    source: string | null;
  } {
    try {
      const fxp = new FXP(presetBytes);
      let proQInstance: FabFilterProQBase | null = null;
      let source: string | null = null;

      // Instantiate correct class based on FxID
      switch (fxp.content?.FxID) {
        case "FPQr":
          source = "FabFilterProQ";
          proQInstance = new FabFilterProQ();
          break;
        case "FQ2p":
          source = "FabFilterProQ2";
          proQInstance = new FabFilterProQ2();
          break;
        case "FQ3p":
          source = "FabFilterProQ3";
          proQInstance = new FabFilterProQ3();
          break;
        default:
          console.error(
            `Unknown or missing FabFilter FxID: ${fxp.content?.FxID}`
          );
          return { preset: null, source: null }; // Unknown or missing FxID
      }

      // Check if fxp.content exists before accessing parameters
      if (!fxp.content) {
        console.error("Failed to parse FXP content.");
        return { preset: null, source: null };
      }

      // Add the fxp object to the proQInstance object
      proQInstance.FXP = fxp;

      // Initialize from FXP parameters. The concrete implementations will use the attached FXP object.
      proQInstance.initFromParameters();

      return { preset: proQInstance, source: source };
    } catch (error) {
      console.error("Error reading or processing FXP file:", error);
      return { preset: null, source: null }; // Error during FXP parsing or processing
    }
  }
}
