// SteinbergFrequency.ts

import { SteinbergVstPreset } from "./SteinbergVstPreset";
import { VstClassIDs } from "./VstClassIDs";

export enum BandMode1And8 {
  Cut6 = 0.0,
  Cut12 = 1.0,
  Cut24 = 2.0,
  Cut48 = 3.0,
  Cut96 = 4.0,
  LowShelf = 5.0,
  Peak = 6.0,
  HighShelf = 7.0,
  Notch = 8.0,
}

export enum BandMode2To7 {
  LowShelf = 0.0,
  Peak = 1.0,
  HighShelf = 2.0,
  Notch = 3.0,
}

export enum ChannelMode {
  LeftRightModeLeft = 0.0,
  LeftRightModeRight = 1.0,
  StereoMode = 2.0,
  MidSideModeMid = 3.0,
  MidSideModeSide = 4.0,
}

export interface FrequencyBandParameters {
  enabled: number;
  gain: number;
  freq: number;
  q: number;
  type: number; // BandMode1And8 or BandMode2To7
  invert: number;
}

export interface FrequencyBandParametersCh2 extends FrequencyBandParameters {}

export interface FrequencySharedParameters {
  editChannel: number; // ChannelMode
  bandOn: number;
  linearPhase: number;
}

export interface FrequencyPostParameters {
  bypass: number;
  output: number;
  masterBypass: number;
  reset: number;
  autoListen: number;
  spectrumOnOff: number;
  spectrum2ChMode: number;
  spectrumIntegrate: number;
  spectrumPHOnOff: number;
  spectrumSlope: number;
  drawEQ: number;
  drawEQFilled: number;
  spectrumBarGraph: number;
  showPianoRoll: number;
  transparency: number;
  autoGainOutputValue: number;
}

export class SteinbergFrequency extends SteinbergVstPreset {
  // Properties to store read values
  public bands: Array<{
    ch1: FrequencyBandParameters;
    ch2: FrequencyBandParametersCh2;
    shared: FrequencySharedParameters;
  }> = [];
  public postParams: FrequencyPostParameters | null = null;

  constructor() {
    super();
    this.Vst3ClassID = VstClassIDs.SteinbergFrequency;
    this.PlugInCategory = "Fx|EQ";
    this.PlugInName = "Frequency";
    this.PlugInVendor = "Steinberg Media Technologies";

    this.setStartBytes(19728);

    this.initParameters();
  }

  private initParameters(): void {
    for (let i = 1; i <= 8; i++) {
      this.initFrequencyBandParameters(i);
    }
    this.initFrequencyPostParameters();
  }

  private initFrequencyBandParameters(bandNum: number): void {
    // increment
    const inc = bandNum - 1;

    // Channel 1 parameters
    this.setNumberParameterWithIndex(`equalizerAon${bandNum}`, 100 + inc, 1.0);
    this.setNumberParameterWithIndex(
      `equalizerAgain${bandNum}`,
      108 + inc,
      0.0
    );
    this.setNumberParameterWithIndex(
      `equalizerAfreq${bandNum}`,
      116 + inc,
      100.0 * bandNum
    );
    this.setNumberParameterWithIndex(`equalizerAq${bandNum}`, 124 + inc, 1.0);
    this.setNumberParameterWithIndex(
      `equalizerAtype${bandNum}`,
      132 + inc,
      bandNum === 1 || bandNum === 8 ? BandMode1And8.Cut48 : BandMode2To7.Peak
    );
    this.setNumberParameterWithIndex(`invert${bandNum}`, 1022 + inc, 0.0);

    // Channel 2 parameters
    this.setNumberParameterWithIndex(
      `equalizerAon${bandNum}Ch2`,
      260 + inc,
      1.0
    );
    this.setNumberParameterWithIndex(
      `equalizerAgain${bandNum}Ch2`,
      268 + inc,
      0.0
    );
    this.setNumberParameterWithIndex(
      `equalizerAfreq${bandNum}Ch2`,
      276 + inc,
      25.0
    );
    this.setNumberParameterWithIndex(
      `equalizerAq${bandNum}Ch2`,
      284 + inc,
      1.0
    );
    this.setNumberParameterWithIndex(
      `equalizerAtype${bandNum}Ch2`,
      292 + inc,
      bandNum === 1 || bandNum === 8 ? BandMode1And8.Cut48 : BandMode2To7.Peak
    );

    this.setNumberParameterWithIndex(`invert${bandNum}Ch2`, 1030 + inc, 0.0);

    // Shared parameters
    this.setNumberParameterWithIndex(
      `equalizerAeditchannel${bandNum}`,
      50 + inc,
      ChannelMode.StereoMode
    );
    this.setNumberParameterWithIndex(
      `equalizerAbandon${bandNum}`,
      58 + inc,
      1.0
    );
    this.setNumberParameterWithIndex(`linearphase${bandNum}`, 66 + inc, 0.0);
  }

  private initFrequencyPostParameters(): void {
    this.setNumberParameterWithIndex("equalizerAbypass", 1, 0.0);
    this.setNumberParameterWithIndex("equalizerAoutput", 2, 0.0);
    this.setNumberParameterWithIndex("bypass", 1002, 0.0);
    this.setNumberParameterWithIndex("reset", 1003, 0.0);
    this.setNumberParameterWithIndex("autoListen", 1005, 0.0);
    this.setNumberParameterWithIndex("spectrumonoff", 1007, 1.0);
    this.setNumberParameterWithIndex("spectrum2ChMode", 1008, 0.0);
    this.setNumberParameterWithIndex("spectrumintegrate", 1010, 40.0);
    this.setNumberParameterWithIndex("spectrumPHonoff", 1011, 1.0);
    this.setNumberParameterWithIndex("spectrumslope", 1012, 0.0);
    this.setNumberParameterWithIndex("draweq", 1013, 1.0);
    this.setNumberParameterWithIndex("draweqfilled", 1014, 1.0);
    this.setNumberParameterWithIndex("spectrumbargraph", 1015, 0.0);
    this.setNumberParameterWithIndex("showPianoRoll", 1019, 1.0);
    this.setNumberParameterWithIndex("transparency", 1020, 0.3);
    this.setNumberParameterWithIndex("autoGainOutputValue", 1021, 0.0);
  }

  // --- Read Methods ---

  // Reads parameters from the internal Parameters map populated by the base class constructor
  public readParameters(): void {
    // No super call needed here, base constructor handles initial parsing.
    // This method extracts specific Steinberg Frequency params from the map.

    this.bands = [];
    for (let i = 1; i <= 8; i++) {
      this.bands.push(this.readFrequencyBandParameters(i));
    }
    this.postParams = this.readFrequencyPostParameters();
  }

  private readFrequencyBandParameters(bandNum: number): {
    ch1: FrequencyBandParameters;
    ch2: FrequencyBandParametersCh2;
    shared: FrequencySharedParameters;
  } {
    const ch1: FrequencyBandParameters = {
      enabled: this.getNumberParameter(`equalizerAon${bandNum}`) || 0,
      gain: this.getNumberParameter(`equalizerAgain${bandNum}`) || 0,
      freq: this.getNumberParameter(`equalizerAfreq${bandNum}`) || 0,
      q: this.getNumberParameter(`equalizerAq${bandNum}`) || 0,
      type: this.getNumberParameter(`equalizerAtype${bandNum}`) || 0,
      invert: this.getNumberParameter(`invert${bandNum}`) || 0,
    };

    const ch2: FrequencyBandParametersCh2 = {
      enabled: this.getNumberParameter(`equalizerAon${bandNum}Ch2`) || 0,
      gain: this.getNumberParameter(`equalizerAgain${bandNum}Ch2`) || 0,
      freq: this.getNumberParameter(`equalizerAfreq${bandNum}Ch2`) || 0,
      q: this.getNumberParameter(`equalizerAq${bandNum}Ch2`) || 0,
      type: this.getNumberParameter(`equalizerAtype${bandNum}Ch2`) || 0,
      invert: this.getNumberParameter(`invert${bandNum}Ch2`) || 0,
    };

    const shared: FrequencySharedParameters = {
      editChannel:
        this.getNumberParameter(`equalizerAeditchannel${bandNum}`) || 0,
      bandOn: this.getNumberParameter(`equalizerAbandon${bandNum}`) || 0,
      linearPhase: this.getNumberParameter(`linearphase${bandNum}`) || 0,
    };

    return { ch1, ch2, shared };
  }

  private readFrequencyPostParameters(): FrequencyPostParameters {
    return {
      bypass: this.getNumberParameter("equalizerAbypass") || 0,
      output: this.getNumberParameter("equalizerAoutput") || 0,
      masterBypass: this.getNumberParameter("bypass") || 0,
      reset: this.getNumberParameter("reset") || 0,
      autoListen: this.getNumberParameter("autoListen") || 0,
      spectrumOnOff: this.getNumberParameter("spectrumonoff") || 0,
      spectrum2ChMode: this.getNumberParameter("spectrum2ChMode") || 0,
      spectrumIntegrate: this.getNumberParameter("spectrumintegrate") || 0,
      spectrumPHOnOff: this.getNumberParameter("spectrumPHonoff") || 0,
      spectrumSlope: this.getNumberParameter("spectrumslope") || 0,
      drawEQ: this.getNumberParameter("draweq") || 0,
      drawEQFilled: this.getNumberParameter("draweqfilled") || 0,
      spectrumBarGraph: this.getNumberParameter("spectrumbargraph") || 0,
      showPianoRoll: this.getNumberParameter("showPianoRoll") || 0,
      transparency: this.getNumberParameter("transparency") || 0,
      autoGainOutputValue: this.getNumberParameter("autoGainOutputValue") || 0,
    };
  }
}
