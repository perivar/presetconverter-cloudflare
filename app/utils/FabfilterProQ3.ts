import { BinaryFile, ByteOrder } from "./BinaryFile";
import { FabfilterProQBase } from "./FabfilterProQBase";
import { FxChunkSet, FXP, FxProgramSet } from "./FXP";
import { VstPreset } from "./VstPreset";

export enum ProQ3Shape {
  Bell = 0, // (default)
  LowShelf = 1,
  LowCut = 2,
  HighShelf = 3,
  HighCut = 4,
  Notch = 5,
  BandPass = 6,
  TiltShelf = 7,
  FlatTilt = 8,
}

export enum ProQ3Slope {
  Slope6dB_oct = 0,
  Slope12dB_oct = 1,
  Slope18dB_oct = 2,
  Slope24dB_oct = 3, // (default)
  Slope30dB_oct = 4,
  Slope36dB_oct = 5,
  Slope48dB_oct = 6,
  Slope72dB_oct = 7,
  Slope96dB_oct = 8,
  SlopeBrickwall = 9,
}

export enum ProQ3StereoPlacement {
  Left = 0,
  Right = 1,
  Stereo = 2, // (default)
  Mid = 3,
  Side = 4,
}

export class ProQ3Band {
  Enabled: boolean;
  Frequency: number; // value range 10.0 -> 30000.0 Hz
  Gain: number; // + or - value in dB
  DynamicRange: number; // + or - value in dB
  DynamicThreshold: number; // 1 = auto, or value in dB
  Q: number; // value range 0.025 -> 40.00
  Shape: ProQ3Shape;
  Slope: ProQ3Slope;
  StereoPlacement: ProQ3StereoPlacement;

  constructor() {
    this.Enabled = false;
    this.Frequency = FabfilterProQBase.freqConvert(1000); // value range 10.0 -> 30000.0 Hz
    this.Gain = 0; // + or - value in dB
    this.DynamicRange = 0; // + or - value in dB
    this.DynamicThreshold = 0; // 1 = auto, or value in dB
    this.Q = FabfilterProQBase.qConvert(1); // value range 0.025 -> 40.00
    this.Shape = ProQ3Shape.Bell;
    this.Slope = ProQ3Slope.Slope24dB_oct;
    this.StereoPlacement = ProQ3StereoPlacement.Stereo;
  }

  toString(): string {
    const shapeStr = ProQ3Shape[this.Shape];
    const slopeStr = ProQ3Slope[this.Slope];
    const placementStr = ProQ3StereoPlacement[this.StereoPlacement];

    return (
      `${this.Enabled ? "Enabled" : "Disabled"} | ${placementStr} | ` +
      `${shapeStr} @ ${this.Frequency.toFixed(1)} Hz | ` +
      `Gain: ${this.Gain.toFixed(1)} dB | Q: ${this.Q.toFixed(2)} | ` +
      `${slopeStr} | ` +
      `Dynamic Range: ${this.DynamicRange.toFixed(1)} dB | ` +
      `Threshold: ${this.DynamicThreshold === 1 ? "Auto" : this.DynamicThreshold.toFixed(1) + " dB"}`
    );
  }
}

export class FabfilterProQ3 extends FabfilterProQBase {
  Bands: ProQ3Band[] = [];
  Version: number = 4;
  ParameterCount: number = 334;
  UnknownParameters: number[] = [];

  constructor() {
    super();
    this.Version = 4;
    this.Vst3ClassID = VstPreset.VstClassIDs.FabFilterProQ3;
    this.PlugInCategory = "Fx|EQ";
    this.PlugInName = "FabFilter Pro-Q 3";
    this.PlugInVendor = "FabFilter";
  }

  public initFromParameters(parameters?: number[], isIEEE = true): void {
    if (parameters) {
      this.initFromParameterArray(parameters, isIEEE);
      return;
    }

    if (this.FXP?.content) {
      let chunkData: Uint8Array | undefined;

      if (this.FXP.content instanceof FxProgramSet) {
        chunkData = this.FXP.content.ChunkData;
      } else if (this.FXP.content instanceof FxChunkSet) {
        chunkData = this.FXP.content.ChunkData;
      }

      if (chunkData) {
        const bf = new BinaryFile(chunkData, ByteOrder.LittleEndian);
        try {
          const header = bf.binaryReader?.readString(4);
          if (header === "FFBS") {
            const ffbVersion = bf.binaryReader?.readUInt32();
            this.readFFPInternal(bf);
          } else {
            console.warn(
              `FXP chunk data header mismatch. Expected 'FFBS', got '${header}'`
            );
          }
        } catch (e) {
          console.error("Error reading FXP chunk data:", e);
        }
      } else {
        console.warn("FXP content does not contain chunk data.");
      }
    } else if (this.Parameters) {
      const floatParameters: number[] = [];
      const sortedKeys = Array.from(this.Parameters.keys()).sort((a, b) => {
        const numA = parseInt(a, 10);
        const numB = parseInt(b, 10);
        if (!isNaN(numA) && !isNaN(numB)) {
          return numA - numB;
        }
        return a.localeCompare(b);
      });

      for (const key of sortedKeys) {
        const paramValue = this.getNumberParameter(key);
        if (paramValue !== undefined) {
          floatParameters.push(paramValue);
        }
      }

      this.initFromParameterArray(floatParameters, false);
    }
  }

  private initFromParameterArray(parameters: number[], isIEEE = true): void {
    this.Bands = [];
    this.UnknownParameters = [];
    let index = 0;
    const expectedBandParams = 13;

    for (let i = 0; i < 24; i++) {
      if (index + expectedBandParams > parameters.length) {
        break;
      }

      const band = new ProQ3Band();

      band.Enabled = parameters[index++] === 1;
      index++; // Skip unknown1

      if (isIEEE) {
        band.Frequency = FabfilterProQBase.freqConvertBack(
          FabfilterProQBase.ieeeFloatToFrequencyFloat(parameters[index++])
        );
        band.Gain = parameters[index++] * 60 - 30;
        band.DynamicRange = parameters[index++] * 60 - 30;
        index++;
        band.DynamicThreshold = parameters[index++];
        band.Q = FabfilterProQBase.qConvertBack(parameters[index++]);
      } else {
        band.Frequency = FabfilterProQBase.freqConvertBack(parameters[index++]);
        band.Gain = parameters[index++];
        band.DynamicRange = parameters[index++];
        index++;
        band.DynamicThreshold = parameters[index++];
        band.Q = FabfilterProQBase.qConvertBack(parameters[index++]);
      }

      const shapeRaw = parameters[index++];
      const shapeValue = Math.round(
        shapeRaw * (isIEEE ? ProQ3Shape.FlatTilt : 1)
      );
      if (shapeValue >= ProQ3Shape.Bell && shapeValue <= ProQ3Shape.FlatTilt) {
        band.Shape = shapeValue;
      } else {
        band.Shape = ProQ3Shape.Bell;
      }

      const slopeRaw = parameters[index++];
      const slopeValue = Math.round(
        slopeRaw * (isIEEE ? ProQ3Slope.SlopeBrickwall : 1)
      );
      if (
        slopeValue >= ProQ3Slope.Slope6dB_oct &&
        slopeValue <= ProQ3Slope.SlopeBrickwall
      ) {
        band.Slope = slopeValue;
      } else {
        band.Slope = ProQ3Slope.Slope24dB_oct;
      }

      const stereoPlacementRaw = parameters[index++];
      const stereoPlacementValue = Math.round(
        stereoPlacementRaw * (isIEEE ? ProQ3StereoPlacement.Side : 1)
      );
      if (
        stereoPlacementValue >= ProQ3StereoPlacement.Left &&
        stereoPlacementValue <= ProQ3StereoPlacement.Side
      ) {
        band.StereoPlacement = stereoPlacementValue;
      } else {
        band.StereoPlacement = ProQ3StereoPlacement.Stereo;
      }

      index += 2;
      this.Bands.push(band);
    }

    if (index < parameters.length) {
      this.UnknownParameters = parameters.slice(index);
    }
  }

  private readFFPInternal(bf: BinaryFile): boolean {
    if (!bf.binaryReader) return false;

    try {
      this.Version = bf.binaryReader.readUInt32();
      this.ParameterCount = bf.binaryReader.readUInt32();

      this.Bands = [];
      this.UnknownParameters = [];
      for (let i = 0; i < 24; i++) {
        const band = new ProQ3Band();

        band.Enabled = bf.binaryReader.readFloat32() === 1;
        bf.binaryReader.readFloat32(); // Skip unknown1

        const freq = bf.binaryReader.readFloat32() || 0;
        band.Frequency = FabfilterProQBase.freqConvertBack(freq);

        band.Gain = bf.binaryReader.readFloat32() || 0;
        band.DynamicRange = bf.binaryReader.readFloat32() || 0;
        bf.binaryReader.readFloat32(); // Skip unknown3
        band.DynamicThreshold = bf.binaryReader.readFloat32() || 0;

        const q = bf.binaryReader.readFloat32() || 0;
        band.Q = FabfilterProQBase.qConvertBack(q);

        const filterType = bf.binaryReader.readFloat32();
        if (
          filterType !== undefined &&
          filterType >= ProQ3Shape.Bell &&
          filterType <= ProQ3Shape.FlatTilt
        ) {
          band.Shape = filterType;
        } else {
          band.Shape = ProQ3Shape.Bell;
        }

        const filterSlope = bf.binaryReader.readFloat32();
        if (
          filterSlope !== undefined &&
          filterSlope >= ProQ3Slope.Slope6dB_oct &&
          filterSlope <= ProQ3Slope.SlopeBrickwall
        ) {
          band.Slope = filterSlope;
        } else {
          band.Slope = ProQ3Slope.Slope24dB_oct;
        }

        const filterStereoPlacement = bf.binaryReader.readFloat32();
        if (
          filterStereoPlacement !== undefined &&
          filterStereoPlacement >= ProQ3StereoPlacement.Left &&
          filterStereoPlacement <= ProQ3StereoPlacement.Side
        ) {
          band.StereoPlacement = filterStereoPlacement;
        } else {
          band.StereoPlacement = ProQ3StereoPlacement.Stereo;
        }

        bf.binaryReader.readFloat32(); // Skip unknown5
        bf.binaryReader.readFloat32(); // Skip unknown6

        this.Bands.push(band);
      }

      if (this.ParameterCount >= 13 * 24) {
        const expectedBandParamsTotal = 13 * 24;
        const remainingParameterCount =
          this.ParameterCount - expectedBandParamsTotal;

        for (let i = 0; i < remainingParameterCount; i++) {
          if (
            bf.binaryReader.getPosition() + 4 <=
            bf.binaryReader.getLength()
          ) {
            this.UnknownParameters.push(bf.binaryReader.readFloat32() || 0);
          } else {
            break;
          }
        }
      }
    } catch (e) {
      console.error("Error during ReadFFPInternal:", e);
      return false;
    }

    return true;
  }

  public readFFP(data: Uint8Array, doReadHeader = true): boolean {
    const bf = new BinaryFile(data, ByteOrder.LittleEndian);
    if (!bf.binaryReader) return false;

    if (doReadHeader) {
      try {
        const header = bf.binaryReader.readString(4);
        if (header !== "FQ3p") {
          console.error(`Invalid FFP header. Expected 'FQ3p', got '${header}'`);
          return false;
        }
      } catch (e) {
        console.error("Error reading FFP header:", e);
        return false;
      }
    }

    return this.readFFPInternal(bf);
  }

  public writeFFP(): Uint8Array | undefined {
    const bf = new BinaryFile(undefined, ByteOrder.LittleEndian);
    if (!bf.binaryWriter) return undefined;

    // Write the header
    bf.binaryWriter.writeString("FQ3p");
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
    // 24 bands with 13 parameters each = 312
    // pluss the optional parameters at the end
    bf.binaryWriter.writeUInt32(24 * 13 + this.UnknownParameters.length);

    for (let i = 0; i < 24; i++) {
      if (i < this.Bands.length) {
        const band = this.Bands[i];

        bf.binaryWriter.writeFloat32(band.Enabled ? 1 : 0);
        bf.binaryWriter.writeFloat32(1); // unknown 1

        const freq = FabfilterProQBase.freqConvert(band.Frequency);
        bf.binaryWriter.writeFloat32(freq);

        bf.binaryWriter.writeFloat32(band.Gain);
        bf.binaryWriter.writeFloat32(band.DynamicRange);
        bf.binaryWriter.writeFloat32(1); // unknown 3
        bf.binaryWriter.writeFloat32(band.DynamicThreshold);

        const q = FabfilterProQBase.qConvert(band.Q);
        bf.binaryWriter.writeFloat32(q);

        bf.binaryWriter.writeFloat32(band.Shape);
        bf.binaryWriter.writeFloat32(band.Slope);
        bf.binaryWriter.writeFloat32(band.StereoPlacement);

        bf.binaryWriter.writeFloat32(1); // unknown 5
        bf.binaryWriter.writeFloat32(0); // unknown 6
      } else {
        bf.binaryWriter.writeFloat32(0);
        bf.binaryWriter.writeFloat32(1); // unknown 1
        bf.binaryWriter.writeFloat32(FabfilterProQBase.freqConvert(1000));
        bf.binaryWriter.writeFloat32(0); // gain
        bf.binaryWriter.writeFloat32(0); // dynamic range
        bf.binaryWriter.writeFloat32(1); // unknown 3
        bf.binaryWriter.writeFloat32(1); // dynamic threshold
        bf.binaryWriter.writeFloat32(FabfilterProQBase.qConvert(1));
        bf.binaryWriter.writeFloat32(ProQ3Shape.Bell);
        bf.binaryWriter.writeFloat32(ProQ3Slope.Slope24dB_oct);
        bf.binaryWriter.writeFloat32(ProQ3StereoPlacement.Stereo);
        bf.binaryWriter.writeFloat32(1); // unknown 5
        bf.binaryWriter.writeFloat32(0); // unknown 6
      }
    }

    // write the remaining floats
    for (const fUnknown of this.UnknownParameters) {
      bf.binaryWriter.writeFloat32(fUnknown); // unknown
    }

    const buffer = bf.binaryWriter.getBuffer();
    return buffer ? new Uint8Array(buffer) : undefined;
  }

  public writeFXP(presetName: string): Uint8Array | undefined {
    const bf = new BinaryFile(undefined, ByteOrder.LittleEndian);
    if (!bf.binaryWriter) return undefined;

    // Write the header
    bf.binaryWriter.writeString("FFBS");
    bf.binaryWriter.writeUInt32(1);

    // Write the bands content
    const bandsContent = this.getBandsContent();
    if (bandsContent) {
      bf.binaryWriter.writeBytes(bandsContent);
    } else {
      console.warn("No bands content to write.");
    }

    // add bottom bytes which seems to be mandatory to make the preset actually active
    // if this is not added, the preset seems to load, but stays inactive
    bf.binaryWriter.writeString("FQ3p");
    bf.binaryWriter.writeUInt32(1);
    bf.binaryWriter.writeUInt32(presetName.length);
    bf.binaryWriter.writeString(presetName);
    bf.binaryWriter.writeUInt32(-1);
    bf.binaryWriter.writeUInt32(1);
    const pluginName = "Pro-Q";
    bf.binaryWriter.writeUInt32(pluginName.length);
    bf.binaryWriter.writeString(pluginName);

    // Retrieve the buffer and convert it to Uint8Array
    const buffer = bf.binaryWriter.getBuffer();
    if (!buffer) {
      console.error("Failed to get buffer from binary writer.");
      return undefined; // Explicitly return undefined if the buffer is not available
    }

    const rawUint8Array = new Uint8Array(buffer);
    return FXP.WriteRaw2FXP(rawUint8Array, "FQ3p");
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
    // this.initContChunkData();
    this.initInfoXml();
    this.calculateBytePositions();
    return true;
  }
}
