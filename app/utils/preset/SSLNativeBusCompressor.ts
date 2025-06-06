import { XMLParser } from "fast-xml-parser";

import { SSLNativePresetBase } from "./SSLNativePresetBase";
import { VstClassIDs } from "./VstClassIDs";

export class SSLNativeBusCompressor extends SSLNativePresetBase {
  public StateASelected: boolean = true;

  // Public Fields (Parameters)
  public Attack: number = 4.0;
  public CompBypass: boolean = false;
  public DryWetMix: number = 100.0;
  public MakeupGain: number = 0.0;
  public Oversampling: number = 0.0;
  public Ratio: number = 3.0;
  public Release: number = 0.0;
  public SidechainHPF: number = 20.0;
  public Threshold: number = 20.0;
  public UseExternalKey: boolean = false;

  public GroupSense: number = 0.0;

  public GuiSlotIndex: number = -1.0; // PARAM_NON_AUTO
  public SessionDataId: number = 0.0; // PARAM_NON_AUTO
  public PluginIdent: number = 0.0; // PARAM_NON_AUTO
  public UniqueId: number = 0.0; // PARAM_NON_AUTO

  constructor(input?: Uint8Array) {
    super(input);
    this.Vst3ClassID = VstClassIDs.SSLNativeBusCompressor2;
    this.PlugInCategory = "Fx|Dynamics";
    this.PlugInName = "SSL Native Bus Compressor 2";
    this.PlugInVendor = "SSL";
  }

  public static parseXml(fileContent: string): SSLNativeBusCompressor {
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: "@_",
      parseAttributeValue: false, // do not convert strings to number automatically
      parseTagValue: false, // do not convert strings to number automatically
    });
    const xml = parser.parse(fileContent);
    return SSLNativeBusCompressor.fromXml(xml);
  }

  public toString(): string {
    const sb: string[] = [];

    sb.push(`PresetName: ${this.PresetName}`);
    sb.push(`StateASelected: ${this.StateASelected}`);
    sb.push(""); // Empty line

    sb.push("Compression:");
    sb.push(`\tThreshold: ${this.Threshold.toFixed(2)} dB`);
    sb.push(`\tMakeup Gain: ${this.MakeupGain.toFixed(2)} dB`);
    sb.push(`\tAttack: ${this.Attack.toFixed(2)} ms`);
    sb.push(`\tRelease: ${this.Release.toFixed(2)} s`);
    sb.push(`\tRatio: ${this.Ratio}:1`);
    sb.push(`\tDry/Wet Mix: ${this.DryWetMix.toFixed(2)} %`);
    sb.push(`\tSidechain HPF: ${this.SidechainHPF.toFixed(2)} Hz`);
    sb.push(`\tOversampling: ${this.Oversampling}`);
    sb.push(`\tBypass: ${this.CompBypass}`);
    sb.push(`\tUse External Key: ${this.UseExternalKey}`);

    sb.push(""); // Empty line

    sb.push(`\tGroup Sense: ${this.GroupSense}`);
    sb.push(`\tGuiSlotIndex: ${this.GuiSlotIndex}`);
    sb.push(`\tSessionDataId: ${this.SessionDataId}`);
    sb.push(`\tPluginIdent: ${this.PluginIdent}`);
    sb.push(`\tUniqueId: ${this.UniqueId}`);

    return sb.join("\n");
  }

  public static fromXml(xml: any): SSLNativeBusCompressor {
    const preset = new SSLNativeBusCompressor();

    preset.PlugInName = xml?.SSL_PLUGIN_STATE?.["@_PluginName"] ?? "";
    preset.PresetVersion = xml?.SSL_PLUGIN_STATE?.["@_Version"] ?? "";

    const stateASelected = xml?.SSL_PLUGIN_STATE?.["@_StateASelected"] ?? "";
    preset.StateASelected = stateASelected === "1";

    const useAState = preset.StateASelected;
    const processorState =
      xml?.SSL_PLUGIN_STATE?.[useAState ? "A" : "B"]?.PROCESSOR_STATE;
    const rootPluginState = xml?.SSL_PLUGIN_STATE; // This contains PARAM_NON_AUTO and root PARAM (GroupSense)

    if (!processorState && !rootPluginState) {
      console.warn("PROCESSOR_STATE or non-auto params not found in XML.");
      return preset;
    }

    // all values are stored as double
    preset.Attack = SSLNativePresetBase.findParamValue(
      processorState,
      "PARAM",
      "Attack"
    );
    preset.CompBypass =
      SSLNativePresetBase.findParamValue(
        processorState,
        "PARAM",
        "CompBypass"
      ) !== 0.0;
    preset.DryWetMix = SSLNativePresetBase.findParamValue(
      processorState,
      "PARAM",
      "DryWetMix"
    );
    preset.MakeupGain = SSLNativePresetBase.findParamValue(
      processorState,
      "PARAM",
      "MakeupGain"
    );
    preset.Oversampling = SSLNativePresetBase.findParamValue(
      processorState,
      "PARAM",
      "Oversampling"
    );
    preset.Ratio = SSLNativePresetBase.findParamValue(
      processorState,
      "PARAM",
      "Ratio"
    );
    preset.Release = SSLNativePresetBase.findParamValue(
      processorState,
      "PARAM",
      "Release"
    );
    preset.SidechainHPF = SSLNativePresetBase.findParamValue(
      processorState,
      "PARAM",
      "SidechainHPF"
    );
    preset.Threshold = SSLNativePresetBase.findParamValue(
      processorState,
      "PARAM",
      "Threshold"
    );
    preset.UseExternalKey =
      SSLNativePresetBase.findParamValue(
        processorState,
        "PARAM",
        "UseExternalKey"
      ) !== 0.0;

    preset.GuiSlotIndex = SSLNativePresetBase.findParamValue(
      rootPluginState,
      "PARAM_NON_AUTO",
      "GuiSlotIndex"
    );
    preset.SessionDataId = SSLNativePresetBase.findParamValue(
      rootPluginState,
      "PARAM_NON_AUTO",
      "SessionDataId"
    );
    preset.PluginIdent = SSLNativePresetBase.findParamValue(
      rootPluginState,
      "PARAM_NON_AUTO",
      "PluginIdent"
    );
    preset.UniqueId = SSLNativePresetBase.findParamValue(
      rootPluginState,
      "PARAM_NON_AUTO",
      "UniqueId"
    );
    preset.GroupSense = SSLNativePresetBase.findParamValue(
      rootPluginState,
      "PARAM",
      "GroupSense"
    );

    return preset;
  }

  protected generatePresetXML(): object {
    const xml = {
      SSL_PLUGIN_STATE: {
        "@_PluginName": this.PlugInName,
        "@_Version": this.PresetVersion,
        "@_StateASelected": this.StateASelected ? 1 : 0, // Set StateASelected attribute
        // PresetType is not available in the provided XML for Bus Compressor
        A: {
          // LastLoadedPreset:
          //   "C:\\ProgramData\\Solid State Logic\\PlugIns\\Presets\\BusCompressor2\\Default Preset.xml",
          PROCESSOR_STATE: {
            PARAM: [
              SSLNativePresetBase.paramToXmlAttribute("Attack", this.Attack),
              SSLNativePresetBase.paramToXmlAttribute(
                "CompBypass",
                this.CompBypass
              ),
              SSLNativePresetBase.paramToXmlAttribute(
                "DryWetMix",
                this.DryWetMix
              ),
              SSLNativePresetBase.paramToXmlAttribute(
                "MakeupGain",
                this.MakeupGain
              ),
              SSLNativePresetBase.paramToXmlAttribute(
                "Oversampling",
                this.Oversampling
              ),
              SSLNativePresetBase.paramToXmlAttribute("Ratio", this.Ratio),
              SSLNativePresetBase.paramToXmlAttribute("Release", this.Release),
              SSLNativePresetBase.paramToXmlAttribute(
                "SidechainHPF",
                this.SidechainHPF
              ),
              SSLNativePresetBase.paramToXmlAttribute(
                "Threshold",
                this.Threshold
              ),
              SSLNativePresetBase.paramToXmlAttribute(
                "UseExternalKey",
                this.UseExternalKey
              ),
            ],
          },
        },
        B: {
          // LastLoadedPreset:
          //   "C:\\ProgramData\\Solid State Logic\\PlugIns\\Presets\\BusCompressor2\\Default Preset.xml",
          PROCESSOR_STATE: {
            PARAM: [
              SSLNativePresetBase.paramToXmlAttribute("Attack", this.Attack),
              SSLNativePresetBase.paramToXmlAttribute(
                "CompBypass",
                this.CompBypass
              ),
              SSLNativePresetBase.paramToXmlAttribute(
                "DryWetMix",
                this.DryWetMix
              ),
              SSLNativePresetBase.paramToXmlAttribute(
                "MakeupGain",
                this.MakeupGain
              ),
              SSLNativePresetBase.paramToXmlAttribute(
                "Oversampling",
                this.Oversampling
              ),
              SSLNativePresetBase.paramToXmlAttribute("Ratio", this.Ratio), // Note: Ratio is 1.0 in B state in example, but using A state default
              SSLNativePresetBase.paramToXmlAttribute("Release", this.Release), // Note: Release is 6.0 in B state in example, but using A state default
              SSLNativePresetBase.paramToXmlAttribute(
                "SidechainHPF",
                this.SidechainHPF
              ),
              SSLNativePresetBase.paramToXmlAttribute(
                "Threshold",
                this.Threshold
              ),
              SSLNativePresetBase.paramToXmlAttribute(
                "UseExternalKey",
                this.UseExternalKey
              ),
            ],
          },
        },
        PARAM_NON_AUTO: [
          SSLNativePresetBase.paramToXmlAttribute(
            "GuiSlotIndex",
            this.GuiSlotIndex
          ),
          SSLNativePresetBase.paramToXmlAttribute(
            "SessionDataId",
            this.SessionDataId
          ),
          SSLNativePresetBase.paramToXmlAttribute(
            "PluginIdent",
            this.PluginIdent
          ),
          SSLNativePresetBase.paramToXmlAttribute("UniqueId", this.UniqueId),
        ],
        PARAM: [
          // GroupSense is a PARAM, but outside PROCESSOR_STATE
          SSLNativePresetBase.paramToXmlAttribute(
            "GroupSense",
            this.GroupSense
          ),
        ],
      },
    };
    return xml;
  }

  public override initFromParameters(): void {
    super.initFromParameters();
    const xml = this.getStringParameter("XmlContent");
    const fxpXmlObject = this.FXP?.xmlContent;

    let parsedPreset: SSLNativeBusCompressor | undefined;

    if (xml) {
      parsedPreset = SSLNativeBusCompressor.parseXml(xml);
    } else if (fxpXmlObject) {
      parsedPreset = SSLNativeBusCompressor.fromXml(fxpXmlObject);
    }

    if (parsedPreset) {
      Object.assign(this, parsedPreset);
      // Preserve specific properties
      this.Vst3ClassID = VstClassIDs.SSLNativeBusCompressor2;
    }
  }
}
