import { XMLParser } from "fast-xml-parser";

import { Encoding, NewLineHandling, XmlWriter } from "../XmlWriter";
import { SteinbergVstPreset } from "./SteinbergVstPreset";
import { VstClassIDs } from "./VstClassIDs";

export class SSLNativeBusCompressor extends SteinbergVstPreset {
  public PresetName: string = "";
  public PresetVersion: string = "";
  public PresetType: string = "";
  public StateASelected: boolean = true; // New property

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
      parseAttributeValue: true,
    });
    const xml = parser.parse(fileContent);
    return SSLNativeBusCompressor.fromXml(xml);
  }

  public toXmlString(xmlObject: object): string {
    const xmlContent = XmlWriter(xmlObject, {
      OmitXmlDeclaration: true,
      Encoding: Encoding.UTF8,
      Indent: true,
      IndentChars: "    ",
      NewLineChars: "\n",
      NewLineHandling: NewLineHandling.Replace,
    });

    return xmlContent;
  }

  protected preparedForWriting(): boolean {
    this.initCompChunkData();
    this.initInfoXml();
    this.calculateBytePositions();
    return true;
  }

  protected initCompChunkData(): void {
    const xmlContent = this.toXmlString(this.generatePresetXML());
    this.CompChunkData = new TextEncoder().encode(xmlContent);
  }

  public toString(): string {
    const sb: string[] = [];

    sb.push(`PresetName: ${this.PresetName}`);
    sb.push("");

    sb.push("Compression:");
    sb.push(`\tAttack: ${this.Attack.toFixed(2)} ms`);
    sb.push(`\tRelease: ${this.Release.toFixed(2)} s`);
    sb.push(`\tRatio: ${this.Ratio.toFixed(2)}:1`);
    sb.push(`\tThreshold: ${this.Threshold.toFixed(2)} dB`);
    sb.push(`\tMakeup Gain: ${this.MakeupGain.toFixed(2)} dB`);
    sb.push(`\tDry/Wet Mix: ${this.DryWetMix.toFixed(2)} %`);
    sb.push(`\tSidechain HPF: ${this.SidechainHPF.toFixed(2)} Hz`);
    sb.push(`\tOversampling: ${this.Oversampling}`);
    sb.push(`\tBypass: ${this.CompBypass}`);
    sb.push(`\tUse External Key: ${this.UseExternalKey}`);
    sb.push(`\tGroup Sense: ${this.GroupSense}`);

    return sb.join("\n");
  }

  private static paramToXmlAttribute(
    paramName: string,
    paramValue: number | boolean
  ): object {
    const value =
      typeof paramValue === "boolean" ? (paramValue ? 1.0 : 0.0) : paramValue;
    return {
      "@_id": paramName,
      "@_value": value.toFixed(4), // Keep up to 4 decimal places
    };
  }

  private static findParamValue(
    paramsContainer: any,
    paramType: string, // "PARAM" or "PARAM_NON_AUTO"
    paramId: string
  ): number {
    if (!paramsContainer || !paramsContainer[paramType]) {
      return 0;
    }

    const params = Array.isArray(paramsContainer[paramType])
      ? paramsContainer[paramType]
      : [paramsContainer[paramType]];
    const param = params.find((p: any) => p?.["@_id"] === paramId);

    return Number.parseFloat(param?.["@_value"] ?? "0");
  }

  private static fromXml(xml: any): SSLNativeBusCompressor {
    const preset = new SSLNativeBusCompressor();

    preset.PlugInName = xml?.SSL_PLUGIN_STATE?.["@_PluginName"] ?? "";
    preset.PresetVersion = xml?.SSL_PLUGIN_STATE?.["@_Version"] ?? "";
    preset.StateASelected =
      (xml?.SSL_PLUGIN_STATE?.["@_StateASelected"] ?? "1") === "1";

    const useAState = preset.StateASelected;
    const processorState =
      xml?.SSL_PLUGIN_STATE?.[useAState ? "A" : "B"]?.PROCESSOR_STATE;
    const rootPluginState = xml?.SSL_PLUGIN_STATE; // This contains PARAM_NON_AUTO and root PARAM (GroupSense)

    if (!processorState && !rootPluginState) {
      console.warn("PROCESSOR_STATE or non-auto params not found in XML.");
      return preset;
    }

    // all values are stored as double
    preset.Attack = SSLNativeBusCompressor.findParamValue(
      processorState,
      "PARAM",
      "Attack"
    );
    preset.CompBypass =
      SSLNativeBusCompressor.findParamValue(
        processorState,
        "PARAM",
        "CompBypass"
      ) !== 0.0;
    preset.DryWetMix = SSLNativeBusCompressor.findParamValue(
      processorState,
      "PARAM",
      "DryWetMix"
    );
    preset.MakeupGain = SSLNativeBusCompressor.findParamValue(
      processorState,
      "PARAM",
      "MakeupGain"
    );
    preset.Oversampling = SSLNativeBusCompressor.findParamValue(
      processorState,
      "PARAM",
      "Oversampling"
    );
    preset.Ratio = SSLNativeBusCompressor.findParamValue(
      processorState,
      "PARAM",
      "Ratio"
    );
    preset.Release = SSLNativeBusCompressor.findParamValue(
      processorState,
      "PARAM",
      "Release"
    );
    preset.SidechainHPF = SSLNativeBusCompressor.findParamValue(
      processorState,
      "PARAM",
      "SidechainHPF"
    );
    preset.Threshold = SSLNativeBusCompressor.findParamValue(
      processorState,
      "PARAM",
      "Threshold"
    );
    preset.UseExternalKey =
      SSLNativeBusCompressor.findParamValue(
        processorState,
        "PARAM",
        "UseExternalKey"
      ) !== 0.0;

    preset.GuiSlotIndex = SSLNativeBusCompressor.findParamValue(
      rootPluginState,
      "PARAM_NON_AUTO",
      "GuiSlotIndex"
    );
    preset.SessionDataId = SSLNativeBusCompressor.findParamValue(
      rootPluginState,
      "PARAM_NON_AUTO",
      "SessionDataId"
    );
    preset.PluginIdent = SSLNativeBusCompressor.findParamValue(
      rootPluginState,
      "PARAM_NON_AUTO",
      "PluginIdent"
    );
    preset.UniqueId = SSLNativeBusCompressor.findParamValue(
      rootPluginState,
      "PARAM_NON_AUTO",
      "UniqueId"
    );
    preset.GroupSense = SSLNativeBusCompressor.findParamValue(
      rootPluginState,
      "PARAM",
      "GroupSense"
    );

    return preset;
  }

  private generatePresetXML(): object {
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
              SSLNativeBusCompressor.paramToXmlAttribute("Attack", this.Attack),
              SSLNativeBusCompressor.paramToXmlAttribute(
                "CompBypass",
                this.CompBypass
              ),
              SSLNativeBusCompressor.paramToXmlAttribute(
                "DryWetMix",
                this.DryWetMix
              ),
              SSLNativeBusCompressor.paramToXmlAttribute(
                "MakeupGain",
                this.MakeupGain
              ),
              SSLNativeBusCompressor.paramToXmlAttribute(
                "Oversampling",
                this.Oversampling
              ),
              SSLNativeBusCompressor.paramToXmlAttribute("Ratio", this.Ratio),
              SSLNativeBusCompressor.paramToXmlAttribute(
                "Release",
                this.Release
              ),
              SSLNativeBusCompressor.paramToXmlAttribute(
                "SidechainHPF",
                this.SidechainHPF
              ),
              SSLNativeBusCompressor.paramToXmlAttribute(
                "Threshold",
                this.Threshold
              ),
              SSLNativeBusCompressor.paramToXmlAttribute(
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
              SSLNativeBusCompressor.paramToXmlAttribute("Attack", this.Attack),
              SSLNativeBusCompressor.paramToXmlAttribute(
                "CompBypass",
                this.CompBypass
              ),
              SSLNativeBusCompressor.paramToXmlAttribute(
                "DryWetMix",
                this.DryWetMix
              ),
              SSLNativeBusCompressor.paramToXmlAttribute(
                "MakeupGain",
                this.MakeupGain
              ),
              SSLNativeBusCompressor.paramToXmlAttribute(
                "Oversampling",
                this.Oversampling
              ),
              SSLNativeBusCompressor.paramToXmlAttribute("Ratio", this.Ratio), // Note: Ratio is 1.0 in B state in example, but using A state default
              SSLNativeBusCompressor.paramToXmlAttribute(
                "Release",
                this.Release
              ), // Note: Release is 6.0 in B state in example, but using A state default
              SSLNativeBusCompressor.paramToXmlAttribute(
                "SidechainHPF",
                this.SidechainHPF
              ),
              SSLNativeBusCompressor.paramToXmlAttribute(
                "Threshold",
                this.Threshold
              ),
              SSLNativeBusCompressor.paramToXmlAttribute(
                "UseExternalKey",
                this.UseExternalKey
              ),
            ],
          },
        },
        PARAM_NON_AUTO: [
          SSLNativeBusCompressor.paramToXmlAttribute(
            "GuiSlotIndex",
            this.GuiSlotIndex
          ),
          SSLNativeBusCompressor.paramToXmlAttribute(
            "SessionDataId",
            this.SessionDataId
          ),
          SSLNativeBusCompressor.paramToXmlAttribute(
            "PluginIdent",
            this.PluginIdent
          ),
          SSLNativeBusCompressor.paramToXmlAttribute("UniqueId", this.UniqueId),
        ],
        PARAM: [
          // GroupSense is a PARAM, but outside PROCESSOR_STATE
          SSLNativeBusCompressor.paramToXmlAttribute(
            "GroupSense",
            this.GroupSense
          ),
        ],
      },
    };
    return xml;
  }

  // Reads parameters from the internal Parameters map populated by the base class constructor
  public initFromParameters(): void {
    // Not implemented for SSL Native Bus Compressor presets as parameters are read from XML
  }
}
