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
      `\tLP Frequency (12 dB/octave): ${this.LowPassFreq.toFixed(2)} KHz (22 - 35 KHz)`
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

  private static fromXml(xml: any): SSLNativeChannel {
    const preset = new SSLNativeChannel();
    const processorState = xml?.SSL_PRESET?.PROCESSOR_STATE;
    const rootPreset = xml?.SSL_PRESET; // For HighQuality (PARAM_NON_AUTO)

    if (!processorState) {
      console.warn("PROCESSOR_STATE not found in XML.");
      return preset;
    }

    preset.PlugInName = rootPreset?.["@_PluginName"] ?? "";
    preset.PresetVersion = rootPreset?.["@_Version"] ?? "";
    preset.PresetType = rootPreset?.["@_PresetType"] ?? "";

    // all values are stored as double
    preset.Bypass =
      SSLNativeChannel.findParamValue(processorState, "PARAM", "Bypass") !==
      0.0;
    preset.CompFastAttack =
      SSLNativeChannel.findParamValue(
        processorState,
        "PARAM",
        "CompFastAttack"
      ) !== 0.0;
    preset.CompMix = SSLNativeChannel.findParamValue(
      processorState,
      "PARAM",
      "CompMix"
    );
    preset.CompPeak = SSLNativeChannel.findParamValue(
      processorState,
      "PARAM",
      "CompPeak"
    );
    preset.CompRatio = SSLNativeChannel.findParamValue(
      processorState,
      "PARAM",
      "CompRatio"
    );
    preset.CompRelease = SSLNativeChannel.findParamValue(
      processorState,
      "PARAM",
      "CompRelease"
    );
    preset.CompThreshold = SSLNativeChannel.findParamValue(
      processorState,
      "PARAM",
      "CompThreshold"
    );
    preset.DynamicsIn =
      SSLNativeChannel.findParamValue(processorState, "PARAM", "DynamicsIn") !==
      0.0;
    preset.DynamicsPreEq =
      SSLNativeChannel.findParamValue(
        processorState,
        "PARAM",
        "DynamicsPreEq"
      ) !== 0.0;
    preset.EqE =
      SSLNativeChannel.findParamValue(processorState, "PARAM", "EqE") !== 0.0;
    preset.EqIn =
      SSLNativeChannel.findParamValue(processorState, "PARAM", "EqIn") !== 0.0;
    preset.EqToSidechain =
      SSLNativeChannel.findParamValue(
        processorState,
        "PARAM",
        "EqToSidechain"
      ) !== 0.0;
    preset.FaderLevel = SSLNativeChannel.findParamValue(
      processorState,
      "PARAM",
      "FaderLevel"
    );
    preset.FiltersToInput =
      SSLNativeChannel.findParamValue(
        processorState,
        "PARAM",
        "FiltersToInput"
      ) !== 0.0;
    preset.FiltersToSidechain =
      SSLNativeChannel.findParamValue(
        processorState,
        "PARAM",
        "FiltersToSidechain"
      ) !== 0.0;
    preset.GateDisabledExpEnabled =
      SSLNativeChannel.findParamValue(
        processorState,
        "PARAM",
        "GateExpander"
      ) !== 0.0;
    preset.GateFastAttack =
      SSLNativeChannel.findParamValue(
        processorState,
        "PARAM",
        "GateFastAttack"
      ) !== 0.0;
    preset.GateHold = SSLNativeChannel.findParamValue(
      processorState,
      "PARAM",
      "GateHold"
    );
    preset.GateRange = SSLNativeChannel.findParamValue(
      processorState,
      "PARAM",
      "GateRange"
    );
    preset.GateRelease = SSLNativeChannel.findParamValue(
      processorState,
      "PARAM",
      "GateRelease"
    );
    preset.GateThreshold = SSLNativeChannel.findParamValue(
      processorState,
      "PARAM",
      "GateThreshold"
    );
    preset.HighEqBell =
      SSLNativeChannel.findParamValue(processorState, "PARAM", "HighEqBell") !==
      0.0;
    preset.HighEqFreq = SSLNativeChannel.findParamValue(
      processorState,
      "PARAM",
      "HighEqFreq"
    );
    preset.HighEqGain = SSLNativeChannel.findParamValue(
      processorState,
      "PARAM",
      "HighEqGain"
    );
    preset.HighMidEqFreq = SSLNativeChannel.findParamValue(
      processorState,
      "PARAM",
      "HighMidEqFreq"
    );
    preset.HighMidEqGain = SSLNativeChannel.findParamValue(
      processorState,
      "PARAM",
      "HighMidEqGain"
    );
    preset.HighMidEqQ = SSLNativeChannel.findParamValue(
      processorState,
      "PARAM",
      "HighMidEqQ"
    );
    preset.HighPassFreq = SSLNativeChannel.findParamValue(
      processorState,
      "PARAM",
      "HighPassFreq"
    );
    preset.InputTrim = SSLNativeChannel.findParamValue(
      processorState,
      "PARAM",
      "InputTrim"
    );
    preset.LowEqBell =
      SSLNativeChannel.findParamValue(processorState, "PARAM", "LowEqBell") !==
      0.0;
    preset.LowEqFreq = SSLNativeChannel.findParamValue(
      processorState,
      "PARAM",
      "LowEqFreq"
    );
    preset.LowEqGain = SSLNativeChannel.findParamValue(
      processorState,
      "PARAM",
      "LowEqGain"
    );
    preset.LowMidEqFreq = SSLNativeChannel.findParamValue(
      processorState,
      "PARAM",
      "LowMidEqFreq"
    );
    preset.LowMidEqGain = SSLNativeChannel.findParamValue(
      processorState,
      "PARAM",
      "LowMidEqGain"
    );
    preset.LowMidEqQ = SSLNativeChannel.findParamValue(
      processorState,
      "PARAM",
      "LowMidEqQ"
    );
    preset.LowPassFreq = SSLNativeChannel.findParamValue(
      processorState,
      "PARAM",
      "LowPassFreq"
    );
    preset.OutputTrim = SSLNativeChannel.findParamValue(
      processorState,
      "PARAM",
      "OutputTrim"
    );
    preset.Pan = SSLNativeChannel.findParamValue(
      processorState,
      "PARAM",
      "Pan"
    );
    preset.PhaseInvert =
      SSLNativeChannel.findParamValue(
        processorState,
        "PARAM",
        "PhaseInvert"
      ) !== 0.0;
    preset.SidechainListen =
      SSLNativeChannel.findParamValue(
        processorState,
        "PARAM",
        "SidechainListen"
      ) !== 0.0;
    preset.UseExternalKey =
      SSLNativeChannel.findParamValue(
        processorState,
        "PARAM",
        "UseExternalKey"
      ) !== 0.0;
    preset.Width = SSLNativeChannel.findParamValue(
      processorState,
      "PARAM",
      "Width"
    );
    preset.HighQuality =
      SSLNativeChannel.findParamValue(
        rootPreset,
        "PARAM_NON_AUTO",
        "HighQuality"
      ) !== 0.0;

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
