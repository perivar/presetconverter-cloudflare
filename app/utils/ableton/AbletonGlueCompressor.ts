import { AbletonPlugin } from "./AbletonPlugin";
import { getParam } from "./XMLUtils";

export enum GlueCompressorAttackType { // The Attack knob’s values are in milliseconds.
  Attack_0_01,
  Attack_0_1,
  Attack_0_3,
  Attack_1,
  Attack_3,
  Attack_10,
  Attack_30,
}

export enum GlueCompressorReleaseType { // The Release knob’s values are in seconds. When Release is set to A (Auto), the release time will adjust automatically based on the incoming audio.
  Release_0_1,
  Release_0_2,
  Release_0_4,
  Release_0_6,
  Release_0_8,
  Release_1_2,
  Release_Auto,
}

export enum GlueCompressorRatioType {
  Ratio_2_1,
  Ratio_4_1,
  Ratio_10_1,
}

export class AbletonGlueCompressor extends AbletonPlugin {
  public Threshold: number;
  public Range: number;
  public Makeup: number;
  public Attack: GlueCompressorAttackType;
  public Ratio: GlueCompressorRatioType;
  public Release: GlueCompressorReleaseType;
  public DryWet: number;
  public PeakClipIn: boolean;

  constructor(xElement: any) {
    super();

    this.Threshold = getParam(xElement, "Threshold", "float", "0");
    this.Range = getParam(xElement, "Range", "float", "0");
    this.Makeup = getParam(xElement, "Makeup", "float", "0");
    this.Attack = getParam(
      xElement,
      "Attack",
      "int",
      "0"
    ) as GlueCompressorAttackType;
    this.Ratio = getParam(
      xElement,
      "Ratio",
      "int",
      "0"
    ) as GlueCompressorRatioType;
    this.Release = getParam(
      xElement,
      "Release",
      "int",
      "0"
    ) as GlueCompressorReleaseType;
    this.DryWet = getParam(xElement, "DryWet", "float", "0");
    this.PeakClipIn = getParam(xElement, "PeakClipIn", "bool", "false");
  }

  hasBeenModified(): boolean {
    return true;
  }

  public toString(): string {
    return `Threshold: ${this.Threshold.toFixed(2)}
Range: ${this.Range.toFixed(2)}
Makeup: ${this.Makeup.toFixed(2)}
Attack: ${GlueCompressorAttackType[this.Attack]}
Ratio: ${GlueCompressorRatioType[this.Ratio]}
Release: ${GlueCompressorReleaseType[this.Release]}
DryWet: ${this.DryWet.toFixed(2)}
PeakClipIn: ${this.PeakClipIn}`;
  }
}
