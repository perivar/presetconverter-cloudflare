import { FabfilterProQ } from "./FabfilterProQ";
import { FabfilterProQ2 } from "./FabfilterProQ2";
import { FabfilterProQ3 } from "./FabfilterProQ3";
import { SteinbergVstPreset } from "./SteinbergVstPreset";
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
        case VstPreset.VstClassIDs.FabFilterProQ:
        case VstPreset.VstClassIDs.FabFilterProQx64:
          preset = new FabfilterProQ();
          break;
        case VstPreset.VstClassIDs.FabFilterProQ2:
        case VstPreset.VstClassIDs.FabFilterProQ2x64:
          preset = new FabfilterProQ2();
          break;
        case VstPreset.VstClassIDs.FabFilterProQ3:
          // case VstPreset.VstClassIDs.FabfilterProQ3VST3:
          preset = new FabfilterProQ3();
          break;
        default:
          preset = new SteinbergVstPreset();
          break;
      }

      preset.Vst3ClassID = vst3ClassID;
      preset.read(presetBytes);

      // Set position/size properties
      // preset.Parameters.clear();
      preset.CompDataStartPos = 0;
      preset.CompDataChunkSize = presetBytes.length;
      preset.ContDataStartPos = presetBytes.length;
      preset.ContDataChunkSize = 0;
      preset.InfoXmlStartPos = presetBytes.length;

      // Handle special cases
      if (
        preset.Vst3ClassID === VstPreset.VstClassIDs.FabFilterProQ ||
        preset.Vst3ClassID === VstPreset.VstClassIDs.FabFilterProQx64
      ) {
        (preset as FabfilterProQ).initFromParameters();
      } else if (
        preset.Vst3ClassID === VstPreset.VstClassIDs.FabFilterProQ2 ||
        preset.Vst3ClassID === VstPreset.VstClassIDs.FabFilterProQ2x64
      ) {
        (preset as FabfilterProQ2).initFromParameters();
      } else if (
        preset.Vst3ClassID === VstPreset.VstClassIDs.FabFilterProQ3
        // ||
        // preset.Vst3ClassID === VstPreset.VstClassIDs.FabfilterProQ3VST3
      ) {
        (preset as FabfilterProQ3).initFromParameters();
      }

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
}
