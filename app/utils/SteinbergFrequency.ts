// SteinbergFrequency.ts - Port of the C# SteinbergFrequency class

import { SteinbergVstPreset } from "./SteinbergVstPreset";
import { VstPreset } from "./VstPreset";

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
    this.Vst3ClassID = VstPreset.VstClassIDs.SteinbergFrequency;
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

  private initFrequencyBandParameters(bandNumber: number): void {
    const increment = bandNumber - 1;

    // Channel 1 parameters
    this.initNumberParameter(`equalizerAon${bandNumber}`, 100 + increment, 1.0);
    this.initNumberParameter(
      `equalizerAgain${bandNumber}`,
      108 + increment,
      0.0
    );
    this.initNumberParameter(
      `equalizerAfreq${bandNumber}`,
      116 + increment,
      100.0 * bandNumber
    );
    this.initNumberParameter(`equalizerAq${bandNumber}`, 124 + increment, 1.0);
    this.initNumberParameter(
      `equalizerAtype${bandNumber}`,
      132 + increment,
      bandNumber === 1 || bandNumber === 8
        ? BandMode1And8.Cut48
        : BandMode2To7.Peak
    );
    this.initNumberParameter(`invert${bandNumber}`, 1022 + increment, 0.0);

    // Channel 2 parameters
    this.initNumberParameter(
      `equalizerAon${bandNumber}Ch2`,
      260 + increment,
      1.0
    );
    this.initNumberParameter(
      `equalizerAgain${bandNumber}Ch2`,
      268 + increment,
      0.0
    );
    this.initNumberParameter(
      `equalizerAfreq${bandNumber}Ch2`,
      276 + increment,
      25.0
    );
    this.initNumberParameter(
      `equalizerAq${bandNumber}Ch2`,
      284 + increment,
      1.0
    );
    this.initNumberParameter(
      `equalizerAtype${bandNumber}Ch2`,
      292 + increment,
      bandNumber === 1 || bandNumber === 8
        ? BandMode1And8.Cut48
        : BandMode2To7.Peak
    );
    this.initNumberParameter(`invert${bandNumber}Ch2`, 1030 + increment, 0.0);

    // Shared parameters
    this.initNumberParameter(
      `equalizerAeditchannel${bandNumber}`,
      50 + increment,
      ChannelMode.StereoMode
    );
    this.initNumberParameter(
      `equalizerAbandon${bandNumber}`,
      58 + increment,
      1.0
    );
    this.initNumberParameter(`linearphase${bandNumber}`, 66 + increment, 0.0);
  }

  private initFrequencyPostParameters(): void {
    this.initNumberParameter("equalizerAbypass", 1, 0.0);
    this.initNumberParameter("equalizerAoutput", 2, 0.0);
    this.initNumberParameter("bypass", 1002, 0.0);
    this.initNumberParameter("reset", 1003, 0.0);
    this.initNumberParameter("autoListen", 1005, 0.0);
    this.initNumberParameter("spectrumonoff", 1007, 1.0);
    this.initNumberParameter("spectrum2ChMode", 1008, 0.0);
    this.initNumberParameter("spectrumintegrate", 1010, 40.0);
    this.initNumberParameter("spectrumPHonoff", 1011, 1.0);
    this.initNumberParameter("spectrumslope", 1012, 0.0);
    this.initNumberParameter("draweq", 1013, 1.0);
    this.initNumberParameter("draweqfilled", 1014, 1.0);
    this.initNumberParameter("spectrumbargraph", 1015, 0.0);
    this.initNumberParameter("showPianoRoll", 1019, 1.0);
    this.initNumberParameter("transparency", 1020, 0.3);
    this.initNumberParameter("autoGainOutputValue", 1021, 0.0);
  }
}
