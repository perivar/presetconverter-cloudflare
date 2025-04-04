import { BinaryFile, ByteOrder } from "./BinaryFile";
import { FabfilterProQBase } from "./FabfilterProQBase";
import { FxSet } from "./FXP";
import { ParameterType, VstPreset } from "./VstPreset";

export enum ProQ2Shape {
  Bell = 0, // (default)
  LowShelf = 1,
  LowCut = 2,
  HighShelf = 3,
  HighCut = 4,
  Notch = 5,
  BandPass = 6,
  TiltShelf = 7,
}

export enum ProQ2Slope {
  Slope6dB_oct = 0,
  Slope12dB_oct = 1,
  Slope18dB_oct = 2,
  Slope24dB_oct = 3, // (default)
  Slope30dB_oct = 4,
  Slope36dB_oct = 5,
  Slope48dB_oct = 6,
  Slope72dB_oct = 7,
  Slope96dB_oct = 8,
}

export enum ProQ2StereoPlacement {
  LeftOrMid = 0,
  RightOrSide = 1,
  Stereo = 2, // (default)
}

export enum ProQ2ChannelMode {
  LeftRight = 0,
  MidSide = 1,
}

export class ProQ2Band {
  ChannelMode: ProQ2ChannelMode; // determine if band is in LS or MS mode
  Enabled: boolean;
  Frequency: number; // value range 10.0 -> 30000.0 Hz
  Gain: number; // + or - value in dB
  Q: number; // value range 0.025 -> 40.00
  Shape: ProQ2Shape;
  Slope: ProQ2Slope;
  StereoPlacement: ProQ2StereoPlacement;

  constructor() {
    this.ChannelMode = ProQ2ChannelMode.LeftRight;
    this.Enabled = false;
    this.Frequency = FabfilterProQBase.freqConvert(1000);
    this.Gain = 0;
    this.Q = FabfilterProQBase.qConvert(1);
    this.Shape = ProQ2Shape.Bell;
    this.Slope = ProQ2Slope.Slope24dB_oct;
    this.StereoPlacement = ProQ2StereoPlacement.Stereo;
  }

  toString(): string {
    const shapeStr = ProQ2Shape[this.Shape];
    const slopeStr = ProQ2Slope[this.Slope];
    const placementStr = ProQ2StereoPlacement[this.StereoPlacement];
    const channelStr = ProQ2ChannelMode[this.ChannelMode];

    return (
      `${this.Enabled ? "Enabled" : "Disabled"} | ${channelStr} | ${placementStr} | ` +
      `${shapeStr} @ ${this.Frequency.toFixed(1)} Hz | ` +
      `Gain: ${this.Gain.toFixed(1)} dB | Q: ${this.Q.toFixed(2)} | ` +
      `${slopeStr}`
    );
  }
}

export class FabfilterProQ2 extends FabfilterProQBase {
  Bands: ProQ2Band[] = [];
  Version: number = 2; // Normally 2
  ParameterCount: number = 190; // Normally 190

  // Post Band Parameters
  ProcessingMode: number = 0; // Zero Latency: 0.0, Natural Phase: 1.0, Linear Phase: 2.0
  ProcessingResolution: number = 0; // Medium
  ChannelMode: number = 0; // 0 = Left/Right, 1 = Mid/Side
  GainScale: number = 0; // 100%
  OutputLevel: number = 0; // 0.0 dB, -1 to 1 (- Infinity to +36 dB , 0 = 0 dB)
  OutputPan: number = 0; // Left 0 dB, Right: 0 dB, -1 to 1 (0 = middle)
  ByPass: number = 0; // Not Bypassed
  OutputInvertPhase: number = 0; // Normal
  AutoGain: number = 0; // Off
  AnalyzerShowPreProcessing: number = 0; // Disabled - 0: Off, 1: On
  AnalyzerShowPostProcessing: number = 0; // Disabled - 0: Off, 1: On
  AnalyzerShowSidechain: number = 0; // Disabled - 0: Off, 1: On
  AnalyzerRange: number = 0; // Analyzer Range in dB. 0.0: 60dB, 1.0: 90dB, 2.0: 120dB
  AnalyzerResolution: number = 0; // Analyzer Resolution. 0.0: Low, 1.0: Medium, 2.0: High, 3.00: Maximum
  AnalyzerSpeed: number = 0; // Analyzer Speed. 0.0: Very Slow, 1.0: Slow, 2.0: Medium, 3.0 Fast, 4.0: Very Fast
  AnalyzerTilt: number = 0; // Analyzer Tilt in dB/oct. 0.0: 0.0, 1.0: 1.5, 2.0: 3.0, 3.0: 4.5, 4.0: 6.0
  AnalyzerFreeze: number = 0; // 0: Off, 1: On
  SpectrumGrab: number = 0; // Enabled
  DisplayRange: number = 0; // 12dB
  ReceiveMidi: number = 0; // Enabled
  SoloBand: number = -1; // -1
  SoloGain: number = 0; // 0.00

  // Ignore the Ex fields
  // public float ExAutoGain;

  constructor() {
    super();
    this.Version = 2;
    this.Vst3ClassID = VstPreset.VstClassIDs.FabFilterProQ2;
    this.PlugInCategory = "Fx|EQ";
    this.PlugInName = "FabFilter Pro-Q 2";
    this.PlugInVendor = "FabFilter";
  }

  public initFromParameters(parameters?: number[], isIEEE = true): void {
    if (parameters) {
      this.initFromParameterArray(parameters, isIEEE);
      return;
    }

    if (
      this.FXP?.content instanceof FxSet &&
      this.FXP.content.Programs?.length > 0
    ) {
      const program = this.FXP.content.Programs[0];
      if (program.Parameters) {
        this.initFromParameterArray([...program.Parameters], true);
      }
    } else if (this.Parameters) {
      const floatParameters: number[] = [];
      const sortedKeys = Array.from(this.Parameters.keys()).sort((a, b) => {
        const numA = parseInt(a, 10);
        const numB = parseInt(b, 10);
        return !isNaN(numA) && !isNaN(numB) ? numA - numB : a.localeCompare(b);
      });

      for (const key of sortedKeys) {
        const paramValue = this.Parameters.get(key);
        if (paramValue?.Type === ParameterType.Number) {
          floatParameters.push(paramValue.Value as number);
        }
      }

      this.initFromParameterArray(floatParameters, false);
    }
  }

  private initFromParameterArray(parameters: number[], isIEEE = true): void {
    this.Bands = [];
    let index = 0;

    for (let i = 0; i < 24; i++) {
      const band = new ProQ2Band();

      band.Enabled = parameters[index++] === 1;

      if (isIEEE) {
        band.Frequency = FabfilterProQBase.freqConvertBack(
          FabfilterProQBase.ieeeFloatToFrequencyFloat(parameters[index++])
        );
        band.Gain = parameters[index++] * 60 - 30;
        band.Q = FabfilterProQBase.qConvertBack(parameters[index++]);
      } else {
        band.Frequency = FabfilterProQBase.freqConvertBack(parameters[index++]);
        band.Gain = parameters[index++];
        band.Q = FabfilterProQBase.qConvertBack(parameters[index++]);
      }

      const filterType = Math.floor(parameters[index++] * (isIEEE ? 7 : 1));
      if (filterType >= 0 && filterType <= ProQ2Shape.TiltShelf) {
        band.Shape = filterType;
      } else {
        band.Shape = ProQ2Shape.Bell;
      }

      const filterSlope = Math.floor(parameters[index++] * (isIEEE ? 8 : 1));
      band.Slope = Math.min(Math.max(filterSlope, 0), ProQ2Slope.Slope96dB_oct);

      const stereoPlacement = Math.floor(
        parameters[index++] * (isIEEE ? 2 : 1)
      );
      if (
        stereoPlacement >= 0 &&
        stereoPlacement <= ProQ2StereoPlacement.Stereo
      ) {
        band.StereoPlacement = stereoPlacement;
      } else {
        band.StereoPlacement = ProQ2StereoPlacement.Stereo;
      }

      index++; // Skip unknown parameter

      this.Bands.push(band);
    }

    if (parameters.length > 24 * 7) {
      const remainingParams = parameters.slice(24 * 7);
      if (remainingParams.length > 0) this.ProcessingMode = remainingParams[0];
      if (remainingParams.length > 1)
        this.ProcessingResolution = remainingParams[1];
      if (remainingParams.length > 2) this.ChannelMode = remainingParams[2];
      if (remainingParams.length > 3) this.GainScale = remainingParams[3];
      if (remainingParams.length > 4) this.OutputLevel = remainingParams[4];
      if (remainingParams.length > 5) this.OutputPan = remainingParams[5];
      if (remainingParams.length > 6) this.ByPass = remainingParams[6];
      if (remainingParams.length > 7)
        this.OutputInvertPhase = remainingParams[7];
      if (remainingParams.length > 8) this.AutoGain = remainingParams[8];
      if (remainingParams.length > 9)
        this.AnalyzerShowPreProcessing = remainingParams[9];
      if (remainingParams.length > 10)
        this.AnalyzerShowPostProcessing = remainingParams[10];
      if (remainingParams.length > 11)
        this.AnalyzerShowSidechain = remainingParams[11];
      if (remainingParams.length > 12) this.AnalyzerRange = remainingParams[12];
      if (remainingParams.length > 13)
        this.AnalyzerResolution = remainingParams[13];
      if (remainingParams.length > 14) this.AnalyzerSpeed = remainingParams[14];
      if (remainingParams.length > 15) this.AnalyzerTilt = remainingParams[15];
      if (remainingParams.length > 16)
        this.AnalyzerFreeze = remainingParams[16];
      if (remainingParams.length > 17) this.SpectrumGrab = remainingParams[17];
      if (remainingParams.length > 18) this.DisplayRange = remainingParams[18];
      if (remainingParams.length > 19) this.ReceiveMidi = remainingParams[19];
      if (remainingParams.length > 20) this.SoloBand = remainingParams[20];
      if (remainingParams.length > 21) this.SoloGain = remainingParams[21];
    }

    if (this.ChannelMode === ProQ2ChannelMode.MidSide) {
      this.Bands.forEach(band => (band.ChannelMode = ProQ2ChannelMode.MidSide));
    }
  }

  public readFFP(data: Uint8Array, doReadHeader = true): boolean {
    const bf = new BinaryFile(data, ByteOrder.LittleEndian);
    if (!bf.binaryReader) return false;

    if (doReadHeader) {
      const header = bf.binaryReader.readString(4);
      if (header !== "FQ2p") return false;
    }

    this.Version = bf.binaryReader.readUInt32() || 0;
    this.ParameterCount = bf.binaryReader.readUInt32() || 0;

    this.Bands = [];
    for (let i = 0; i < 24; i++) {
      const band = new ProQ2Band();

      // 1 = Enabled, 2 = Disabled
      band.Enabled = bf.binaryReader.readFloat32() === 1;

      const freq = bf.binaryReader.readFloat32() || 0;
      band.Frequency = FabfilterProQBase.freqConvertBack(freq);

      band.Gain = bf.binaryReader.readFloat32() || 0;

      const q = bf.binaryReader.readFloat32() || 0;
      band.Q = FabfilterProQBase.qConvertBack(q);

      // 0 - 7
      const filterType = bf.binaryReader.readFloat32();
      switch (filterType) {
        case ProQ2Shape.Bell:
          band.Shape = ProQ2Shape.Bell;
          break;
        case ProQ2Shape.LowShelf:
          band.Shape = ProQ2Shape.LowShelf;
          break;
        case ProQ2Shape.LowCut:
          band.Shape = ProQ2Shape.LowCut;
          break;
        case ProQ2Shape.HighShelf:
          band.Shape = ProQ2Shape.HighShelf;
          break;
        case ProQ2Shape.HighCut:
          band.Shape = ProQ2Shape.HighCut;
          break;
        case ProQ2Shape.Notch:
          band.Shape = ProQ2Shape.Notch;
          break;
        case ProQ2Shape.BandPass:
          band.Shape = ProQ2Shape.BandPass;
          break;
        case ProQ2Shape.TiltShelf:
          band.Shape = ProQ2Shape.TiltShelf;
        default:
          throw new Error(`Filter type is outside range: ${filterType}`);
      }

      // 0 - 8
      const filterSlope = bf.binaryReader.readFloat32();
      switch (filterSlope) {
        case ProQ2Slope.Slope6dB_oct:
          band.Slope = ProQ2Slope.Slope6dB_oct;
          break;
        case ProQ2Slope.Slope12dB_oct:
          band.Slope = ProQ2Slope.Slope12dB_oct;
          break;
        case ProQ2Slope.Slope18dB_oct:
          band.Slope = ProQ2Slope.Slope18dB_oct;
          break;
        case ProQ2Slope.Slope24dB_oct:
          band.Slope = ProQ2Slope.Slope24dB_oct;
          break;
        case ProQ2Slope.Slope30dB_oct:
          band.Slope = ProQ2Slope.Slope30dB_oct;
          break;
        case ProQ2Slope.Slope36dB_oct:
          band.Slope = ProQ2Slope.Slope36dB_oct;
          break;
        case ProQ2Slope.Slope48dB_oct:
          band.Slope = ProQ2Slope.Slope48dB_oct;
          break;
        case ProQ2Slope.Slope72dB_oct:
          band.Slope = ProQ2Slope.Slope72dB_oct;
          break;
        case ProQ2Slope.Slope96dB_oct:
          band.Slope = ProQ2Slope.Slope96dB_oct;
          break;
        default:
          throw new Error(`Filter slope is outside range: ${filterSlope}`);
      }

      // 0 = Left, 1 = Right, 2 = Stereo
      const filterStereoPlacement = bf.binaryReader.readFloat32();
      switch (filterStereoPlacement) {
        case ProQ2StereoPlacement.LeftOrMid:
          band.StereoPlacement = ProQ2StereoPlacement.LeftOrMid;
          break;
        case ProQ2StereoPlacement.RightOrSide:
          band.StereoPlacement = ProQ2StereoPlacement.RightOrSide;
          break;
        case ProQ2StereoPlacement.Stereo:
          band.StereoPlacement = ProQ2StereoPlacement.Stereo;
          break;
        default:
          throw new Error(
            `Filter stereo placement is outside range: ${filterStereoPlacement}`
          );
      }

      this.Bands.push(band);
    }

    // read the remaining floats
    // int remainingParameterCount = ParameterCount - 7 * Bands.Count;
    try {
      this.ProcessingMode = bf.binaryReader.readFloat32() || 0; // Zero Latency: 0.0, Natural Phase: 1.0, Linear Phase: 2.0
      this.ProcessingResolution = bf.binaryReader.readFloat32() || 0; // 0 - 4, Medium
      this.ChannelMode = bf.binaryReader.readFloat32() || 0; // 0 = Left/Right, 1 = Mid/Side
      this.GainScale = bf.binaryReader.readFloat32() || 0; // 100%
      this.OutputLevel = bf.binaryReader.readFloat32() || 0; // 0.0 dB, -1 to 1 (- Infinity to +36 dB , 0 = 0 dB)
      this.OutputPan = bf.binaryReader.readFloat32() || 0; // Left 0 dB, Right: 0 dB, -1 to 1 (0 = middle)
      this.ByPass = bf.binaryReader.readFloat32() || 0; // Not Bypassed
      this.OutputInvertPhase = bf.binaryReader.readFloat32() || 0; // Normal
      this.AutoGain = bf.binaryReader.readFloat32() || 0; // Off
      this.AnalyzerShowPreProcessing = bf.binaryReader.readFloat32() || 0; // Disabled - 0: Off, 1: On
      this.AnalyzerShowPostProcessing = bf.binaryReader.readFloat32() || 0; // Disabled - 0: Off, 1: On
      this.AnalyzerShowSidechain = bf.binaryReader.readFloat32() || 0; // Disabled - 0: Off, 1: On
      this.AnalyzerRange = bf.binaryReader.readFloat32() || 0; // Analyzer Range in dB. 0.0: 60dB, 1.0: 90dB, 2.0: 120dB
      this.AnalyzerResolution = bf.binaryReader.readFloat32() || 0; // Analyzer Resolution. 0.0: Low, 1.0: Medium, 2.0: High, 3.00: Maximum
      this.AnalyzerSpeed = bf.binaryReader.readFloat32() || 0; // Analyzer Speed. 0.0: Very Slow, 1.0: Slow, 2.0: Medium, 3.0 Fast, 4.0: Very Fast
      this.AnalyzerTilt = bf.binaryReader.readFloat32() || 0; // Analyzer Tilt in dB/oct. 0.0: 0.0, 1.0: 1.5, 2.0: 3.0, 3.0: 4.5, 4.0: 6.0
      this.AnalyzerFreeze = bf.binaryReader.readFloat32() || 0; // 0: Off, 1: On
      this.SpectrumGrab = bf.binaryReader.readFloat32() || 0; // Enabled
      this.DisplayRange = bf.binaryReader.readFloat32() || 0; // 12dB
      this.ReceiveMidi = bf.binaryReader.readFloat32() || 0; // Enabled
      this.SoloBand = bf.binaryReader.readFloat32() || 0; // -1
      this.SoloGain = bf.binaryReader.readFloat32() || 0; // 0.00
    } catch (e) {
      console.error("Error reading additional floats:", e);
    }

    // check if mid/side
    if (this.ChannelMode === ProQ2ChannelMode.MidSide) {
      this.Bands.forEach(band => (band.ChannelMode = ProQ2ChannelMode.MidSide));
    }

    return true;
  }

  public writeFFP(): Uint8Array | undefined {
    const bf = new BinaryFile(undefined, ByteOrder.LittleEndian);
    if (!bf.binaryWriter) return undefined;

    // Write the header
    bf.binaryWriter.writeString("FQ2p");
    bf.binaryWriter.writeUInt32(this.Version);

    // Write the bands content
    const bandsContent = this.getBandsContent();
    if (!bandsContent) return undefined;

    bf.binaryWriter.writeBytes(bandsContent);
    const buffer = bf.binaryWriter.getBuffer();
    return buffer ? new Uint8Array(buffer) : undefined;
  }

  private getBandsContent(): Uint8Array | undefined {
    const bf = new BinaryFile(undefined, ByteOrder.LittleEndian);
    if (!bf.binaryWriter) return undefined;

    // write total parameter count
    // 24 bands with 7 parameters each = 168
    // pluss the 22 parameters at the end
    bf.binaryWriter.writeUInt32(24 * 7 + 22);

    for (let i = 0; i < 24; i++) {
      if (i < this.Bands.length) {
        const band = this.Bands[i];
        bf.binaryWriter.writeFloat32(band.Enabled ? 1 : 2);
        bf.binaryWriter.writeFloat32(
          FabfilterProQBase.freqConvert(band.Frequency)
        );
        bf.binaryWriter.writeFloat32(band.Gain);
        bf.binaryWriter.writeFloat32(FabfilterProQBase.qConvert(band.Q));
        bf.binaryWriter.writeFloat32(band.Shape);
        bf.binaryWriter.writeFloat32(band.Slope);
        bf.binaryWriter.writeFloat32(band.StereoPlacement);
      } else {
        bf.binaryWriter.writeFloat32(2);
        bf.binaryWriter.writeFloat32(FabfilterProQBase.freqConvert(1000));
        bf.binaryWriter.writeFloat32(0);
        bf.binaryWriter.writeFloat32(FabfilterProQBase.qConvert(1));
        bf.binaryWriter.writeFloat32(ProQ2Shape.Bell);
        bf.binaryWriter.writeFloat32(ProQ2Slope.Slope24dB_oct);
        bf.binaryWriter.writeFloat32(ProQ2StereoPlacement.Stereo);
      }
    }

    bf.binaryWriter.writeFloat32(this.ProcessingMode);
    bf.binaryWriter.writeFloat32(this.ProcessingResolution);
    bf.binaryWriter.writeFloat32(this.ChannelMode);
    bf.binaryWriter.writeFloat32(this.GainScale);
    bf.binaryWriter.writeFloat32(this.OutputLevel);
    bf.binaryWriter.writeFloat32(this.OutputPan);
    bf.binaryWriter.writeFloat32(this.ByPass);
    bf.binaryWriter.writeFloat32(this.OutputInvertPhase);
    bf.binaryWriter.writeFloat32(this.AutoGain);

    bf.binaryWriter.writeFloat32(this.AnalyzerShowPreProcessing);
    bf.binaryWriter.writeFloat32(this.AnalyzerShowPostProcessing);
    bf.binaryWriter.writeFloat32(this.AnalyzerShowSidechain);
    bf.binaryWriter.writeFloat32(this.AnalyzerRange);
    bf.binaryWriter.writeFloat32(this.AnalyzerResolution);
    bf.binaryWriter.writeFloat32(this.AnalyzerSpeed);
    bf.binaryWriter.writeFloat32(this.AnalyzerTilt);
    bf.binaryWriter.writeFloat32(this.AnalyzerFreeze);
    bf.binaryWriter.writeFloat32(this.SpectrumGrab);
    bf.binaryWriter.writeFloat32(this.DisplayRange);
    bf.binaryWriter.writeFloat32(this.ReceiveMidi);
    bf.binaryWriter.writeFloat32(this.SoloBand);
    bf.binaryWriter.writeFloat32(this.SoloGain);

    const buffer = bf.binaryWriter.getBuffer();
    return buffer ? new Uint8Array(buffer) : undefined;
  }

  protected initCompChunkData(): void {
    if (this.FXP) {
      this.setCompChunkDataFromFXP(this.FXP);
      return;
    }

    const bf = new BinaryFile(undefined, ByteOrder.LittleEndian);
    if (!bf.binaryWriter) return;

    bf.binaryWriter.writeString("FabF");
    bf.binaryWriter.writeUInt32(this.Version);

    const presetName =
      this.getStringParameter("PresetName") ?? "Default Setting";
    bf.binaryWriter.writeUInt32(presetName.length);
    bf.binaryWriter.writeString(presetName);
    bf.binaryWriter.writeUInt32(0);

    const bandsContent = this.getBandsContent();
    if (bandsContent) {
      bf.binaryWriter.writeBytes(bandsContent);
    }

    bf.binaryWriter.writeInt32(1);
    bf.binaryWriter.writeInt32(1);

    const buffer = bf.binaryWriter.getBuffer();
    this.CompChunkData = buffer ? new Uint8Array(buffer) : new Uint8Array();
  }

  protected initContChunkData(): void {
    if (this.FXP) return;

    const bf = new BinaryFile(undefined, ByteOrder.LittleEndian);
    if (!bf.binaryWriter) return;

    bf.binaryWriter.writeString("FFed");
    bf.binaryWriter.writeFloat32(0.0);
    bf.binaryWriter.writeFloat32(1.0);

    const buffer = bf.binaryWriter.getBuffer();
    this.ContChunkData = buffer ? new Uint8Array(buffer) : new Uint8Array();
  }

  protected preparedForWriting(): boolean {
    this.initCompChunkData();
    this.initContChunkData();
    this.initInfoXml();
    this.calculateBytePositions();
    return true;
  }
}
