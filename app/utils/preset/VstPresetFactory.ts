import { FabFilterProQ } from "./FabFilterProQ";
import { FabFilterProQ2 } from "./FabFilterProQ2";
import { FabFilterProQ3 } from "./FabFilterProQ3";
import { SSLNativeBusCompressor } from "./SSLNativeBusCompressor";
import { SSLNativeChannel } from "./SSLNativeChannel";
import { SteinbergCompressor } from "./SteinbergCompressor";
import { SteinbergFrequency } from "./SteinbergFrequency";
import { SteinbergVstPreset } from "./SteinbergVstPreset";
import { UADSSLChannel } from "./UADSSLChannel";
import { VstClassIDs } from "./VstClassIDs";
import { VstPreset } from "./VstPreset";
import { WavesSSLChannel } from "./WavesSSLChannel";
import { WavesSSLComp } from "./WavesSSLComp";

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

    try {
      const vst3ClassID = guid ?? VstPreset.extractVst3ClassID(presetBytes);
      if (vst3ClassID === undefined) {
        return null;
      }

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
        case VstClassIDs.WavesSSLChannelStereo:
          preset = new WavesSSLChannel();
          break;
        case VstClassIDs.WavesSSLCompStereo:
          preset = new WavesSSLComp();
          break;
        case VstClassIDs.SSLNativeChannel2:
          preset = new SSLNativeChannel();
          break;
        case VstClassIDs.SSLNativeBusCompressor2:
          preset = new SSLNativeBusCompressor();
          break;
        case VstClassIDs.UADSSLEChannel:
          preset = new UADSSLChannel();
          break;
        case VstClassIDs.SteinbergCompressor:
          preset = new SteinbergCompressor();
          break;
        default:
          preset = new SteinbergVstPreset();
          break;
      }

      preset.Vst3ClassID = vst3ClassID;
      preset.read(presetBytes);

      // Finalize chunk positions
      preset.CompDataStartPos = 0;
      preset.CompDataChunkSize = presetBytes.length;
      preset.ContDataStartPos = presetBytes.length;
      preset.ContDataChunkSize = 0;
      preset.InfoXmlStartPos = presetBytes.length;

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
}
