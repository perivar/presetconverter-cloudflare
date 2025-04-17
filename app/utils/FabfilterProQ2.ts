import { BinaryFile, ByteOrder } from "./BinaryFile";
import { FabfilterProQBand, FabfilterProQBase } from "./FabfilterProQBase";
import { FxChunkSet, FxProgram, FxProgramSet, FxSet } from "./FXP"; // Added FxProgram, FxProgramSet, FxChunkSet
import { convertAndMaintainRatio } from "./Math"; // Added Math utils
import { VstClassIDs } from "./VstClassIDs";
import { ParameterType } from "./VstPreset";

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

export class ProQ2Band implements FabfilterProQBand {
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
    this.Vst3ClassID = VstClassIDs.FabFilterProQ2;
    this.PlugInCategory = "Fx|EQ";
    this.PlugInName = "FabFilter Pro-Q 2";
    this.PlugInVendor = "FabFilter";
  }

  public initFromParameters(parameters?: number[], isIEEE = true): void {
    if (parameters) {
      // Direct parameter array provided
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
          console.warn(
            "FXP content was expected to have chunk data, but none was found."
          );
        }
      }
    } else if (this.Parameters) {
      const compChunkData = this.CompChunkData;
      if (compChunkData) {
        if (this.readFabFilterBinaryState(compChunkData)) {
          // Successfully read from Fabfilter Binary State from CompChunkData
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

  // Added conversion function similar to ProQ and ProQ3
  private static convert2FabfilterProQ2Floats(
    ieeeFloatParameters: number[]
  ): number[] {
    const floatArray: number[] = [];
    let counter = 0;

    // Convert Band Parameters (24 bands * 8 params each)
    for (let i = 0; i < 24; i++) {
      // Enabled (Parameter 1) - Assuming 0/1 from IEEE
      floatArray.push(ieeeFloatParameters[counter++]); // Direct 0 or 1
      // Frequency (Parameter 2)
      floatArray.push(
        FabfilterProQBase.ieeeFloatToFrequencyFloat(
          ieeeFloatParameters[counter++]
        )
      );
      // Gain (Parameter 3)
      floatArray.push(ieeeFloatParameters[counter++] * 60 - 30); // -30 to +30
      // Q (Parameter 4)
      floatArray.push(ieeeFloatParameters[counter++]); // Direct 0-1 for qConvertBack
      // Shape (Parameter 5)
      floatArray.push(
        Math.floor(ieeeFloatParameters[counter++] * ProQ2Shape.TiltShelf)
      ); // 0-7
      // Slope (Parameter 6)
      floatArray.push(
        Math.floor(ieeeFloatParameters[counter++] * ProQ2Slope.Slope96dB_oct)
      ); // 0-8
      // Stereo Placement (Parameter 7)
      floatArray.push(
        Math.floor(ieeeFloatParameters[counter++] * ProQ2StereoPlacement.Stereo)
      ); // 0-2
      // Unknown/Skipped (Parameter 8)
      floatArray.push(1.0); // Placeholder value, matches ProQ1 write logic
      counter++; // Consume the 8th parameter from input
    }

    // Convert Global Parameters (22 params)
    try {
      // ProcessingMode (0-2)
      floatArray.push(
        convertAndMaintainRatio(ieeeFloatParameters[counter++], 0, 1, 0, 2)
      );
      // ProcessingResolution (0-4) - Based on writeFFP range
      floatArray.push(
        convertAndMaintainRatio(ieeeFloatParameters[counter++], 0, 1, 0, 4)
      );
      // ChannelMode (0-1)
      floatArray.push(ieeeFloatParameters[counter++]);
      // GainScale (0-1?) - Assuming 0-1 maps to 0-100%
      floatArray.push(ieeeFloatParameters[counter++]);
      // OutputLevel (-1 to 1)
      floatArray.push(
        convertAndMaintainRatio(ieeeFloatParameters[counter++], 0, 1, -1, 1)
      );
      // OutputPan (-1 to 1)
      floatArray.push(
        convertAndMaintainRatio(ieeeFloatParameters[counter++], 0, 1, -1, 1)
      );
      // ByPass (0-1)
      floatArray.push(ieeeFloatParameters[counter++]);
      // OutputInvertPhase (0-1)
      floatArray.push(ieeeFloatParameters[counter++]);
      // AutoGain (0-1)
      floatArray.push(ieeeFloatParameters[counter++]);
      // AnalyzerShowPreProcessing (0-1)
      floatArray.push(ieeeFloatParameters[counter++]);
      // AnalyzerShowPostProcessing (0-1)
      floatArray.push(ieeeFloatParameters[counter++]);
      // AnalyzerShowSidechain (0-1)
      floatArray.push(ieeeFloatParameters[counter++]);
      // AnalyzerRange (0-2)
      floatArray.push(
        convertAndMaintainRatio(ieeeFloatParameters[counter++], 0, 1, 0, 2)
      );
      // AnalyzerResolution (0-3)
      floatArray.push(
        convertAndMaintainRatio(ieeeFloatParameters[counter++], 0, 1, 0, 3)
      );
      // AnalyzerSpeed (0-4)
      floatArray.push(
        convertAndMaintainRatio(ieeeFloatParameters[counter++], 0, 1, 0, 4)
      );
      // AnalyzerTilt (0-4)
      floatArray.push(
        convertAndMaintainRatio(ieeeFloatParameters[counter++], 0, 1, 0, 4)
      );
      // AnalyzerFreeze (0-1)
      floatArray.push(ieeeFloatParameters[counter++]);
      // SpectrumGrab (0-1)
      floatArray.push(ieeeFloatParameters[counter++]);
      // DisplayRange (0-3) - Assuming same range as ProQ1
      floatArray.push(
        convertAndMaintainRatio(ieeeFloatParameters[counter++], 0, 1, 0, 3)
      );
      // ReceiveMidi (0-1)
      floatArray.push(ieeeFloatParameters[counter++]);
      // SoloBand (-1 to 23)
      floatArray.push(
        convertAndMaintainRatio(ieeeFloatParameters[counter++], 0, 1, -1, 23)
      );
      // SoloGain (0-1?) - Assuming 0-1 maps to 0dB
      floatArray.push(ieeeFloatParameters[counter++]);
    } catch (e) {
      console.error("Error converting remaining parameters:", e);
    }

    return floatArray;
  }

  private initFromParameterArray(parameters: number[], isIEEE = true): void {
    // Convert IEEE parameters to FabFilter values if needed
    const floatArray = isIEEE
      ? FabfilterProQ2.convert2FabfilterProQ2Floats(parameters)
      : parameters;

    this.Bands = [];
    let index = 0;

    for (let i = 0; i < 24; i++) {
      const band = new ProQ2Band();

      // Parameters are now always in FabFilter format in floatArray
      band.Enabled = floatArray[index++] === 1; // Param 1
      band.Frequency = FabfilterProQBase.freqConvertBack(floatArray[index++]); // Param 2
      band.Gain = floatArray[index++]; // Param 3
      band.Q = FabfilterProQBase.qConvertBack(floatArray[index++]); // Param 4

      // Shape (Param 5)
      const shapeValue = floatArray[index++];
      if (shapeValue >= ProQ2Shape.Bell && shapeValue <= ProQ2Shape.TiltShelf) {
        band.Shape = shapeValue;
      } else {
        band.Shape = ProQ2Shape.Bell; // Default
      }

      // Slope (Param 6)
      const slopeValue = floatArray[index++];
      if (
        slopeValue >= ProQ2Slope.Slope6dB_oct &&
        slopeValue <= ProQ2Slope.Slope96dB_oct
      ) {
        band.Slope = slopeValue;
      } else {
        band.Slope = ProQ2Slope.Slope24dB_oct; // Default
      }

      // Stereo Placement (Param 7)
      const stereoPlacementValue = floatArray[index++];
      if (
        stereoPlacementValue >= ProQ2StereoPlacement.LeftOrMid &&
        stereoPlacementValue <= ProQ2StereoPlacement.Stereo
      ) {
        band.StereoPlacement = stereoPlacementValue;
      } else {
        band.StereoPlacement = ProQ2StereoPlacement.Stereo; // Default
      }

      index++; // Skip unknown parameter (Param 8)

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

  readFFPInternal(bf: BinaryFile): boolean {
    if (!bf.binaryReader) return false;

    try {
      this.Version = bf.binaryReader.readUInt32() || 0;
      this.ParameterCount = bf.binaryReader.readUInt32() || 0;

      this.Bands = [];
      for (let i = 0; i < 24; i++) {
        const band = new ProQ2Band();

        // 1 = Enabled, 2 = Disabled
        band.Enabled = bf.binaryReader.readFloat32() === 1;

        const freq = bf.binaryReader.readFloat32() || 0;
        band.Frequency = FabfilterProQBase.freqConvertBack(freq);

        // actual gain in dB
        const gain = bf.binaryReader.readFloat32() || 0;
        band.Gain = gain;

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
            break; // Added missing break
          default:
            console.warn(
              `Filter type is outside range: ${filterType}. Defaulting to Bell.`
            );
            band.Shape = ProQ2Shape.Bell; // Default instead of throwing error
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
            console.warn(
              `Filter slope is outside range: ${filterSlope}. Defaulting to 24dB/oct.`
            );
            band.Slope = ProQ2Slope.Slope24dB_oct; // Default instead of throwing error
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
            console.warn(
              `Filter stereo placement is outside range: ${filterStereoPlacement}. Defaulting to Stereo.`
            );
            band.StereoPlacement = ProQ2StereoPlacement.Stereo; // Default instead of throwing error
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
        console.error("Error reading ProQ2 additional floats:", e);
        // Don't stop processing, just log the error
      }

      // check if mid/side
      if (this.ChannelMode === ProQ2ChannelMode.MidSide) {
        this.Bands.forEach(
          band => (band.ChannelMode = ProQ2ChannelMode.MidSide)
        );
      } else {
        this.Bands.forEach(
          band => (band.ChannelMode = ProQ2ChannelMode.LeftRight)
        );
      }
    } catch (e) {
      console.error("Error during ReadFFPInternal (ProQ2):", e);
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
        if (header !== "FQ2p") {
          console.debug(`Invalid FFP header. Expected 'FQ2p', got '${header}'`);
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
    bf.binaryWriter.writeString("FQ2p");
    bf.binaryWriter.writeUInt32(this.Version);

    // Write the bands content
    const bandsContent = this.getBandsContent();
    if (!bandsContent) {
      console.warn("No ProQ2 bands content to write.");
      return undefined; // Or handle as appropriate
    }

    bf.binaryWriter.writeBytes(bandsContent);
    const buffer = bf.binaryWriter.getBuffer();
    return buffer ? new Uint8Array(buffer) : undefined;
  }

  private getBandsContent(): Uint8Array | undefined {
    const bf = new BinaryFile(undefined, ByteOrder.LittleEndian);
    if (!bf.binaryWriter) return undefined;

    // write total parameter count (190 for ProQ2)
    bf.binaryWriter.writeUInt32(this.ParameterCount);

    // Write Band Parameters (24 bands * 7 params each)
    for (let i = 0; i < 24; i++) {
      if (i < this.Bands.length) {
        const band = this.Bands[i];
        bf.binaryWriter.writeFloat32(band.Enabled ? 1 : 2); // 1 = Enabled, 2 = Disabled
        bf.binaryWriter.writeFloat32(
          FabfilterProQBase.freqConvert(band.Frequency)
        );
        bf.binaryWriter.writeFloat32(band.Gain);
        bf.binaryWriter.writeFloat32(FabfilterProQBase.qConvert(band.Q));
        bf.binaryWriter.writeFloat32(band.Shape);
        bf.binaryWriter.writeFloat32(band.Slope);
        bf.binaryWriter.writeFloat32(band.StereoPlacement);
      } else {
        // Write default values for unused bands
        bf.binaryWriter.writeFloat32(2); // Disabled
        bf.binaryWriter.writeFloat32(FabfilterProQBase.freqConvert(1000));
        bf.binaryWriter.writeFloat32(0); // Gain
        bf.binaryWriter.writeFloat32(FabfilterProQBase.qConvert(1)); // Q
        bf.binaryWriter.writeFloat32(ProQ2Shape.Bell); // Shape
        bf.binaryWriter.writeFloat32(ProQ2Slope.Slope24dB_oct); // Slope
        bf.binaryWriter.writeFloat32(ProQ2StereoPlacement.Stereo); // Stereo Placement
      }
    }

    // Write Global Parameters (22 params)
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
