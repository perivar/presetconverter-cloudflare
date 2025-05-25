import { AbletonPlugin } from "./AbletonPlugin";
import { getParam } from "./XMLUtils";

export enum LfoWaveformType {
  Sine = 0,
  Triangle = 1,
  SawtoothDown = 2,
  Random = 3,
}

export enum LFORateType {
  Hertz = 0,
  TempoSync = 1,
}

export enum LFOStereoMode {
  Phase = 0,
  Spin = 1,
}

export enum LFOBeatRate {
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

export class AbletonAutoPan implements AbletonPlugin {
  public Type: LfoWaveformType;
  public Frequency: number; // Hertz, Not used if TempoSync is TempoSync
  public RateType: LFORateType;
  public BeatRate: LFOBeatRate;
  public StereoMode: LFOStereoMode;
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
    this.Type = getParam(xElement?.Lfo, "Type", "int", "0");
    this.Frequency = getParam(xElement?.Lfo, "Frequency", "float", "0");
    this.RateType = getParam(xElement?.Lfo, "RateType", "int", "0");
    this.BeatRate = getParam(xElement?.Lfo, "BeatRate", "int", "0");
    this.StereoMode = getParam(xElement?.Lfo, "StereoMode", "int", "0");
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
      this.Type !== LfoWaveformType.Sine ||
      Math.abs(this.Frequency - 1.0) > ceilingTolerance ||
      this.RateType !== LFORateType.Hertz ||
      this.BeatRate !== LFOBeatRate.Rate_1_16 ||
      this.StereoMode !== LFOStereoMode.Phase ||
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
    return `Type: ${this.Type}\nFrequency: ${this.Frequency.toFixed(2)} Hz \nRateType: ${this.RateType}\nBeatRate: ${this.BeatRate}\nStereoMode: ${this.StereoMode}\nSpin: ${this.Spin.toFixed(2)} %\nPhase: ${this.Phase.toFixed(2)} °\nOffset: ${this.Offset.toFixed(2)} °\nIsOn: ${this.IsOn}\nQuantize: ${this.Quantize}\nBeatQuantize: ${this.BeatQuantize.toFixed(2)}\nNoiseWidth: ${this.NoiseWidth.toFixed(2)} %\nLfoAmount: ${this.LfoAmount.toFixed(2)} %\nLfoInvert: ${this.LfoInvert}\nLfoShape: ${this.LfoShape.toFixed(2)} %`;
  }
}
