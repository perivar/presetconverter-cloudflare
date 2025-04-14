// SteinbergFrequency.ts - Port of the C# SteinbergFrequency class

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

export class SteinbergFrequency extends SteinbergVstPreset {
  constructor() {
    super();
    this.Vst3ClassID = VstClassIDs.SteinbergFrequency;
    this.PlugInCategory = "Fx|EQ";
    this.PlugInName = "Frequency";
    this.PlugInVendor = "Steinberg Media Technologies";

    this.initStartBytes(19728);

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
    this.initNumParam(`equalizerAon${bandNum}`, 100 + inc, 1.0);
    this.initNumParam(`equalizerAgain${bandNum}`, 108 + inc, 0.0);
    this.initNumParam(`equalizerAfreq${bandNum}`, 116 + inc, 100.0 * bandNum);
    this.initNumParam(`equalizerAq${bandNum}`, 124 + inc, 1.0);
    this.initNumParam(
      `equalizerAtype${bandNum}`,
      132 + inc,
      bandNum === 1 || bandNum === 8 ? BandMode1And8.Cut48 : BandMode2To7.Peak
    );
    this.initNumParam(`invert${bandNum}`, 1022 + inc, 0.0);

    // Channel 2 parameters
    this.initNumParam(`equalizerAon${bandNum}Ch2`, 260 + inc, 1.0);
    this.initNumParam(`equalizerAgain${bandNum}Ch2`, 268 + inc, 0.0);
    this.initNumParam(`equalizerAfreq${bandNum}Ch2`, 276 + inc, 25.0);
    this.initNumParam(`equalizerAq${bandNum}Ch2`, 284 + inc, 1.0);
    this.initNumParam(
      `equalizerAtype${bandNum}Ch2`,
      292 + inc,
      bandNum === 1 || bandNum === 8 ? BandMode1And8.Cut48 : BandMode2To7.Peak
    );
    this.initNumParam(`invert${bandNum}Ch2`, 1030 + inc, 0.0);

    // Shared parameters
    this.initNumParam(
      `equalizerAeditchannel${bandNum}`,
      50 + inc,
      ChannelMode.StereoMode
    );
    this.initNumParam(`equalizerAbandon${bandNum}`, 58 + inc, 1.0);
    this.initNumParam(`linearphase${bandNum}`, 66 + inc, 0.0);
  }

  private initFrequencyPostParameters(): void {
    this.initNumParam("equalizerAbypass", 1, 0.0);
    this.initNumParam("equalizerAoutput", 2, 0.0);
    this.initNumParam("bypass", 1002, 0.0);
    this.initNumParam("reset", 1003, 0.0);
    this.initNumParam("autoListen", 1005, 0.0);
    this.initNumParam("spectrumonoff", 1007, 1.0);
    this.initNumParam("spectrum2ChMode", 1008, 0.0);
    this.initNumParam("spectrumintegrate", 1010, 40.0);
    this.initNumParam("spectrumPHonoff", 1011, 1.0);
    this.initNumParam("spectrumslope", 1012, 0.0);
    this.initNumParam("draweq", 1013, 1.0);
    this.initNumParam("draweqfilled", 1014, 1.0);
    this.initNumParam("spectrumbargraph", 1015, 0.0);
    this.initNumParam("showPianoRoll", 1019, 1.0);
    this.initNumParam("transparency", 1020, 0.3);
    this.initNumParam("autoGainOutputValue", 1021, 0.0);
  }
}
