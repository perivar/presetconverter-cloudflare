import { XMLParser } from "fast-xml-parser";

import { Encoding, NewLineHandling, XmlWriter } from "../XmlWriter";
import { SteinbergVstPreset } from "./SteinbergVstPreset";
import { VstClassIDs } from "./VstClassIDs";

export class SSLNativeChannel extends SteinbergVstPreset {
  public PresetName: string = "";
  public PresetVersion: string = "";
  public PresetType: string = "";

  // Public Fields (Parameters)
  public Bypass: boolean = false;
  public CompFastAttack: boolean = false;
  public CompMix: number = 100.0;
  public CompPeak: number = 0.0;
  public CompRatio: number = 6.0;
  public CompRelease: number = 0.1000000014901161;
  public CompThreshold: number = 10.0;
  public DynamicsIn: boolean = true;
  public DynamicsPreEq: boolean = false;
  public EqE: boolean = false;
  public EqIn: boolean = true;
  public EqToSidechain: boolean = false;
  public FaderLevel: number = 0.0;
  public FiltersToInput: boolean = true;
  public FiltersToSidechain: boolean = false;
  public GateDisabledExpEnabled: boolean = false;
  public GateFastAttack: boolean = false;
  public GateHold: number = 0.25;
  public GateRange: number = 0.0;
  public GateRelease: number = 0.1000000014901161;
  public GateThreshold: number = 10.0;
  public HighEqBell: boolean = false;
  public HighEqFreq: number = 7.500000476837158;
  public HighEqGain: number = 0.0;
  public HighMidEqFreq: number = 2.5;
  public HighMidEqGain: number = 0.0;
  public HighMidEqQ: number = 1.5;
  public HighPassFreq: number = 20.0;
  public InputTrim: number = 0.0;
  public LowEqBell: boolean = false;
  public LowEqFreq: number = 185.0;
  public LowEqGain: number = 0.0;
  public LowMidEqFreq: number = 0.800000011920929;
  public LowMidEqGain: number = 0.0;
  public LowMidEqQ: number = 1.5;
  public LowPassFreq: number = 35.0;
  public OutputTrim: number = 0.0;
  public Pan: number = 0.0;
  public PhaseInvert: boolean = false;
  public SidechainListen: boolean = false;
  public UseExternalKey: boolean = false;
  public Width: number = 100.0;
  public HighQuality: boolean = false; // PARAM_NON_AUTO

  constructor(input?: Uint8Array) {
    super(input);
    this.Vst3ClassID = VstClassIDs.SSLNativeChannel2;
    this.PlugInCategory = "Fx|EQ";
    this.PlugInName = "SSL Native Channel Strip 2";
    this.PlugInVendor = "SSL";
  }

  public static parseXml(fileContent: string): SSLNativeChannel {
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: "@_",
      parseAttributeValue: true,
    });
    const xml = parser.parse(fileContent);
    return SSLNativeChannel.fromXml(xml);
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

    // Determine the processing order of filter (FLTR), dynamic range processing (DYN),
    // and equalization (EQ) based on the values of the variables FiltersToInput and DynamicsPreEq.
    // The order of processing is determined by the following conditions:
    // 1. If FiltersToInput is 1 and DynamicsPreEq is 1, the order is FLTR -> DYN -> EQ.
    // 2. If FiltersToInput is 1 and DynamicsPreEq is 0, the order is FLTR -> EQ -> DYN.
    // 3. If FiltersToInput is 0 and DynamicsPreEq is 1, the order is DYN -> EQ -> FLTR.
    // 4. If FiltersToInput is 0 and DynamicsPreEq is 0, the default order is EQ -> FLTR -> DYN.
    // The results are appended to a StringBuilder (sb) to represent the determined processing order.
    sb.push("Routing Diagram: ");
    if (this.FiltersToInput && this.DynamicsPreEq) {
      sb.push("FLTR -> DYN -> EQ");
    } else if (this.FiltersToInput && !this.DynamicsPreEq) {
      sb.push("FLTR -> EQ -> DYN");
    } else if (!this.FiltersToInput && this.DynamicsPreEq) {
      sb.push("DYN -> EQ -> FLTR");
    } else if (!this.FiltersToInput && !this.DynamicsPreEq) {
      sb.push("EQ -> FLTR -> DYN (default)");
    }
    sb.push("");

    sb.push("Low and High Pass Filters:");
    sb.push(
      `\tHP Frequency (18 dB/octave): ${this.HighPassFreq.toFixed(2)} Hz (16 - 350 Hz)`
    );
    sb.push(
      `\tLP Frequency (12 dB/octave): ${this.LowPassFreq.toFixed(2)} KHz (22 - 3 KHz)`
    );
    sb.push("");

    sb.push("Compression:");
    sb.push(`\tThreshold: ${this.CompThreshold.toFixed(2)} dB`);
    sb.push(`\tRatio: ${this.CompRatio.toFixed(2)}:1`);
    sb.push(`\tRelease: ${this.CompRelease.toFixed(2)} s`);
    sb.push(`\tMix: ${this.CompMix.toFixed(2)} %`);
    sb.push(`\tFast Attack: ${this.CompFastAttack}`);
    sb.push(`\tPeak: ${this.CompPeak}`);
    sb.push("");

    sb.push("Expander/Gate:");
    sb.push(
      `\tExpander Enabled (Gate Disabled): ${this.GateDisabledExpEnabled}`
    );
    sb.push(`\tThreshold: ${this.GateThreshold.toFixed(2)} dB`);
    sb.push(`\tRange: ${this.GateRange.toFixed(2)} dB`);
    sb.push(`\tHold: ${this.GateHold.toFixed(2)} s`);
    sb.push(`\tFast Attack: ${this.GateFastAttack}`);
    sb.push(`\tRelease: ${this.GateRelease.toFixed(2)} s`);
    sb.push("");

    sb.push("Dynamics/ Routing:");
    sb.push(`\tDynamicsIn: ${this.DynamicsIn}`);
    sb.push(`\tDynamicsPreEq: ${this.DynamicsPreEq}`);
    sb.push(`\tFiltersToInput: ${this.FiltersToInput}`);
    sb.push(`\tFiltersToSidechain: ${this.FiltersToSidechain}`);
    sb.push("");

    sb.push("EQ Section:");
    sb.push(`\tLF Type Bell: ${this.LowEqBell}`);
    sb.push(`\tLF Gain: ${this.LowEqGain.toFixed(2)} dB`);
    sb.push(`\tLF Frequency: ${this.LowEqFreq.toFixed(2)} Hz`);

    sb.push(`\tLMF Gain: ${this.LowMidEqGain.toFixed(2)} dB`);
    sb.push(`\tLMF Frequency: ${this.LowMidEqFreq.toFixed(2)} KHz`);
    sb.push(`\tLMF Q: ${this.LowMidEqQ.toFixed(2)}`);

    sb.push(`\tHMF Gain: ${this.HighMidEqGain.toFixed(2)} dB`);
    sb.push(`\tHMF Frequency: ${this.HighMidEqFreq.toFixed(2)} KHz`);
    sb.push(`\tHMF Q: ${this.HighMidEqQ.toFixed(2)}`);

    sb.push(`\tHF Type Bell: ${this.HighEqBell}`);
    sb.push(`\tHF Gain: ${this.HighEqGain.toFixed(2)} dB`);
    sb.push(`\tHF Frequency: ${this.HighEqFreq.toFixed(2)} KHz`);
    sb.push(`\tEqIn: ${this.EqIn}`);
    sb.push(`\tEqE: ${this.EqE}`);
    sb.push(`\tEqToSidechain: ${this.EqToSidechain}`);
    sb.push("");

    sb.push("Master Section:");
    sb.push(`\tBypass: ${this.Bypass}`);
    sb.push(`\tFader Level: ${this.FaderLevel.toFixed(2)} dB`);
    sb.push(`\tInput Trim: ${this.InputTrim.toFixed(2)} dB`);
    sb.push(`\tOutput Trim: ${this.OutputTrim.toFixed(2)} dB`);
    sb.push(`\tPan: ${this.Pan}`);
    sb.push(`\tPhase Invert: ${this.PhaseInvert}`);
    sb.push(`\tSidechain Listen: ${this.SidechainListen}`);
    sb.push(`\tUse External Key: ${this.UseExternalKey}`);
    sb.push(`\tWidth: ${this.Width.toFixed(2)} %`);
    sb.push(`\tHigh Quality: ${this.HighQuality}`);

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

  private static paramFromXml(
    xml: any,
    paramId: string,
    IsNonAutoParam: boolean = false
  ): number {
    const paramType = IsNonAutoParam ? "PARAM_NON_AUTO" : "PARAM";
    const processorState = xml?.SSL_PRESET?.PROCESSOR_STATE;

    if (!processorState) {
      return 0;
    }

    // Ensure processorState[paramType] is an array, even if it's a single object
    const params = Array.isArray(processorState[paramType])
      ? processorState[paramType]
      : [processorState[paramType]];

    const param = params.find((p: any) => p?.["@_id"] === paramId);
    return Number.parseFloat(param?.["@_value"] ?? "0");
  }

  private static fromXml(xml: any): SSLNativeChannel {
    const preset = new SSLNativeChannel();
    const processorState = xml?.SSL_PRESET?.PROCESSOR_STATE;

    if (!processorState) {
      console.warn("PROCESSOR_STATE not found in XML.");
      return preset;
    }

    preset.PlugInName = xml?.SSL_PRESET?.["@_PluginName"] ?? "";
    preset.PresetVersion = xml?.SSL_PRESET?.["@_Version"] ?? "";
    preset.PresetType = xml?.SSL_PRESET?.["@_PresetType"] ?? "";

    // all values are stored as double
    preset.Bypass = SSLNativeChannel.paramFromXml(xml, "Bypass") !== 0.0;
    preset.CompFastAttack =
      SSLNativeChannel.paramFromXml(xml, "CompFastAttack") !== 0.0;
    preset.CompMix = SSLNativeChannel.paramFromXml(xml, "CompMix");
    preset.CompPeak = SSLNativeChannel.paramFromXml(xml, "CompPeak");
    preset.CompRatio = SSLNativeChannel.paramFromXml(xml, "CompRatio");
    preset.CompRelease = SSLNativeChannel.paramFromXml(xml, "CompRelease");
    preset.CompThreshold = SSLNativeChannel.paramFromXml(xml, "CompThreshold");
    preset.DynamicsIn =
      SSLNativeChannel.paramFromXml(xml, "DynamicsIn") !== 0.0;
    preset.DynamicsPreEq =
      SSLNativeChannel.paramFromXml(xml, "DynamicsPreEq") !== 0.0;
    preset.EqE = SSLNativeChannel.paramFromXml(xml, "EqE") !== 0.0;
    preset.EqIn = SSLNativeChannel.paramFromXml(xml, "EqIn") !== 0.0;
    preset.EqToSidechain =
      SSLNativeChannel.paramFromXml(xml, "EqToSidechain") !== 0.0;
    preset.FaderLevel = SSLNativeChannel.paramFromXml(xml, "FaderLevel");
    preset.FiltersToInput =
      SSLNativeChannel.paramFromXml(xml, "FiltersToInput") !== 0.0;
    preset.FiltersToSidechain =
      SSLNativeChannel.paramFromXml(xml, "FiltersToSidechain") !== 0.0;
    preset.GateDisabledExpEnabled =
      SSLNativeChannel.paramFromXml(xml, "GateExpander") !== 0.0;
    preset.GateFastAttack =
      SSLNativeChannel.paramFromXml(xml, "GateFastAttack") !== 0.0;
    preset.GateHold = SSLNativeChannel.paramFromXml(xml, "GateHold");
    preset.GateRange = SSLNativeChannel.paramFromXml(xml, "GateRange");
    preset.GateRelease = SSLNativeChannel.paramFromXml(xml, "GateRelease");
    preset.GateThreshold = SSLNativeChannel.paramFromXml(xml, "GateThreshold");
    preset.HighEqBell =
      SSLNativeChannel.paramFromXml(xml, "HighEqBell") !== 0.0;
    preset.HighEqFreq = SSLNativeChannel.paramFromXml(xml, "HighEqFreq");
    preset.HighEqGain = SSLNativeChannel.paramFromXml(xml, "HighEqGain");
    preset.HighMidEqFreq = SSLNativeChannel.paramFromXml(xml, "HighMidEqFreq");
    preset.HighMidEqGain = SSLNativeChannel.paramFromXml(xml, "HighMidEqGain");
    preset.HighMidEqQ = SSLNativeChannel.paramFromXml(xml, "HighMidEqQ");
    preset.HighPassFreq = SSLNativeChannel.paramFromXml(xml, "HighPassFreq");
    preset.InputTrim = SSLNativeChannel.paramFromXml(xml, "InputTrim");
    preset.LowEqBell = SSLNativeChannel.paramFromXml(xml, "LowEqBell") !== 0.0;
    preset.LowEqFreq = SSLNativeChannel.paramFromXml(xml, "LowEqFreq");
    preset.LowEqGain = SSLNativeChannel.paramFromXml(xml, "LowEqGain");
    preset.LowMidEqFreq = SSLNativeChannel.paramFromXml(xml, "LowMidEqFreq");
    preset.LowMidEqGain = SSLNativeChannel.paramFromXml(xml, "LowMidEqGain");
    preset.LowMidEqQ = SSLNativeChannel.paramFromXml(xml, "LowMidEqQ");
    preset.LowPassFreq = SSLNativeChannel.paramFromXml(xml, "LowPassFreq");
    preset.OutputTrim = SSLNativeChannel.paramFromXml(xml, "OutputTrim");
    preset.Pan = SSLNativeChannel.paramFromXml(xml, "Pan");
    preset.PhaseInvert =
      SSLNativeChannel.paramFromXml(xml, "PhaseInvert") !== 0.0;
    preset.SidechainListen =
      SSLNativeChannel.paramFromXml(xml, "SidechainListen") !== 0.0;
    preset.UseExternalKey =
      SSLNativeChannel.paramFromXml(xml, "UseExternalKey") !== 0.0;
    preset.Width = SSLNativeChannel.paramFromXml(xml, "Width");
    preset.HighQuality =
      SSLNativeChannel.paramFromXml(xml, "HighQuality", true) !== 0.0;

    return preset;
  }

  private generatePresetXML(): object {
    const xml = {
      SSL_PRESET: {
        "@_PluginName": this.PlugInName,
        "@_Version": this.PresetVersion,
        "@_PresetType": this.PresetType,
        PROCESSOR_STATE: {
          PARAM: [
            SSLNativeChannel.paramToXmlAttribute("Bypass", this.Bypass),
            SSLNativeChannel.paramToXmlAttribute(
              "CompFastAttack",
              this.CompFastAttack
            ),
            SSLNativeChannel.paramToXmlAttribute("CompMix", this.CompMix),
            SSLNativeChannel.paramToXmlAttribute("CompPeak", this.CompPeak),
            SSLNativeChannel.paramToXmlAttribute("CompRatio", this.CompRatio),
            SSLNativeChannel.paramToXmlAttribute(
              "CompRelease",
              this.CompRelease
            ),
            SSLNativeChannel.paramToXmlAttribute(
              "CompThreshold",
              this.CompThreshold
            ),
            SSLNativeChannel.paramToXmlAttribute("DynamicsIn", this.DynamicsIn),
            SSLNativeChannel.paramToXmlAttribute(
              "DynamicsPreEq",
              this.DynamicsPreEq
            ),
            SSLNativeChannel.paramToXmlAttribute("EqE", this.EqE),
            SSLNativeChannel.paramToXmlAttribute("EqIn", this.EqIn),
            SSLNativeChannel.paramToXmlAttribute(
              "EqToSidechain",
              this.EqToSidechain
            ),
            SSLNativeChannel.paramToXmlAttribute("FaderLevel", this.FaderLevel),
            SSLNativeChannel.paramToXmlAttribute(
              "FiltersToInput",
              this.FiltersToInput
            ),
            SSLNativeChannel.paramToXmlAttribute(
              "FiltersToSidechain",
              this.FiltersToSidechain
            ),
            SSLNativeChannel.paramToXmlAttribute(
              "GateExpander",
              this.GateDisabledExpEnabled
            ),
            SSLNativeChannel.paramToXmlAttribute(
              "GateFastAttack",
              this.GateFastAttack
            ),
            SSLNativeChannel.paramToXmlAttribute("GateHold", this.GateHold),
            SSLNativeChannel.paramToXmlAttribute("GateRange", this.GateRange),
            SSLNativeChannel.paramToXmlAttribute(
              "GateRelease",
              this.GateRelease
            ),
            SSLNativeChannel.paramToXmlAttribute(
              "GateThreshold",
              this.GateThreshold
            ),
            SSLNativeChannel.paramToXmlAttribute("HighEqBell", this.HighEqBell),
            SSLNativeChannel.paramToXmlAttribute("HighEqFreq", this.HighEqFreq),
            SSLNativeChannel.paramToXmlAttribute("HighEqGain", this.HighEqGain),
            SSLNativeChannel.paramToXmlAttribute(
              "HighMidEqFreq",
              this.HighMidEqFreq
            ),
            SSLNativeChannel.paramToXmlAttribute(
              "HighMidEqGain",
              this.HighMidEqGain
            ),
            SSLNativeChannel.paramToXmlAttribute("HighMidEqQ", this.HighMidEqQ),
            SSLNativeChannel.paramToXmlAttribute(
              "HighPassFreq",
              this.HighPassFreq
            ),
            SSLNativeChannel.paramToXmlAttribute("InputTrim", this.InputTrim),
            SSLNativeChannel.paramToXmlAttribute("LowEqBell", this.LowEqBell),
            SSLNativeChannel.paramToXmlAttribute("LowEqFreq", this.LowEqFreq),
            SSLNativeChannel.paramToXmlAttribute("LowEqGain", this.LowEqGain),
            SSLNativeChannel.paramToXmlAttribute(
              "LowMidEqFreq",
              this.LowMidEqFreq
            ),
            SSLNativeChannel.paramToXmlAttribute(
              "LowMidEqGain",
              this.LowMidEqGain
            ),
            SSLNativeChannel.paramToXmlAttribute("LowMidEqQ", this.LowMidEqQ),
            SSLNativeChannel.paramToXmlAttribute(
              "LowPassFreq",
              this.LowPassFreq
            ),
            SSLNativeChannel.paramToXmlAttribute("OutputTrim", this.OutputTrim),
            SSLNativeChannel.paramToXmlAttribute("Pan", this.Pan),
            SSLNativeChannel.paramToXmlAttribute(
              "PhaseInvert",
              this.PhaseInvert
            ),
            SSLNativeChannel.paramToXmlAttribute(
              "SidechainListen",
              this.SidechainListen
            ),
            SSLNativeChannel.paramToXmlAttribute(
              "UseExternalKey",
              this.UseExternalKey
            ),
            SSLNativeChannel.paramToXmlAttribute("Width", this.Width),
          ],
          PARAM_NON_AUTO: [
            SSLNativeChannel.paramToXmlAttribute(
              "HighQuality",
              this.HighQuality
            ),
          ],
        },
      },
    };
    return xml;
  }

  // Reads parameters from the internal Parameters map populated by the base class constructor
  public initFromParameters(): void {
    // Not implemented for SSL Native Channel presets as parameters are read from XML
  }
}
