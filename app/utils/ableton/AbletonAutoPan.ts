import { AbletonPlugin } from "./AbletonPlugin";
import { getParam } from "./XMLUtils";

export enum AutoPanLfoWaveformType {
  Sine = 0,
  Triangle = 1,
  SawtoothDown = 2,
  Random = 3,
}

export enum AutoPanLFORateType {
  Hertz = 0,
  TempoSync = 1,
}

export enum AutoPanLFOStereoMode {
  Phase = 0,
  Spin = 1,
}

export enum AutoPanLFOBeatRate {
  Rate_1_64 = 0,
  Rate_1_48 = 1,
  Rate_1_32 = 2,
  Rate_1_24 = 3,
  Rate_1_16 = 4,
  Rate_1_12 = 5,
  Rate_1_8 = 6,
  Rate_1_6 = 7,
  Rate_3_16 = 8,
  Rate_1_4 = 9,
  Rate_5_16 = 10,
  Rate_1_3 = 11,
  Rate_3_8 = 12,
  Rate_1_2 = 13,
  Rate_3_4 = 14,
  Rate_1 = 15,
  Rate_1p5 = 16,
  Rate_2 = 17,
  Rate_3 = 18,
  Rate_4 = 19,
  Rate_6 = 20,
  Rate_8 = 21,
}

export class AbletonAutoPan extends AbletonPlugin {
  public Type: AutoPanLfoWaveformType;
  public Frequency: number; // Hertz, Not used if TempoSync is TempoSync
  public RateType: AutoPanLFORateType;
  public BeatRate: AutoPanLFOBeatRate;
  public StereoMode: AutoPanLFOStereoMode;
  public Spin: number; // Used if StereoMode is Spin
  public Phase: number; // Used if StereoMode is Phase
  public Offset: number;
  public IsOn: boolean;
  public Quantize: boolean;
  public BeatQuantize: number;
  public NoiseWidth: number; // 0,00 - 1,00 = 0 - 100%
  public LfoAmount: number; // 0,00 - 1,00 = 0 - 100%
  public LfoInvert: boolean;
  public LfoShape: number; // 0,00 - 1,00 = 0 - 100%

  constructor(xElement: any) {
    super();

    this.Type = getParam(
      xElement?.Lfo,
      "Type",
      "int",
      "0"
    ) as AutoPanLfoWaveformType;
    this.Frequency = getParam(xElement?.Lfo, "Frequency", "float", "0");
    this.RateType = getParam(
      xElement?.Lfo,
      "RateType",
      "int",
      "0"
    ) as AutoPanLFORateType;
    this.BeatRate = getParam(
      xElement?.Lfo,
      "BeatRate",
      "int",
      "0"
    ) as AutoPanLFOBeatRate;
    this.StereoMode = getParam(
      xElement?.Lfo,
      "StereoMode",
      "int",
      "0"
    ) as AutoPanLFOStereoMode;
    this.Spin = getParam(xElement?.Lfo, "Spin", "float", "0");
    this.Phase = getParam(xElement?.Lfo, "Phase", "float", "180");
    this.Offset = getParam(xElement?.Lfo, "Offset", "float", "0");
    this.IsOn = getParam(xElement?.Lfo, "IsOn", "bool", "false");
    this.Quantize = getParam(xElement?.Lfo, "Quantize", "bool", "false");
    this.BeatQuantize = getParam(xElement?.Lfo, "BeatQuantize", "float", "2.0");
    this.NoiseWidth = getParam(xElement?.Lfo, "NoiseWidth", "float", "0.5");
    this.LfoAmount = getParam(xElement?.Lfo, "LfoAmount", "float", "0.0");
    this.LfoInvert = getParam(xElement?.Lfo, "LfoInvert", "bool", "false");
    this.LfoShape = getParam(xElement?.Lfo, "LfoShape", "float", "0.0");
  }

  public hasBeenModified(): boolean {
    const ceilingTolerance = 0.0001; // Adjust the tolerance as needed
    return (
      this.Type !== AutoPanLfoWaveformType.Sine ||
      Math.abs(this.Frequency - 1.0) > ceilingTolerance ||
      this.RateType !== AutoPanLFORateType.Hertz ||
      this.BeatRate !== AutoPanLFOBeatRate.Rate_1_16 ||
      this.StereoMode !== AutoPanLFOStereoMode.Phase ||
      this.Spin !== 0.0 ||
      this.Phase !== 180 ||
      this.Offset !== 0 ||
      !this.IsOn ||
      this.Quantize ||
      this.BeatQuantize !== 2.0 ||
      this.NoiseWidth !== 0.5 ||
      this.LfoAmount !== 0.0 ||
      this.LfoInvert ||
      this.LfoShape !== 0.0
    );
  }

  public toString(): string {
    return `Type: ${AutoPanLfoWaveformType[this.Type]}
Frequency: ${this.Frequency.toFixed(2)} Hz
RateType: ${AutoPanLFORateType[this.RateType]}
BeatRate: ${AutoPanLFOBeatRate[this.BeatRate]}
StereoMode: ${AutoPanLFOStereoMode[this.StereoMode]}
Spin: ${this.Spin.toFixed(2)} %
Phase: ${this.Phase.toFixed(2)} °
Offset: ${this.Offset.toFixed(2)} °
IsOn: ${this.IsOn}
Quantize: ${this.Quantize}
BeatQuantize: ${this.BeatQuantize.toFixed(2)}
NoiseWidth: ${this.NoiseWidth.toFixed(2)} %
LfoAmount: ${this.LfoAmount.toFixed(2)} %
LfoInvert: ${this.LfoInvert}
LfoShape: ${this.LfoShape.toFixed(2)} %`;
  }
}
