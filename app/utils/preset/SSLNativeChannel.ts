import { XMLParser } from "fast-xml-parser";

import { SSLNativePresetBase } from "./SSLNativePresetBase";
import { VstClassIDs } from "./VstClassIDs";

export class SSLNativeChannel extends SSLNativePresetBase {
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
      parseAttributeValue: false, // do not convert strings to number automatically
      parseTagValue: false, // do not convert strings to number automatically
    });
    const xml = parser.parse(fileContent);
    return SSLNativeChannel.fromXml(xml);
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

  public static fromXml(xml: any): SSLNativeChannel {
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
      SSLNativePresetBase.findParamValue(processorState, "PARAM", "Bypass") !==
      0.0;
    preset.CompFastAttack =
      SSLNativePresetBase.findParamValue(
        processorState,
        "PARAM",
        "CompFastAttack"
      ) !== 0.0;
    preset.CompMix = SSLNativePresetBase.findParamValue(
      processorState,
      "PARAM",
      "CompMix"
    );
    preset.CompPeak = SSLNativePresetBase.findParamValue(
      processorState,
      "PARAM",
      "CompPeak"
    );
    preset.CompRatio = SSLNativePresetBase.findParamValue(
      processorState,
      "PARAM",
      "CompRatio"
    );
    preset.CompRelease = SSLNativePresetBase.findParamValue(
      processorState,
      "PARAM",
      "CompRelease"
    );
    preset.CompThreshold = SSLNativePresetBase.findParamValue(
      processorState,
      "PARAM",
      "CompThreshold"
    );
    preset.DynamicsIn =
      SSLNativePresetBase.findParamValue(
        processorState,
        "PARAM",
        "DynamicsIn"
      ) !== 0.0;
    preset.DynamicsPreEq =
      SSLNativePresetBase.findParamValue(
        processorState,
        "PARAM",
        "DynamicsPreEq"
      ) !== 0.0;
    preset.EqE =
      SSLNativePresetBase.findParamValue(processorState, "PARAM", "EqE") !==
      0.0;
    preset.EqIn =
      SSLNativePresetBase.findParamValue(processorState, "PARAM", "EqIn") !==
      0.0;
    preset.EqToSidechain =
      SSLNativePresetBase.findParamValue(
        processorState,
        "PARAM",
        "EqToSidechain"
      ) !== 0.0;
    preset.FaderLevel = SSLNativePresetBase.findParamValue(
      processorState,
      "PARAM",
      "FaderLevel"
    );
    preset.FiltersToInput =
      SSLNativePresetBase.findParamValue(
        processorState,
        "PARAM",
        "FiltersToInput"
      ) !== 0.0;
    preset.FiltersToSidechain =
      SSLNativePresetBase.findParamValue(
        processorState,
        "PARAM",
        "FiltersToSidechain"
      ) !== 0.0;
    preset.GateDisabledExpEnabled =
      SSLNativePresetBase.findParamValue(
        processorState,
        "PARAM",
        "GateExpander"
      ) !== 0.0;
    preset.GateFastAttack =
      SSLNativePresetBase.findParamValue(
        processorState,
        "PARAM",
        "GateFastAttack"
      ) !== 0.0;
    preset.GateHold = SSLNativePresetBase.findParamValue(
      processorState,
      "PARAM",
      "GateHold"
    );
    preset.GateRange = SSLNativePresetBase.findParamValue(
      processorState,
      "PARAM",
      "GateRange"
    );
    preset.GateRelease = SSLNativePresetBase.findParamValue(
      processorState,
      "PARAM",
      "GateRelease"
    );
    preset.GateThreshold = SSLNativePresetBase.findParamValue(
      processorState,
      "PARAM",
      "GateThreshold"
    );
    preset.HighEqBell =
      SSLNativePresetBase.findParamValue(
        processorState,
        "PARAM",
        "HighEqBell"
      ) !== 0.0;
    preset.HighEqFreq = SSLNativePresetBase.findParamValue(
      processorState,
      "PARAM",
      "HighEqFreq"
    );
    preset.HighEqGain = SSLNativePresetBase.findParamValue(
      processorState,
      "PARAM",
      "HighEqGain"
    );
    preset.HighMidEqFreq = SSLNativePresetBase.findParamValue(
      processorState,
      "PARAM",
      "HighMidEqFreq"
    );
    preset.HighMidEqGain = SSLNativePresetBase.findParamValue(
      processorState,
      "PARAM",
      "HighMidEqGain"
    );
    preset.HighMidEqQ = SSLNativePresetBase.findParamValue(
      processorState,
      "PARAM",
      "HighMidEqQ"
    );
    preset.HighPassFreq = SSLNativePresetBase.findParamValue(
      processorState,
      "PARAM",
      "HighPassFreq"
    );
    preset.InputTrim = SSLNativePresetBase.findParamValue(
      processorState,
      "PARAM",
      "InputTrim"
    );
    preset.LowEqBell =
      SSLNativePresetBase.findParamValue(
        processorState,
        "PARAM",
        "LowEqBell"
      ) !== 0.0;
    preset.LowEqFreq = SSLNativePresetBase.findParamValue(
      processorState,
      "PARAM",
      "LowEqFreq"
    );
    preset.LowEqGain = SSLNativePresetBase.findParamValue(
      processorState,
      "PARAM",
      "LowEqGain"
    );
    preset.LowMidEqFreq = SSLNativePresetBase.findParamValue(
      processorState,
      "PARAM",
      "LowMidEqFreq"
    );
    preset.LowMidEqGain = SSLNativePresetBase.findParamValue(
      processorState,
      "PARAM",
      "LowMidEqGain"
    );
    preset.LowMidEqQ = SSLNativePresetBase.findParamValue(
      processorState,
      "PARAM",
      "LowMidEqQ"
    );
    preset.LowPassFreq = SSLNativePresetBase.findParamValue(
      processorState,
      "PARAM",
      "LowPassFreq"
    );
    preset.OutputTrim = SSLNativePresetBase.findParamValue(
      processorState,
      "PARAM",
      "OutputTrim"
    );
    preset.Pan = SSLNativePresetBase.findParamValue(
      processorState,
      "PARAM",
      "Pan"
    );
    preset.PhaseInvert =
      SSLNativePresetBase.findParamValue(
        processorState,
        "PARAM",
        "PhaseInvert"
      ) !== 0.0;
    preset.SidechainListen =
      SSLNativePresetBase.findParamValue(
        processorState,
        "PARAM",
        "SidechainListen"
      ) !== 0.0;
    preset.UseExternalKey =
      SSLNativePresetBase.findParamValue(
        processorState,
        "PARAM",
        "UseExternalKey"
      ) !== 0.0;
    preset.Width = SSLNativePresetBase.findParamValue(
      processorState,
      "PARAM",
      "Width"
    );
    preset.HighQuality =
      SSLNativePresetBase.findParamValue(
        rootPreset,
        "PARAM_NON_AUTO",
        "HighQuality"
      ) !== 0.0;

    return preset;
  }

  protected generatePresetXML(): object {
    const xml = {
      SSL_PRESET: {
        "@_PluginName": this.PlugInName,
        "@_Version": this.PresetVersion,
        "@_PresetType": this.PresetType,
        PROCESSOR_STATE: {
          PARAM: [
            SSLNativePresetBase.paramToXmlAttribute("Bypass", this.Bypass),
            SSLNativePresetBase.paramToXmlAttribute(
              "CompFastAttack",
              this.CompFastAttack
            ),
            SSLNativePresetBase.paramToXmlAttribute("CompMix", this.CompMix),
            SSLNativePresetBase.paramToXmlAttribute("CompPeak", this.CompPeak),
            SSLNativePresetBase.paramToXmlAttribute(
              "CompRatio",
              this.CompRatio
            ),
            SSLNativePresetBase.paramToXmlAttribute(
              "CompRelease",
              this.CompRelease
            ),
            SSLNativePresetBase.paramToXmlAttribute(
              "CompThreshold",
              this.CompThreshold
            ),
            SSLNativePresetBase.paramToXmlAttribute(
              "DynamicsIn",
              this.DynamicsIn
            ),
            SSLNativePresetBase.paramToXmlAttribute(
              "DynamicsPreEq",
              this.DynamicsPreEq
            ),
            SSLNativePresetBase.paramToXmlAttribute("EqE", this.EqE),
            SSLNativePresetBase.paramToXmlAttribute("EqIn", this.EqIn),
            SSLNativePresetBase.paramToXmlAttribute(
              "EqToSidechain",
              this.EqToSidechain
            ),
            SSLNativePresetBase.paramToXmlAttribute(
              "FaderLevel",
              this.FaderLevel
            ),
            SSLNativePresetBase.paramToXmlAttribute(
              "FiltersToInput",
              this.FiltersToInput
            ),
            SSLNativePresetBase.paramToXmlAttribute(
              "FiltersToSidechain",
              this.FiltersToSidechain
            ),
            SSLNativePresetBase.paramToXmlAttribute(
              "GateExpander",
              this.GateDisabledExpEnabled
            ),
            SSLNativePresetBase.paramToXmlAttribute(
              "GateFastAttack",
              this.GateFastAttack
            ),
            SSLNativePresetBase.paramToXmlAttribute("GateHold", this.GateHold),
            SSLNativePresetBase.paramToXmlAttribute(
              "GateRange",
              this.GateRange
            ),
            SSLNativePresetBase.paramToXmlAttribute(
              "GateRelease",
              this.GateRelease
            ),
            SSLNativePresetBase.paramToXmlAttribute(
              "GateThreshold",
              this.GateThreshold
            ),
            SSLNativePresetBase.paramToXmlAttribute(
              "HighEqBell",
              this.HighEqBell
            ),
            SSLNativePresetBase.paramToXmlAttribute(
              "HighEqFreq",
              this.HighEqFreq
            ),
            SSLNativePresetBase.paramToXmlAttribute(
              "HighEqGain",
              this.HighEqGain
            ),
            SSLNativePresetBase.paramToXmlAttribute(
              "HighMidEqFreq",
              this.HighMidEqFreq
            ),
            SSLNativePresetBase.paramToXmlAttribute(
              "HighMidEqGain",
              this.HighMidEqGain
            ),
            SSLNativePresetBase.paramToXmlAttribute(
              "HighMidEqQ",
              this.HighMidEqQ
            ),
            SSLNativePresetBase.paramToXmlAttribute(
              "HighPassFreq",
              this.HighPassFreq
            ),
            SSLNativePresetBase.paramToXmlAttribute(
              "InputTrim",
              this.InputTrim
            ),
            SSLNativePresetBase.paramToXmlAttribute(
              "LowEqBell",
              this.LowEqBell
            ),
            SSLNativePresetBase.paramToXmlAttribute(
              "LowEqFreq",
              this.LowEqFreq
            ),
            SSLNativePresetBase.paramToXmlAttribute(
              "LowEqGain",
              this.LowEqGain
            ),
            SSLNativePresetBase.paramToXmlAttribute(
              "LowMidEqFreq",
              this.LowMidEqFreq
            ),
            SSLNativePresetBase.paramToXmlAttribute(
              "LowMidEqGain",
              this.LowMidEqGain
            ),
            SSLNativePresetBase.paramToXmlAttribute(
              "LowMidEqQ",
              this.LowMidEqQ
            ),
            SSLNativePresetBase.paramToXmlAttribute(
              "LowPassFreq",
              this.LowPassFreq
            ),
            SSLNativePresetBase.paramToXmlAttribute(
              "OutputTrim",
              this.OutputTrim
            ),
            SSLNativePresetBase.paramToXmlAttribute("Pan", this.Pan),
            SSLNativePresetBase.paramToXmlAttribute(
              "PhaseInvert",
              this.PhaseInvert
            ),
            SSLNativePresetBase.paramToXmlAttribute(
              "SidechainListen",
              this.SidechainListen
            ),
            SSLNativePresetBase.paramToXmlAttribute(
              "UseExternalKey",
              this.UseExternalKey
            ),
            SSLNativePresetBase.paramToXmlAttribute("Width", this.Width),
          ],
          PARAM_NON_AUTO: [
            SSLNativePresetBase.paramToXmlAttribute(
              "HighQuality",
              this.HighQuality
            ),
          ],
        },
      },
    };
    return xml;
  }

  public initFromParameters(): void {
    // Not implemented for SSL Native Channel presets as parameters are read from XML
  }
}
