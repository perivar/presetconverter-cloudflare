import { BinaryFile, ByteOrder } from "./BinaryFile";
import { FabfilterProQBase } from "./FabfilterProQBase";
import { FxSet } from "./FXP";
import { ParameterType, VstPreset } from "./VstPreset";

export enum ProQShape {
  Bell = 0,
  LowShelf = 1,
  LowCut = 2,
  HighShelf = 3,
  HighCut = 4,
  Notch = 5,
}

export enum ProQLPHPSlope {
  Slope6dB_oct = 0,
  Slope12dB_oct = 1,
  Slope24dB_oct = 2,
  Slope48dB_oct = 3,
}

export enum ProQStereoPlacement {
  LeftOrMid = 0,
  RightOrSide = 1,
  Stereo = 2,
}

export enum ProQChannelMode {
  LeftRight = 0,
  MidSide = 1,
}

export class ProQBand {
  ChannelMode: ProQChannelMode;
  Frequency: number;
  Gain: number;
  Q: number;
  Shape: ProQShape;
  LPHPSlope: ProQLPHPSlope;
  StereoPlacement: ProQStereoPlacement;
  Enabled: boolean;

  constructor() {
    this.ChannelMode = ProQChannelMode.LeftRight;
    this.Frequency = FabfilterProQBase.freqConvert(1000);
    this.Gain = 0;
    this.Q = FabfilterProQBase.qConvert(1);
    this.Shape = ProQShape.Bell;
    this.LPHPSlope = ProQLPHPSlope.Slope24dB_oct;
    this.StereoPlacement = ProQStereoPlacement.Stereo;
    this.Enabled = false;
  }

  toString(): string {
    const shapeStr = ProQShape[this.Shape];
    const slopeStr = ProQLPHPSlope[this.LPHPSlope];
    const placementStr = ProQStereoPlacement[this.StereoPlacement];
    const channelStr = ProQChannelMode[this.ChannelMode];

    return (
      `${this.Enabled ? "Enabled" : "Disabled"} | ${channelStr} | ${placementStr} | ` +
      `${shapeStr} @ ${this.Frequency.toFixed(1)} Hz | ` +
      `Gain: ${this.Gain.toFixed(1)} dB | Q: ${this.Q.toFixed(2)} | ` +
      `${slopeStr}`
    );
  }
}

export class FabfilterProQ extends FabfilterProQBase {
  Bands: ProQBand[] = [];
  Version: number = 2;
  ParameterCount: number = 190;

  // Post Band Parameters
  OutputGain: number = 0;
  OutputPan: number = 0;
  DisplayRange: number = 0;
  ProcessMode: number = 0;
  ChannelMode: number = 0;
  Bypass: number = 0;
  ReceiveMidi: number = 0;
  Analyzer: number = 0;
  AnalyzerResolution: number = 0;
  AnalyzerSpeed: number = 0;
  SoloBand: number = -1;

  constructor() {
    super();
    this.Version = 2;
    this.Vst3ClassID = VstPreset.VstClassIDs.FabFilterProQ;
    this.PlugInCategory = "Fx|EQ";
    this.PlugInName = "FabFilter Pro-Q";
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
        // Parameters from FXP are in IEEE format (0.0 - 1.0)
        this.initFromParameterArray([...program.Parameters], true);
      }
    } else {
      // Init from internal Parameters map
      const floatParameters: number[] = [];
      if (this.Parameters) {
        // Sort parameters by key to ensure consistent order if keys are numeric strings
        const sortedKeys = Array.from(this.Parameters.keys()).sort((a, b) => {
          const numA = parseInt(a, 10);
          const numB = parseInt(b, 10);
          if (!isNaN(numA) && !isNaN(numB)) {
            return numA - numB;
          }
          return a.localeCompare(b);
        });

        for (const key of sortedKeys) {
          const paramValue = this.Parameters.get(key);
          if (paramValue?.Type === ParameterType.Number) {
            floatParameters.push(paramValue.Value as number);
          }
        }
      }
      // Call the internal method with extracted parameters, assuming they are NOT IEEE 0-1 range
      this.initFromParameterArray(floatParameters, false);
    }
  }

  private initFromParameterArray(parameters: number[], isIEEE = true): void {
    this.Bands = [];
    let index = 0;

    // Read in how many bands are enabled
    const numActiveBands = parameters[index++];

    for (let i = 0; i < 24; i++) {
      const band = new ProQBand();

      if (isIEEE) {
        // Convert IEEE parameters to FabFilter values
        band.Frequency = FabfilterProQBase.freqConvertBack(
          FabfilterProQBase.ieeeFloatToFrequencyFloat(parameters[index++])
        );
        band.Gain = parameters[index++] * 60 - 30; // Scale -30 to +30 dB
        band.Q = FabfilterProQBase.qConvertBack(parameters[index++]);
      } else {
        // Parameters are already in FabFilter format
        band.Frequency = FabfilterProQBase.freqConvertBack(parameters[index++]);
        band.Gain = parameters[index++];
        band.Q = FabfilterProQBase.qConvertBack(parameters[index++]);
      }

      // Filter type (shape)
      const filterType = Math.floor(parameters[index++] * (isIEEE ? 5 : 1));
      if (filterType >= 0 && filterType <= ProQShape.Notch) {
        band.Shape = filterType;
      } else {
        band.Shape = ProQShape.Bell;
      }

      // Filter slope
      const filterSlope = Math.floor(parameters[index++] * (isIEEE ? 3 : 1));
      if (filterSlope >= 0 && filterSlope <= ProQLPHPSlope.Slope48dB_oct) {
        band.LPHPSlope = filterSlope;
      } else {
        band.LPHPSlope = ProQLPHPSlope.Slope24dB_oct;
      }

      // Stereo placement
      const stereoPlacement = Math.floor(
        parameters[index++] * (isIEEE ? 2 : 1)
      );
      if (
        stereoPlacement >= 0 &&
        stereoPlacement <= ProQStereoPlacement.Stereo
      ) {
        band.StereoPlacement = stereoPlacement;
      } else {
        band.StereoPlacement = ProQStereoPlacement.Stereo;
      }

      index++; // Skip unknown parameter (always 1.0?)

      // Enable band if within active bands count
      band.Enabled = i < numActiveBands;
      this.Bands.push(band);
    }

    // Handle remaining parameters
    if (parameters.length > index) {
      this.OutputGain = parameters[index++];
      this.OutputPan = parameters[index++];
      this.DisplayRange = parameters[index++];
      this.ProcessMode = parameters[index++];
      this.ChannelMode = parameters[index++];
      this.Bypass = parameters[index++];
      this.ReceiveMidi = parameters[index++];
      this.Analyzer = parameters[index++];
      this.AnalyzerResolution = parameters[index++];
      this.AnalyzerSpeed = parameters[index++];
      this.SoloBand = parameters[index++];
    }

    // Update channel mode on bands if needed
    if (this.ChannelMode === ProQChannelMode.MidSide) {
      this.Bands.forEach(band => (band.ChannelMode = ProQChannelMode.MidSide));
    }
  }

  public readFFP(data: Uint8Array, doReadHeader = true): boolean {
    const bf = new BinaryFile(data, ByteOrder.LittleEndian);
    if (!bf.binaryReader) return false;

    if (doReadHeader) {
      const header = bf.binaryReader.readString(4);
      if (header !== "FPQr") return false;
    }

    this.Version = bf.binaryReader.readUInt32() || 0;
    this.ParameterCount = bf.binaryReader.readUInt32() || 0;

    // Read in how many bands are enabled
    const numActiveBands = bf.binaryReader.readFloat32() || 0;

    this.Bands = [];
    for (let i = 0; i < 24; i++) {
      const band = new ProQBand();

      const freq = bf.binaryReader.readFloat32() || 0;
      band.Frequency = FabfilterProQBase.freqConvertBack(freq);

      band.Gain = bf.binaryReader.readFloat32() || 0; // actual gain in dB

      const q = bf.binaryReader.readFloat32() || 0;
      band.Q = FabfilterProQBase.qConvertBack(q);

      // 0 - 5
      const filterType = bf.binaryReader.readFloat32();
      switch (filterType) {
        case ProQShape.Bell:
          band.Shape = ProQShape.Bell;
          break;
        case ProQShape.LowShelf:
          band.Shape = ProQShape.LowShelf;
          break;
        case ProQShape.LowCut:
          band.Shape = ProQShape.LowCut;
          break;
        case ProQShape.HighShelf:
          band.Shape = ProQShape.HighShelf;
          break;
        case ProQShape.HighCut:
          band.Shape = ProQShape.HighCut;
          break;
        case ProQShape.Notch:
          band.Shape = ProQShape.Notch;
          break;
        default:
          throw new Error(`Filter type is outside range: ${filterType}`);
      }

      // 0 = 6 dB/oct, 1 = 12 dB/oct, 2 = 24 dB/oct, 3 = 48 dB/oct
      const filterSlope = bf.binaryReader.readFloat32();
      switch (filterSlope) {
        case ProQLPHPSlope.Slope6dB_oct:
          band.LPHPSlope = ProQLPHPSlope.Slope6dB_oct;
          break;
        case ProQLPHPSlope.Slope12dB_oct:
          band.LPHPSlope = ProQLPHPSlope.Slope12dB_oct;
          break;
        case ProQLPHPSlope.Slope24dB_oct:
          band.LPHPSlope = ProQLPHPSlope.Slope24dB_oct;
          break;
        case ProQLPHPSlope.Slope48dB_oct:
          band.LPHPSlope = ProQLPHPSlope.Slope48dB_oct;
          break;
        default:
          throw new Error(`Filter slope is outside range: ${filterSlope}`);
      }

      // 0 = Left, 1 = Right, 2 = Stereo
      const filterStereoPlacement = bf.binaryReader.readFloat32();
      switch (filterStereoPlacement) {
        case ProQStereoPlacement.LeftOrMid:
          band.StereoPlacement = ProQStereoPlacement.LeftOrMid;
          break;
        case ProQStereoPlacement.RightOrSide:
          band.StereoPlacement = ProQStereoPlacement.RightOrSide;
          break;
        case ProQStereoPlacement.Stereo:
          band.StereoPlacement = ProQStereoPlacement.Stereo;
          break;
        default:
          throw new Error(
            `Filter stereo placement is outside range: ${filterStereoPlacement}`
          );
      }

      // always 1.0 ?
      const unknown = bf.binaryReader.readFloat32();

      // check if band is enabled
      if (numActiveBands > 0 && numActiveBands > i) {
        band.Enabled = true;
      }

      this.Bands.push(band);
    }

    // read the remaining floats
    try {
      this.OutputGain = bf.binaryReader.readFloat32() || 0; // -1 to 1 (- Infinity to +36 dB , 0 = 0 dB)
      this.OutputPan = bf.binaryReader.readFloat32() || 0; // -1 to 1 (0 = middle)
      this.DisplayRange = bf.binaryReader.readFloat32() || 0; // 0 = 6dB, 1 = 12dB, 2 = 30dB, 3 = 3dB
      this.ProcessMode = bf.binaryReader.readFloat32() || 0; // 0 = zero latency, 1 = lin.phase.low - medium - high - maximum
      this.ChannelMode = bf.binaryReader.readFloat32() || 0; // 0 = Left/Right, 1 = Mid/Side
      this.Bypass = bf.binaryReader.readFloat32() || 0; // 0 = No bypass
      this.ReceiveMidi = bf.binaryReader.readFloat32() || 0; // 0 = Enabled?
      this.Analyzer = bf.binaryReader.readFloat32() || 0; // 0 = Off, 1 = Pre, 2 = Post, 3 = Pre+Post
      this.AnalyzerResolution = bf.binaryReader.readFloat32() || 0; // 0 - 3 : low - medium[x] - high - maximum
      this.AnalyzerSpeed = bf.binaryReader.readFloat32() || 0; // 0 - 3 : very slow, slow, medium[x], fast
      this.SoloBand = bf.binaryReader.readFloat32() || 0; // -1
    } catch (e) {
      console.error("Error reading additional floats:", e);
    }

    // check if mid/side
    if (this.ChannelMode === 1) {
      this.Bands.forEach(b => (b.ChannelMode = ProQChannelMode.MidSide));
    }

    return true;
  }

  public writeFFP(): Uint8Array | undefined {
    const bf = new BinaryFile(undefined, ByteOrder.LittleEndian);
    if (!bf.binaryWriter) return undefined;

    // Write the header
    bf.binaryWriter.writeString("FPQr");
    bf.binaryWriter.writeUInt32(this.Version);

    // Write the bands content
    const bandsContent = this.getBandsContent();
    if (bandsContent) {
      bf.binaryWriter.writeBytes(bandsContent);
    } else {
      console.warn("No bands content to write.");
    }

    // Retrieve the buffer and convert it to Uint8Array
    const buffer = bf.binaryWriter.getBuffer();
    if (!buffer) {
      console.error("Failed to get buffer from binary writer.");
      return undefined; // Explicitly return undefined if the buffer is not available
    }

    return new Uint8Array(buffer);
  }

  private getBandsContent(): Uint8Array | undefined {
    const bf = new BinaryFile(undefined, ByteOrder.LittleEndian);
    if (!bf.binaryWriter) return undefined;

    // write total parameter count
    // 24 bands with 7 parameters each = 168
    // pluss enabled band count = 1
    // pluss the 11 parameters at the end
    bf.binaryWriter.writeUInt32(24 * 7 + 12);
    const enabledBandCount = this.Bands.filter(b => b.Enabled).length;
    bf.binaryWriter.writeFloat32(enabledBandCount);

    for (let i = 0; i < 24; i++) {
      if (i < this.Bands.length) {
        const band = this.Bands[i];

        const freq = FabfilterProQBase.freqConvert(band.Frequency);
        bf.binaryWriter.writeFloat32(freq);

        bf.binaryWriter.writeFloat32(band.Gain);

        const q = FabfilterProQBase.qConvert(band.Q);
        bf.binaryWriter.writeFloat32(q);

        bf.binaryWriter.writeFloat32(band.Shape);
        bf.binaryWriter.writeFloat32(band.LPHPSlope);
        bf.binaryWriter.writeFloat32(band.StereoPlacement);
        bf.binaryWriter.writeFloat32(1);
      } else {
        bf.binaryWriter.writeFloat32(FabfilterProQBase.freqConvert(1000));
        bf.binaryWriter.writeFloat32(0);
        bf.binaryWriter.writeFloat32(FabfilterProQBase.qConvert(1));
        bf.binaryWriter.writeFloat32(ProQShape.Bell);
        bf.binaryWriter.writeFloat32(ProQLPHPSlope.Slope24dB_oct);
        bf.binaryWriter.writeFloat32(ProQStereoPlacement.Stereo);
        bf.binaryWriter.writeFloat32(1);
      }
    }

    // write the remaining floats
    bf.binaryWriter.writeFloat32(this.OutputGain);
    bf.binaryWriter.writeFloat32(this.OutputPan);
    bf.binaryWriter.writeFloat32(this.DisplayRange);
    bf.binaryWriter.writeFloat32(this.ProcessMode);
    bf.binaryWriter.writeFloat32(this.ChannelMode);
    bf.binaryWriter.writeFloat32(this.Bypass);
    bf.binaryWriter.writeFloat32(this.ReceiveMidi);
    bf.binaryWriter.writeFloat32(this.Analyzer);
    bf.binaryWriter.writeFloat32(this.AnalyzerResolution);
    bf.binaryWriter.writeFloat32(this.AnalyzerSpeed);
    bf.binaryWriter.writeFloat32(this.SoloBand);

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

    bf.binaryWriter.writeUInt32(0); // unknown

    const bandsContent = this.getBandsContent();
    if (bandsContent) {
      bf.binaryWriter.writeBytes(bandsContent);
    }

    // add some unknown variables
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
