// SteinbergFrequency.ts

import { SteinbergVstPreset } from "./SteinbergVstPreset";
import { VstClassIDs } from "./VstClassIDs";
import { Parameter, ParameterType, VstPreset } from "./VstPreset";

export enum Frequency2BandMode1And8 {
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

export enum Frequency2BandMode2To7 {
  LowShelf = 0.0,
  Peak = 1.0,
  HighShelf = 2.0,
  Notch = 3.0,
}

export enum Frequency2ChannelMode {
  LeftRightModeLeft = 0.0,
  LeftRightModeRight = 1.0,
  StereoMode = 2.0,
  MidSideModeMid = 3.0,
  MidSideModeSide = 4.0,
}

export interface Frequency2BandParameters {
  enabled: number;
  gain: number;
  freq: number;
  q: number;
  type: number; // BandMode1And8 or BandMode2To7
  invert: number;
  threshold: number;
  ratio: number;
  softon: number;
  attack: number;
  release: number;
  gaindynamic: number;
}

export interface Frequency2BandParametersCh2 extends Frequency2BandParameters {}

export interface Frequency2SharedParameters {
  editChannel: number; // ChannelMode
  bandOn: number;
  linearPhase: number;
  dynamic: number;
  scon: number;
  sclisten: number;
  scauto: number;
  scsource: number;
  scfilterfreq: number;
  scfilterq: number;
  scfilterautochannel: number;
}

export interface Frequency2PostParameters {
  equalizerAoutput: number;
  equalizerAbypass: number;
  autoListen: number;
  bypass: number;
  reset: number;
  autoGainOutputValue: number;
  AutoListen: number;
  equalizerABandToShow: number;
}

export class SteinbergFrequency2 extends SteinbergVstPreset {
  // Properties to store read values
  public bands: Array<{
    ch1: Frequency2BandParameters;
    ch2: Frequency2BandParametersCh2;
    shared: Frequency2SharedParameters;
  }> = [];
  public postParams: Frequency2PostParameters | null = null;

  constructor() {
    super();
    this.Vst3ClassID = VstClassIDs.SteinbergFrequency;
    this.PlugInCategory = "Fx|EQ";
    this.PlugInName = "Frequency";
    this.PlugInVendor = "Steinberg Media Technologies";

    this.setCompChunkDataHeader(43200);
    this.initCompParameters();

    this.setContChunkDataHeader();
    this.initContParameters();
  }

  private setContChunkDataHeader(): void {
    // add the 24 unknown bytes before the parameters start
    // 1) Convert "VERS3" to UTF-16LE null-terminated
    const versionBytes = this.stringToUtf16LeNullTerminated("VERS3");

    // 2) Prepare the remaining bytes
    const rawBytes = new Uint8Array([0xe0, 0x88, 0xe3, 0x6e]);

    // 3) Allocate total buffer: 12 (version) + 4 (raw) + 4 (uint32 1) + 4 (uint32 12) = 24
    const totalBytes = new Uint8Array(24);
    const view = new DataView(totalBytes.buffer);

    let offset = 0;

    // Copy version bytes
    totalBytes.set(versionBytes, offset);
    offset += versionBytes.length;

    // Copy raw bytes
    totalBytes.set(rawBytes, offset);
    offset += rawBytes.length;

    // Write uint32 = 1
    view.setUint32(offset, 1, true);
    offset += 4;

    // Write uint32 = 12
    view.setUint32(offset, 12, true);
    offset += 4;

    this.Parameters.set(
      VstPreset.CHUNK_CONT_HEADER,
      new Parameter(
        VstPreset.CHUNK_CONT_HEADER,
        -1,
        totalBytes,
        ParameterType.Bytes
      )
    );
  }

  private initCompParameters(): void {
    for (let i = 1; i <= 8; i++) {
      this.initFrequencyBandParameters(i);
    }
    this.initFrequencyPostParameters();
  }

  private initFrequencyBandParameters(bandNum: number): void {
    // increment
    const inc = bandNum - 1;

    // Channel 1 parameters
    this.setNumberParameterWithIndex(
      `${VstPreset.CHUNK_COMP}equalizerAon${bandNum}`,
      100 + inc,
      1.0
    );
    this.setNumberParameterWithIndex(
      `${VstPreset.CHUNK_COMP}equalizerAgain${bandNum}`,
      108 + inc,
      0.0
    );
    this.setNumberParameterWithIndex(
      `${VstPreset.CHUNK_COMP}equalizerAfreq${bandNum}`,
      116 + inc,
      bandNum === 1 ? 25.0 : 100.0
    );
    this.setNumberParameterWithIndex(
      `${VstPreset.CHUNK_COMP}equalizerAq${bandNum}`,
      124 + inc,
      1.0
    );
    this.setNumberParameterWithIndex(
      `${VstPreset.CHUNK_COMP}equalizerAtype${bandNum}`,
      132 + inc,
      bandNum === 1 || bandNum === 8
        ? Frequency2BandMode1And8.Peak
        : Frequency2BandMode2To7.Peak
    );
    this.setNumberParameterWithIndex(
      `${VstPreset.CHUNK_COMP}invert${bandNum}`,
      1022 + inc,
      0.0
    );
    this.setNumberParameterWithIndex(
      `${VstPreset.CHUNK_COMP}equalizerAthreshold${bandNum}`,
      140 + inc,
      -25.0
    );
    this.setNumberParameterWithIndex(
      `${VstPreset.CHUNK_COMP}equalizerAratio${bandNum}`,
      148 + inc,
      2.0
    );
    this.setNumberParameterWithIndex(
      `${VstPreset.CHUNK_COMP}equalizerAsofton${bandNum}`,
      220 + inc,
      0.0
    );
    this.setNumberParameterWithIndex(
      `${VstPreset.CHUNK_COMP}equalizerAattack${bandNum}`,
      156 + inc,
      1.0
    );
    this.setNumberParameterWithIndex(
      `${VstPreset.CHUNK_COMP}equalizerArelease${bandNum}`,
      164 + inc,
      150.0
    );
    this.setNumberParameterWithIndex(
      `${VstPreset.CHUNK_COMP}equalizerAgaindynamic${bandNum}`,
      172 + inc,
      0.0
    );

    // Channel 2 parameters
    this.setNumberParameterWithIndex(
      `${VstPreset.CHUNK_COMP}equalizerAon${bandNum}Ch2`,
      260 + inc,
      1.0
    );
    this.setNumberParameterWithIndex(
      `${VstPreset.CHUNK_COMP}equalizerAgain${bandNum}Ch2`,
      268 + inc,
      0.0
    );
    this.setNumberParameterWithIndex(
      `${VstPreset.CHUNK_COMP}equalizerAfreq${bandNum}Ch2`,
      276 + inc,
      bandNum === 1 ? 25.0 : 100.0
    );
    this.setNumberParameterWithIndex(
      `${VstPreset.CHUNK_COMP}equalizerAq${bandNum}Ch2`,
      284 + inc,
      1.0
    );
    this.setNumberParameterWithIndex(
      `${VstPreset.CHUNK_COMP}equalizerAtype${bandNum}Ch2`,
      292 + inc,
      bandNum === 1 || bandNum === 8
        ? Frequency2BandMode1And8.Peak
        : Frequency2BandMode2To7.Peak
    );
    this.setNumberParameterWithIndex(
      `${VstPreset.CHUNK_COMP}invert${bandNum}Ch2`,
      1030 + inc,
      0.0
    );
    this.setNumberParameterWithIndex(
      `${VstPreset.CHUNK_COMP}equalizerAthreshold${bandNum}Ch2`,
      300 + inc,
      -25.0
    );
    this.setNumberParameterWithIndex(
      `${VstPreset.CHUNK_COMP}equalizerAratio${bandNum}Ch2`,
      308 + inc,
      2.0
    );
    this.setNumberParameterWithIndex(
      `${VstPreset.CHUNK_COMP}equalizerAsofton${bandNum}Ch2`,
      340 + inc,
      0.0
    );
    this.setNumberParameterWithIndex(
      `${VstPreset.CHUNK_COMP}equalizerAattack${bandNum}Ch2`,
      316 + inc,
      1.0
    );
    this.setNumberParameterWithIndex(
      `${VstPreset.CHUNK_COMP}equalizerArelease${bandNum}Ch2`,
      324 + inc,
      150.0
    );
    this.setNumberParameterWithIndex(
      `${VstPreset.CHUNK_COMP}equalizerAgaindynamic${bandNum}Ch2`,
      332 + inc,
      0.0
    );

    // Shared parameters
    this.setNumberParameterWithIndex(
      `${VstPreset.CHUNK_COMP}equalizerAeditchannel${bandNum}`,
      50 + inc,
      Frequency2ChannelMode.StereoMode
    );
    this.setNumberParameterWithIndex(
      `${VstPreset.CHUNK_COMP}equalizerAbandon${bandNum}`,
      58 + inc,
      1.0
    );
    this.setNumberParameterWithIndex(
      `${VstPreset.CHUNK_COMP}linearphase${bandNum}`,
      66 + inc,
      0.0
    );
    this.setNumberParameterWithIndex(
      `${VstPreset.CHUNK_COMP}dynamic${bandNum}`,
      74 + inc,
      0.0
    );
    this.setNumberParameterWithIndex(
      `${VstPreset.CHUNK_COMP}scon${bandNum}`,
      180 + inc,
      1.0
    );
    this.setNumberParameterWithIndex(
      `${VstPreset.CHUNK_COMP}sclisten${bandNum}`,
      82 + inc,
      0.0
    );
    this.setNumberParameterWithIndex(
      `${VstPreset.CHUNK_COMP}scauto${bandNum}`,
      204 + inc,
      1.0
    );
    this.setNumberParameterWithIndex(
      `${VstPreset.CHUNK_COMP}scsource${bandNum}`,
      212 + inc,
      0.0
    );
    this.setNumberParameterWithIndex(
      `${VstPreset.CHUNK_COMP}scfilterfreq${bandNum}`,
      188 + inc,
      1000.0
    );
    this.setNumberParameterWithIndex(
      `${VstPreset.CHUNK_COMP}scfilterq${bandNum}`,
      196 + inc,
      1.0
    );
    this.setNumberParameterWithIndex(
      `${VstPreset.CHUNK_COMP}scfilterautochannel${bandNum}`,
      90 + inc,
      0.0
    );
  }

  private initFrequencyPostParameters(): void {
    this.setNumberParameterWithIndex(
      `${VstPreset.CHUNK_COMP}equalizerAoutput`,
      2,
      0.0
    );
    this.setNumberParameterWithIndex(
      `${VstPreset.CHUNK_COMP}equalizerAbypass`,
      1,
      0.0
    );
    this.setNumberParameterWithIndex(
      `${VstPreset.CHUNK_COMP}autoListen`,
      1005,
      0.0
    );
    this.setNumberParameterWithIndex(
      `${VstPreset.CHUNK_COMP}bypass`,
      1002,
      0.0
    );
    this.setNumberParameterWithIndex(`${VstPreset.CHUNK_COMP}reset`, 1003, 0.0);
    this.setNumberParameterWithIndex(
      `${VstPreset.CHUNK_COMP}autoGainOutputValue`,
      1021,
      0.0
    );
    this.setNumberParameterWithIndex(
      `${VstPreset.CHUNK_COMP}AutoListen`,
      3,
      0.0
    );
    this.setNumberParameterWithIndex(
      `${VstPreset.CHUNK_COMP}equalizerABandToShow`,
      1004,
      7.0
    );
  }

  private initContParameters(): void {
    this.setNumberParameterWithIndex(
      `${VstPreset.CHUNK_CONT}displaydbrange`,
      2156,
      4.0
    );
    this.setNumberParameterWithIndex(
      `${VstPreset.CHUNK_CONT}spectrumonoff`,
      1007,
      1.0
    );
    this.setNumberParameterWithIndex(
      `${VstPreset.CHUNK_CONT}spectrum2ChMode`,
      1008,
      0.0
    );
    this.setNumberParameterWithIndex(
      `${VstPreset.CHUNK_CONT}spectrumintegrate`,
      1010,
      40.0
    );
    this.setNumberParameterWithIndex(
      `${VstPreset.CHUNK_CONT}spectrumPHonoff`,
      1011,
      1.0
    );
    this.setNumberParameterWithIndex(
      `${VstPreset.CHUNK_CONT}spectrumslope`,
      1012,
      0.0
    );
    this.setNumberParameterWithIndex(
      `${VstPreset.CHUNK_CONT}draweq`,
      1013,
      1.0
    );
    this.setNumberParameterWithIndex(
      `${VstPreset.CHUNK_CONT}draweqfilled`,
      1014,
      1.0
    );
    this.setNumberParameterWithIndex(
      `${VstPreset.CHUNK_CONT}spectrumbargraph`,
      1015,
      0.0
    );
    this.setNumberParameterWithIndex(
      `${VstPreset.CHUNK_CONT}showPianoRoll`,
      1019,
      1.0
    );
    this.setNumberParameterWithIndex(
      `${VstPreset.CHUNK_CONT}viewMode`,
      1046,
      0.0
    );
    this.setNumberParameterWithIndex(
      `${VstPreset.CHUNK_CONT}transparency`,
      1020,
      0.3
    );
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
    ch1: Frequency2BandParameters;
    ch2: Frequency2BandParametersCh2;
    shared: Frequency2SharedParameters;
  } {
    const ch1: Frequency2BandParameters = {
      enabled:
        this.getNumberParameter(
          `${VstPreset.CHUNK_COMP}equalizerAon${bandNum}`
        ) || 0,
      gain:
        this.getNumberParameter(
          `${VstPreset.CHUNK_COMP}equalizerAgain${bandNum}`
        ) || 0,
      freq:
        this.getNumberParameter(
          `${VstPreset.CHUNK_COMP}equalizerAfreq${bandNum}`
        ) || 0,
      q:
        this.getNumberParameter(
          `${VstPreset.CHUNK_COMP}equalizerAq${bandNum}`
        ) || 0,
      type:
        this.getNumberParameter(
          `${VstPreset.CHUNK_COMP}equalizerAtype${bandNum}`
        ) || 0,
      invert:
        this.getNumberParameter(`${VstPreset.CHUNK_COMP}invert${bandNum}`) || 0,
      threshold:
        this.getNumberParameter(
          `${VstPreset.CHUNK_COMP}equalizerAthreshold${bandNum}`
        ) || 0,
      ratio:
        this.getNumberParameter(
          `${VstPreset.CHUNK_COMP}equalizerAratio${bandNum}`
        ) || 0,
      softon:
        this.getNumberParameter(
          `${VstPreset.CHUNK_COMP}equalizerAsofton${bandNum}`
        ) || 0,
      attack:
        this.getNumberParameter(
          `${VstPreset.CHUNK_COMP}equalizerAattack${bandNum}`
        ) || 0,
      release:
        this.getNumberParameter(
          `${VstPreset.CHUNK_COMP}equalizerArelease${bandNum}`
        ) || 0,
      gaindynamic:
        this.getNumberParameter(
          `${VstPreset.CHUNK_COMP}equalizerAgaindynamic${bandNum}`
        ) || 0,
    };

    const ch2: Frequency2BandParametersCh2 = {
      enabled:
        this.getNumberParameter(
          `${VstPreset.CHUNK_COMP}equalizerAon${bandNum}Ch2`
        ) || 0,
      gain:
        this.getNumberParameter(
          `${VstPreset.CHUNK_COMP}equalizerAgain${bandNum}Ch2`
        ) || 0,
      freq:
        this.getNumberParameter(
          `${VstPreset.CHUNK_COMP}equalizerAfreq${bandNum}Ch2`
        ) || 0,
      q:
        this.getNumberParameter(
          `${VstPreset.CHUNK_COMP}equalizerAq${bandNum}Ch2`
        ) || 0,
      type:
        this.getNumberParameter(
          `${VstPreset.CHUNK_COMP}equalizerAtype${bandNum}Ch2`
        ) || 0,
      invert:
        this.getNumberParameter(`${VstPreset.CHUNK_COMP}invert${bandNum}Ch2`) ||
        0,
      threshold:
        this.getNumberParameter(
          `${VstPreset.CHUNK_COMP}equalizerAthreshold${bandNum}Ch2`
        ) || 0,
      ratio:
        this.getNumberParameter(
          `${VstPreset.CHUNK_COMP}equalizerAratio${bandNum}Ch2`
        ) || 0,
      softon:
        this.getNumberParameter(
          `${VstPreset.CHUNK_COMP}equalizerAsofton${bandNum}Ch2`
        ) || 0,
      attack:
        this.getNumberParameter(
          `${VstPreset.CHUNK_COMP}equalizerAattack${bandNum}Ch2`
        ) || 0,
      release:
        this.getNumberParameter(
          `${VstPreset.CHUNK_COMP}equalizerArelease${bandNum}Ch2`
        ) || 0,
      gaindynamic:
        this.getNumberParameter(
          `${VstPreset.CHUNK_COMP}equalizerAgaindynamic${bandNum}Ch2`
        ) || 0,
    };

    const shared: Frequency2SharedParameters = {
      editChannel:
        this.getNumberParameter(
          `${VstPreset.CHUNK_COMP}equalizerAeditchannel${bandNum}`
        ) || 0,
      bandOn:
        this.getNumberParameter(
          `${VstPreset.CHUNK_COMP}equalizerAbandon${bandNum}`
        ) || 0,
      linearPhase:
        this.getNumberParameter(
          `${VstPreset.CHUNK_COMP}linearphase${bandNum}`
        ) || 0,
      dynamic:
        this.getNumberParameter(`${VstPreset.CHUNK_COMP}dynamic${bandNum}`) ||
        0,
      scon:
        this.getNumberParameter(`${VstPreset.CHUNK_COMP}scon${bandNum}`) || 0,
      sclisten:
        this.getNumberParameter(`${VstPreset.CHUNK_COMP}sclisten${bandNum}`) ||
        0,
      scauto:
        this.getNumberParameter(`${VstPreset.CHUNK_COMP}scauto${bandNum}`) || 0,
      scsource:
        this.getNumberParameter(`${VstPreset.CHUNK_COMP}scsource${bandNum}`) ||
        0,
      scfilterfreq:
        this.getNumberParameter(
          `${VstPreset.CHUNK_COMP}scfilterfreq${bandNum}`
        ) || 0,
      scfilterq:
        this.getNumberParameter(`${VstPreset.CHUNK_COMP}scfilterq${bandNum}`) ||
        0,
      scfilterautochannel:
        this.getNumberParameter(
          `${VstPreset.CHUNK_COMP}scfilterautochannel${bandNum}`
        ) || 0,
    };

    return { ch1, ch2, shared };
  }

  private readFrequencyPostParameters(): Frequency2PostParameters {
    return {
      equalizerAoutput:
        this.getNumberParameter(`${VstPreset.CHUNK_COMP}equalizerAoutput`) || 0,
      equalizerAbypass:
        this.getNumberParameter(`${VstPreset.CHUNK_COMP}equalizerAbypass`) || 0,
      autoListen:
        this.getNumberParameter(`${VstPreset.CHUNK_COMP}autoListen`) || 0,
      bypass: this.getNumberParameter(`${VstPreset.CHUNK_COMP}bypass`) || 0,
      reset: this.getNumberParameter(`${VstPreset.CHUNK_COMP}reset`) || 0,
      autoGainOutputValue:
        this.getNumberParameter(`${VstPreset.CHUNK_COMP}autoGainOutputValue`) ||
        0,
      AutoListen:
        this.getNumberParameter(`${VstPreset.CHUNK_COMP}AutoListen`) || 0,
      equalizerABandToShow:
        this.getNumberParameter(
          `${VstPreset.CHUNK_COMP}equalizerABandToShow`
        ) || 0,
    };
  }

  // --- String Representation ---

  /**
   * Get Band information string.
   * @param bandNum - band number from 1 to 8
   * @param channel - empty for main channel (channel 1). 'Ch2' for secondary channel
   * @returns A string describing the band's parameters, or an empty string if the channel is inactive.
   */
  private getBandInfo(bandNum: number, channel: "" | "Ch2"): string {
    const lines: string[] = [];

    const isChannelOn =
      this.getNumberParameter(
        `${VstPreset.CHUNK_COMP}equalizerAon${bandNum}${channel}`
      ) === 1.0;
    const gain =
      this.getNumberParameter(
        `${VstPreset.CHUNK_COMP}equalizerAgain${bandNum}${channel}`
      ) || 0;
    const frequency =
      this.getNumberParameter(
        `${VstPreset.CHUNK_COMP}equalizerAfreq${bandNum}${channel}`
      ) || 0;
    const q =
      this.getNumberParameter(
        `${VstPreset.CHUNK_COMP}equalizerAq${bandNum}${channel}`
      ) || 0;
    const isInverted =
      this.getNumberParameter(
        `${VstPreset.CHUNK_COMP}invert${bandNum}${channel}`
      ) === 1.0;

    let shape = "";
    const typeParam = this.getNumberParameter(
      `${VstPreset.CHUNK_COMP}equalizerAtype${bandNum}${channel}`
    );

    if (bandNum === 1 || bandNum === 8) {
      switch (typeParam) {
        case Frequency2BandMode1And8.Cut6:
          shape = "Cut6";
          break;
        case Frequency2BandMode1And8.Cut12:
          shape = "Cut12";
          break;
        case Frequency2BandMode1And8.Cut24:
          shape = "Cut24";
          break;
        case Frequency2BandMode1And8.Cut48:
          shape = "Cut48";
          break;
        case Frequency2BandMode1And8.Cut96:
          shape = "Cut96";
          break;
        case Frequency2BandMode1And8.LowShelf:
          shape = "LowShelf";
          break;
        case Frequency2BandMode1And8.Peak:
          shape = "Peak";
          break;
        case Frequency2BandMode1And8.HighShelf:
          shape = "HighShelf";
          break;
        case Frequency2BandMode1And8.Notch:
          shape = "Notch";
          break;
      }
    } else {
      switch (typeParam) {
        case Frequency2BandMode2To7.LowShelf:
          shape = "LowShelf";
          break;
        case Frequency2BandMode2To7.Peak:
          shape = "Peak";
          break;
        case Frequency2BandMode2To7.HighShelf:
          shape = "HighShelf";
          break;
        case Frequency2BandMode2To7.Notch:
          shape = "Notch";
          break;
      }
    }

    let stereoPlacement = "";
    const editChannelParam = this.getNumberParameter(
      `${VstPreset.CHUNK_COMP}equalizerAeditchannel${bandNum}`
    );
    switch (editChannelParam) {
      case Frequency2ChannelMode.LeftRightModeLeft:
        stereoPlacement = "LR: Left";
        break;
      case Frequency2ChannelMode.LeftRightModeRight:
        stereoPlacement = "LR: Right";
        break;
      case Frequency2ChannelMode.StereoMode:
        stereoPlacement = "Stereo";
        break;
      case Frequency2ChannelMode.MidSideModeMid:
        stereoPlacement = "MS: Mid";
        break;
      case Frequency2ChannelMode.MidSideModeSide:
        stereoPlacement = "MS: Side";
        break;
    }

    let effectiveChannelOn = isChannelOn;
    if (stereoPlacement === "Stereo" && channel !== "") {
      effectiveChannelOn = false; // Ignore secondary channel if mode is Stereo
    }

    if (effectiveChannelOn) {
      lines.push(
        `${bandNum} ${shape}: ${frequency.toFixed(2)} Hz, ${gain.toFixed(
          2
        )} dB, Q: ${q.toFixed(2)}, Ch: ${
          isChannelOn ? "On" : "Off"
        }, ${isInverted ? "Inverted " : ""}${stereoPlacement} ${channel}`
      );
    }

    return lines.join("\n");
  }

  /**
   * Generates a string representation of the Steinberg Frequency preset parameters.
   * @returns A multi-line string detailing the preset's configuration.
   */
  public toString(): string {
    // Ensure parameters are read if they haven't been already
    if (this.bands.length === 0 || !this.postParams) {
      this.readParameters();
    }

    const lines: string[] = [];
    lines.push(`Vst3ID: ${this.Vst3ClassID}`);
    lines.push("Bands:");

    for (let bandNum = 1; bandNum <= 8; bandNum++) {
      const isBandEnabled =
        this.getNumberParameter(
          `${VstPreset.CHUNK_COMP}equalizerAbandon${bandNum}`
        ) === 1.0;
      const isLinearPhase =
        this.getNumberParameter(
          `${VstPreset.CHUNK_COMP}linearphase${bandNum}`
        ) === 1.0;
      const bandStatus = `[${isBandEnabled ? "On " : "Off"}]`; // Padded for alignment

      const bandInfoCh1 = this.getBandInfo(bandNum, "");
      if (bandInfoCh1) {
        lines.push(
          `${bandStatus} ${bandInfoCh1}${isLinearPhase ? ", Linear phase" : ""}`
        );
      }

      const bandInfoCh2 = this.getBandInfo(bandNum, "Ch2");
      if (bandInfoCh2) {
        // Only show band status once per band number if Ch1 wasn't shown
        const statusPrefix = bandInfoCh1
          ? " ".repeat(bandStatus.length)
          : bandStatus;
        lines.push(
          `${statusPrefix} ${bandInfoCh2}${isLinearPhase ? ", Linear phase" : ""}`
        );
      }
    }

    lines.push(""); // Add empty line separator

    if (this.postParams) {
      lines.push(`equalizerAoutput: ${this.postParams.equalizerAoutput}`);
      lines.push(`equalizerAbypass: ${this.postParams.equalizerAbypass}`);
      lines.push(`autoListen: ${this.postParams.autoListen}`);
      lines.push(`bypass: ${this.postParams.bypass}`);
      lines.push(`reset: ${this.postParams.reset}`);
      lines.push(`autoGainOutputValue: ${this.postParams.autoGainOutputValue}`);
      lines.push(`AutoListen: ${this.postParams.AutoListen}`);
      lines.push(
        `equalizerABandToShow: ${this.postParams.equalizerABandToShow}`
      );
    }

    return lines.join("\n");
  }
}
