import { BinaryFile, ByteOrder } from "../binary/BinaryFile";
import { FabFilterProQBand, FabFilterProQBase } from "./FabFilterProQBase";
import { FxChunkSet, FXP, FxProgram, FxProgramSet, FxSet } from "./FXP"; // Added FxSet, FxProgram
import { VstClassIDs } from "./VstClassIDs";
import { ParameterType } from "./VstPreset";

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

export class ProQ3Band implements FabFilterProQBand {
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
    this.Frequency = FabFilterProQBase.freqConvert(1000); // value range 10.0 -> 30000.0 Hz
    this.Gain = 0; // + or - value in dB
    this.DynamicRange = 0; // + or - value in dB
    this.DynamicThreshold = 0; // 1 = auto, or value in dB
    this.Q = FabFilterProQBase.qConvert(1); // value range 0.025 -> 40.00
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

export class FabFilterProQ3 extends FabFilterProQBase {
  Bands: ProQ3Band[] = [];
  Version: number = 4;
  ParameterCount: number = 334;
  UnknownParameters: number[] = [];

  constructor() {
    super();
    this.Version = 4;
    this.Vst3ClassID = VstClassIDs.FabFilterProQ3;
    this.PlugInCategory = "Fx|EQ";
    this.PlugInName = "FabFilter Pro-Q 3";
    this.PlugInVendor = "FabFilter";
  }

  public addDefaultUnknownParameters(): void {
    // Note, even if a DAW adds all these default parameters when saving a FFP
    // they does not seem to be needed when saving the FXP

    // first 24 float parameters seems to normally be included
    this.UnknownParameters = [
      0.0, 1.0, 1.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 1.0, 1.0, -1.0, 1.0, 2.0,
      2.0, 3.0, 0.0, 1.0, 1.0, 2.0, 0.0, 0.0,
    ];

    // the second 24 seems to be optional and always 0
    for (let i = 0; i < 24; i++) {
      this.UnknownParameters.push(0.0);
    }
  }

  public initFromParameters(parameters?: number[], isIEEE = true): void {
    if (parameters) {
      this.initFromParameterArray(parameters, isIEEE);
      return;
    }

    if (this.FXP?.content) {
      let chunkData: Uint8Array | undefined;
      let shouldHaveFXPChunkData = false; // Keep track if chunk data was expected

      // Check for FxSet with programs
      if (
        this.FXP.content instanceof FxSet &&
        this.FXP.content.Programs?.length > 0
      ) {
        const program = this.FXP.content.Programs[0];
        if (program.Parameters) {
          // Parameters from FXP are in IEEE format (0.0 - 1.0)
          this.initFromParameterArray([...program.Parameters], true);
          return; // Parameters handled, exit
        }
      }
      // Check for FxProgram with parameters
      else if (
        this.FXP.content instanceof FxProgram &&
        this.FXP.content.NumParameters > 0
      ) {
        const paramArray = this.FXP.content.Parameters;
        if (paramArray) {
          // Parameters from FXP are in IEEE format (0.0 - 1.0)
          this.initFromParameterArray([...paramArray], true);
          return; // Parameters handled, exit
        }
      }
      // Check for FxProgramSet (chunk data expected)
      else if (this.FXP.content instanceof FxProgramSet) {
        shouldHaveFXPChunkData = true;
        chunkData = this.FXP.content.ChunkData;
      }
      // Check for FxChunkSet (chunk data expected)
      else if (this.FXP.content instanceof FxChunkSet) {
        shouldHaveFXPChunkData = true;
        chunkData = this.FXP.content.ChunkData;
      }

      // Process chunk data if found
      if (chunkData) {
        this.readFabFilterBinaryState(chunkData);
      } else {
        // Only warn if chunk data was expected but not found
        if (shouldHaveFXPChunkData) {
          console.warn("FXP content does not contain chunk data.");
        }
      }
    } else if (this.Parameters) {
      const compChunkData = this.CompChunkData;
      if (compChunkData) {
        if (this.readFabFilterBinaryState(compChunkData)) {
          // Successfully read from FabFilter Binary State from CompChunkData
          return;
        }
      }

      // if we get here, try to use the Parameters that have been added to the preset
      // and treat them as floats
      const floatParameters: number[] = [];
      for (const [_key, param] of this.Parameters) {
        if (param.Type === ParameterType.Number && param.Value !== undefined) {
          floatParameters.push(param.Value as number);
        }
      }

      this.initFromParameterArray(floatParameters, false);
    }
  }

  private static convert2FabFilterProQ3Floats(
    ieeeFloatParameters: number[]
  ): number[] {
    const floatArray: number[] = [];
    let counter = 0;
    const expectedBandParams = 13; // Based on initFromParameterArray

    for (let i = 0; i < 24; i++) {
      if (counter + expectedBandParams > ieeeFloatParameters.length) {
        // Not enough parameters for a full band, fill with defaults or break
        // For simplicity, we'll fill remaining expected slots with defaults
        // matching the writeFFP logic for empty bands
        floatArray.push(0); // Enabled = false
        floatArray.push(1); // unknown 1
        floatArray.push(FabFilterProQBase.freqConvert(1000)); // Frequency
        floatArray.push(0); // Gain
        floatArray.push(0); // Dynamic Range
        floatArray.push(1); // unknown 3 (matching writeFFP)
        floatArray.push(1); // Dynamic Threshold (1 = auto)
        floatArray.push(FabFilterProQBase.qConvert(1)); // Q
        floatArray.push(ProQ3Shape.Bell); // Shape
        floatArray.push(ProQ3Slope.Slope24dB_oct); // Slope
        floatArray.push(ProQ3StereoPlacement.Stereo); // Stereo Placement
        floatArray.push(1); // unknown 5 (matching writeFFP)
        floatArray.push(0); // unknown 6 (matching writeFFP)
        continue; // Move to next band index
      }

      // Enabled
      floatArray.push(ieeeFloatParameters[counter++]); // Directly use 0 or 1
      // unknown 1
      floatArray.push(1.0); // Assuming unknown1 is always 1.0 based on writeFFP
      counter++; // Skip the input parameter corresponding to unknown1

      // Frequency
      floatArray.push(
        FabFilterProQBase.ieeeFloatToFrequencyFloat(
          ieeeFloatParameters[counter++]
        )
      );
      // Gain (-30 to +30)
      floatArray.push(ieeeFloatParameters[counter++] * 60 - 30);
      // Dynamic Range (-30 to +30)
      floatArray.push(ieeeFloatParameters[counter++] * 60 - 30);
      // unknown 3
      floatArray.push(1.0); // Assuming unknown3 is always 1.0 based on writeFFP
      counter++; // Skip the input parameter corresponding to unknown3
      // Dynamic Threshold (0 to 1, where 1 might mean auto)
      floatArray.push(ieeeFloatParameters[counter++]);
      // Q (0.025 to 40.0) -> internal float
      floatArray.push(ieeeFloatParameters[counter++]); // Q is already 0-1, qConvertBack expects 0-1

      // Shape (0 to 8)
      const shapeRaw = ieeeFloatParameters[counter++];
      floatArray.push(shapeRaw * ProQ3Shape.FlatTilt);
      // Slope (0 to 9)
      const slopeRaw = ieeeFloatParameters[counter++];
      floatArray.push(slopeRaw * ProQ3Slope.SlopeBrickwall);
      // Stereo Placement (0 to 4)
      const stereoPlacementRaw = ieeeFloatParameters[counter++];
      floatArray.push(stereoPlacementRaw * ProQ3StereoPlacement.Side);

      // unknown 5
      floatArray.push(1.0); // Assuming unknown5 is always 1.0 based on writeFFP
      counter++; // Skip the input parameter corresponding to unknown5
      // unknown 6
      floatArray.push(0.0); // Assuming unknown6 is always 0.0 based on writeFFP
      counter++; // Skip the input parameter corresponding to unknown6
    }

    // Handle remaining parameters (UnknownParameters)
    if (counter < ieeeFloatParameters.length) {
      // Assuming remaining parameters are direct floats (0-1)
      floatArray.push(...ieeeFloatParameters.slice(counter));
    }

    return floatArray;
  }

  private initFromParameterArray(parameters: number[], isIEEE = true): void {
    // Convert IEEE parameters to FabFilter values if needed
    const floatArray = isIEEE
      ? FabFilterProQ3.convert2FabFilterProQ3Floats(parameters)
      : parameters;

    this.Bands = [];
    this.UnknownParameters = [];
    let index = 0;
    const expectedBandParams = 13;
    for (let i = 0; i < 24; i++) {
      // Check against the potentially converted floatArray length
      if (index + expectedBandParams > floatArray.length) {
        break;
      }

      const band = new ProQ3Band();

      // Parameters are now always in FabFilter format in floatArray
      band.Enabled = floatArray[index++] === 1;
      index++; // Skip unknown1 (parameter 2)

      band.Frequency = FabFilterProQBase.freqConvertBack(floatArray[index++]); // parameter 3
      band.Gain = floatArray[index++]; // parameter 4
      band.DynamicRange = floatArray[index++]; // parameter 5
      index++; // Skip unknown3 (parameter 6)
      band.DynamicThreshold = floatArray[index++]; // parameter 7
      band.Q = FabFilterProQBase.qConvertBack(floatArray[index++]); // parameter 8

      // parameter 9
      const shapeRaw = floatArray[index++];
      // The floatArray already contains the direct enum value (0-8)
      const shapeValue = shapeRaw;
      if (shapeValue >= ProQ3Shape.Bell && shapeValue <= ProQ3Shape.FlatTilt) {
        band.Shape = shapeValue;
      } else {
        band.Shape = ProQ3Shape.Bell;
      }

      // parameter 10
      const slopeRaw = floatArray[index++];
      // The floatArray already contains the direct enum value (0-9)
      const slopeValue = slopeRaw;
      if (
        slopeValue >= ProQ3Slope.Slope6dB_oct &&
        slopeValue <= ProQ3Slope.SlopeBrickwall
      ) {
        band.Slope = slopeValue;
      } else {
        band.Slope = ProQ3Slope.Slope24dB_oct;
      }

      // parameter 11
      const stereoPlacementRaw = floatArray[index++];
      // The floatArray already contains the direct enum value (0-4)
      const stereoPlacementValue = stereoPlacementRaw;
      if (
        stereoPlacementValue >= ProQ3StereoPlacement.Left &&
        stereoPlacementValue <= ProQ3StereoPlacement.Side
      ) {
        band.StereoPlacement = stereoPlacementValue;
      } else {
        band.StereoPlacement = ProQ3StereoPlacement.Stereo;
      }

      index += 2; // Skip unknown5 (parameter 12) and unknown6 (parameter 13)
      this.Bands.push(band);
    }

    // Handle remaining parameters from floatArray
    if (index < floatArray.length) {
      this.UnknownParameters = floatArray.slice(index);
    }
  }

  readFFPInternal(bf: BinaryFile): boolean {
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
        band.Frequency = FabFilterProQBase.freqConvertBack(freq);

        // actual gain in dB
        const gain = bf.binaryReader.readFloat32() || 0;
        band.Gain = gain;

        band.DynamicRange = bf.binaryReader.readFloat32() || 0;
        bf.binaryReader.readFloat32(); // Skip unknown3

        band.DynamicThreshold = bf.binaryReader.readFloat32() || 0;

        const q = bf.binaryReader.readFloat32() || 0;
        band.Q = FabFilterProQBase.qConvertBack(q);

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
          console.debug(`Invalid FFP header. Expected 'FQ3p', got '${header}'`);
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

        const freq = FabFilterProQBase.freqConvert(band.Frequency);
        bf.binaryWriter.writeFloat32(freq);

        bf.binaryWriter.writeFloat32(band.Gain);
        bf.binaryWriter.writeFloat32(band.DynamicRange);
        bf.binaryWriter.writeFloat32(1); // unknown 3
        bf.binaryWriter.writeFloat32(band.DynamicThreshold);

        const q = FabFilterProQBase.qConvert(band.Q);
        bf.binaryWriter.writeFloat32(q);

        bf.binaryWriter.writeFloat32(band.Shape);
        bf.binaryWriter.writeFloat32(band.Slope);
        bf.binaryWriter.writeFloat32(band.StereoPlacement);

        bf.binaryWriter.writeFloat32(1); // unknown 5
        bf.binaryWriter.writeFloat32(0); // unknown 6
      } else {
        bf.binaryWriter.writeFloat32(0);
        bf.binaryWriter.writeFloat32(1); // unknown 1
        bf.binaryWriter.writeFloat32(FabFilterProQBase.freqConvert(1000));
        bf.binaryWriter.writeFloat32(0); // gain
        bf.binaryWriter.writeFloat32(0); // dynamic range
        bf.binaryWriter.writeFloat32(1); // unknown 3
        bf.binaryWriter.writeFloat32(1); // dynamic threshold
        bf.binaryWriter.writeFloat32(FabFilterProQBase.qConvert(1));
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
