import { AbletonPlugin } from "./AbletonPlugin";
import { Log } from "./Log"; // Assuming Log is needed
import { getParam } from "./XMLUtils";

export class AbletonCompressor extends AbletonPlugin {
  public static readonly MaxFloatMinusEpsilon: number = 340282326356119260000000000000000000000; // Use number for float

  public Threshold: number;
  public Ratio: number; // Use number for float
  public ExpansionRatio: number;
  public Attack: number;
  public Release: number;
  public AutoReleaseControlOnOff: boolean;
  public Gain: number;
  public GainCompensation: boolean;
  public DryWet: number;
  public Model: number;
  public LegacyModel: number;
  public Knee: number;
  public LookAhead: number;

  constructor(xElement: any) {
    super();

    this.Threshold = getParam(xElement, "Threshold", "float", "0");
    this.Ratio = getParam(xElement, "Ratio", "float", "0");
    if (this.Ratio === AbletonCompressor.MaxFloatMinusEpsilon) {
      Log.Debug(
        `AbletonCompressor ratio is set to max: ${AbletonCompressor.MaxFloatMinusEpsilon}`
      );
    }
    this.ExpansionRatio = getParam(xElement, "ExpansionRatio", "float", "0");
    this.Attack = getParam(xElement, "Attack", "float", "0");
    this.Release = getParam(xElement, "Release", "float", "0");
    this.AutoReleaseControlOnOff = getParam(
      xElement,
      "AutoReleaseControlOnOff",
      "bool",
      "false"
    );
    this.Gain = getParam(xElement, "Gain", "float", "0");
    this.GainCompensation = getParam(
      xElement,
      "GainCompensation",
      "bool",
      "false"
    );
    this.DryWet = getParam(xElement, "DryWet", "float", "0");
    this.Model = getParam(xElement, "Model", "float", "0");
    this.LegacyModel = getParam(xElement, "LegacyModel", "float", "0");
    this.Knee = getParam(xElement, "Knee", "float", "0");
    this.LookAhead = getParam(xElement, "LookAhead", "float", "0");
  }

  hasBeenModified(): boolean {
    return true;
  }

  public toString(): string {
    return `Threshold: ${this.Threshold.toFixed(2)}
Ratio: ${this.Ratio.toFixed(2)}
ExpansionRatio: ${this.ExpansionRatio.toFixed(2)}
Attack: ${this.Attack.toFixed(2)}
Release: ${this.Release.toFixed(2)}
AutoRelease: ${this.AutoReleaseControlOnOff}
Gain: ${this.Gain.toFixed(2)}
GainCompensation: ${this.GainCompensation}
DryWet: ${this.DryWet.toFixed(2)}
Model: ${this.Model.toFixed(2)}
LegacyModel: ${this.LegacyModel.toFixed(2)}
Knee: ${this.Knee.toFixed(2)}
LookAhead: ${this.LookAhead.toFixed(2)}`;
  }
}
