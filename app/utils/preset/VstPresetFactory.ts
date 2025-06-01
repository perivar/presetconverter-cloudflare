import { FabFilterProQ } from "./FabFilterProQ";
import { FabFilterProQ2 } from "./FabFilterProQ2";
import { FabFilterProQ3 } from "./FabFilterProQ3";
import { SSLNativeChannel } from "./SSLNativeChannel";
import { SteinbergCompressor } from "./SteinbergCompressor";
import { SteinbergFrequency } from "./SteinbergFrequency";
import { SteinbergVstPreset } from "./SteinbergVstPreset";
import { VstClassIDs } from "./VstClassIDs";
import { VstPreset } from "./VstPreset";
import { WavesPreset } from "./WavesPreset";
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
        case VstClassIDs.SSLNativeChannel2:
          preset = new SSLNativeChannel();
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

      // Handle some presets after initial read where preset.read does not properly populate the internal properties
      if (
        preset.Vst3ClassID === VstClassIDs.WavesSSLChannelStereo ||
        preset.Vst3ClassID === VstClassIDs.WavesSSLCompStereo
      ) {
        // Read Waves presets expecting to find that XmlContent was found during readCompData while reading VstPreset
        const xmlContent = preset.Parameters.get("XmlContent")?.Value as
          | string
          | undefined;
        if (xmlContent) {
          let wavesPreset: WavesSSLChannel | WavesSSLComp | undefined;
          if (preset.Vst3ClassID === VstClassIDs.WavesSSLChannelStereo) {
            const channelPresetList = WavesPreset.parseXml<WavesSSLChannel>(
              xmlContent,
              WavesSSLChannel
            );
            wavesPreset =
              channelPresetList.length > 0 ? channelPresetList[0] : undefined;
          } else if (preset.Vst3ClassID === VstClassIDs.WavesSSLCompStereo) {
            const compPresetList = WavesPreset.parseXml<WavesSSLComp>(
              xmlContent,
              WavesSSLComp
            );
            wavesPreset =
              compPresetList.length > 0 ? compPresetList[0] : undefined;
          }

          if (wavesPreset) {
            // Copy common properties from the initially created preset
            wavesPreset.Vst3ClassID = preset.Vst3ClassID;
            wavesPreset.CompDataStartPos = preset.CompDataStartPos;
            wavesPreset.CompDataChunkSize = preset.CompDataChunkSize;
            wavesPreset.ContDataStartPos = preset.ContDataStartPos;
            wavesPreset.ContDataChunkSize = preset.ContDataChunkSize;
            wavesPreset.InfoXmlStartPos = preset.InfoXmlStartPos;
            wavesPreset.Parameters = preset.Parameters; // Keep the parameters map
            wavesPreset.FXP = preset.FXP; // Keep FXP if it exists

            preset = wavesPreset; // Reassign preset to the Waves-specific instance
          }
        }
      } else if (preset.Vst3ClassID === VstClassIDs.SSLNativeChannel2) {
        // Read SSL Native presets expecting to find that XmlContent was found during readCompData while reading VstPreset
        const xmlContent = preset.Parameters.get("XmlContent")?.Value as
          | string
          | undefined;
        if (xmlContent) {
          const sslNativePreset = SSLNativeChannel.parseXml(xmlContent);

          if (sslNativePreset) {
            // Copy common properties from the initially created preset
            sslNativePreset.Vst3ClassID = preset.Vst3ClassID;
            sslNativePreset.CompDataStartPos = preset.CompDataStartPos;
            sslNativePreset.CompDataChunkSize = preset.CompDataChunkSize;
            sslNativePreset.ContDataStartPos = preset.ContDataStartPos;
            sslNativePreset.ContDataChunkSize = preset.ContDataChunkSize;
            sslNativePreset.InfoXmlStartPos = preset.InfoXmlStartPos;
            sslNativePreset.Parameters = preset.Parameters; // Keep the parameters map
            sslNativePreset.FXP = preset.FXP; // Keep FXP if it exists

            preset = sslNativePreset; // Reassign preset to the Waves-specific instance
          }
        }
      }

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
}
