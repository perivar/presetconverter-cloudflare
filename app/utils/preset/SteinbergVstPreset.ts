// SteinbergVstPreset.ts - Port of the C# SteinbergVstPreset class

import { BinaryReader } from "../binary/BinaryReader";
import { BinaryWriter } from "../binary/BinaryWriter";
import { toHexEditorString } from "../StringUtils";
import { FXP } from "./FXP";
import { VstClassIDs } from "./VstClassIDs";
import { Parameter, ParameterType, VstPreset } from "./VstPreset";

// Helper function to encode string to ASCII Uint8Array
// (Replacing non-ASCII characters with '?')
function stringToAsciiUint8Array(str: string): Uint8Array {
  const bytes = new Uint8Array(str.length);
  for (let i = 0; i < str.length; i++) {
    const charCode = str.charCodeAt(i);
    bytes[i] = charCode > 127 ? 63 : charCode; // Replace non-ASCII with '?'
  }
  return bytes;
}

export class SteinbergVstPreset extends VstPreset {
  constructor(input?: Uint8Array | FXP) {
    super(input);
  }

  protected preparedForWriting(): boolean {
    // unless the Comp Chunk Data has already been set
    // set it here
    if (!this.hasCompChunkData()) {
      this.initCompChunkData();
    }

    // unless the Cont Chunk Data has already been set
    // set it here
    if (!this.hasContChunkData()) {
      this.initContChunkData();
    }

    // unless we should skip InfoXml or the Info Xml Data has already been set
    // set it here
    if (!this.doSkipInfoXml && !this.hasInfoXml()) {
      this.initInfoXml();
    }

    this.calculateBytePositions();
    return true;
  }

  // Reads parameters from the internal Parameters map populated by the base class constructor
  public initFromParameters(): void {
    // TODO: not implemented yet
  }

  protected readCompData(reader: BinaryReader, chunkSize: number): void {
    if (
      this.Vst3ClassID === VstClassIDs.SteinbergAmpSimulator ||
      this.Vst3ClassID === VstClassIDs.SteinbergAutoPan ||
      this.Vst3ClassID === VstClassIDs.SteinbergBrickwallLimiter ||
      this.Vst3ClassID === VstClassIDs.SteinbergCompressor ||
      this.Vst3ClassID === VstClassIDs.SteinbergDeEsser ||
      this.Vst3ClassID === VstClassIDs.SteinbergDeEsserNew ||
      this.Vst3ClassID === VstClassIDs.SteinbergDistortion ||
      this.Vst3ClassID === VstClassIDs.SteinbergDJEq ||
      this.Vst3ClassID === VstClassIDs.SteinbergDualFilter ||
      this.Vst3ClassID === VstClassIDs.SteinbergEnvelopeShaper ||
      this.Vst3ClassID === VstClassIDs.SteinbergEQ ||
      this.Vst3ClassID === VstClassIDs.SteinbergExpander ||
      this.Vst3ClassID === VstClassIDs.SteinbergFrequency ||
      this.Vst3ClassID === VstClassIDs.SteinbergGate ||
      this.Vst3ClassID === VstClassIDs.SteinbergGEQ10 ||
      this.Vst3ClassID === VstClassIDs.SteinbergLimiter ||
      this.Vst3ClassID === VstClassIDs.SteinbergMagnetoII ||
      this.Vst3ClassID === VstClassIDs.SteinbergMaximizer ||
      this.Vst3ClassID === VstClassIDs.SteinbergModMachine ||
      this.Vst3ClassID === VstClassIDs.SteinbergMonoDelay ||
      this.Vst3ClassID === VstClassIDs.SteinbergMorphFilter ||
      this.Vst3ClassID === VstClassIDs.SteinbergMultibandCompressor ||
      this.Vst3ClassID === VstClassIDs.SteinbergMultibandEnvelopeShaper ||
      this.Vst3ClassID === VstClassIDs.SteinbergNoiseGate ||
      this.Vst3ClassID === VstClassIDs.SteinbergOctaver ||
      this.Vst3ClassID === VstClassIDs.SteinbergPingPongDelay ||
      this.Vst3ClassID === VstClassIDs.SteinbergPitchCorrect ||
      this.Vst3ClassID === VstClassIDs.SteinbergStereoDelay ||
      this.Vst3ClassID === VstClassIDs.SteinbergStereoEnhancer ||
      this.Vst3ClassID === VstClassIDs.SteinbergStudioChorus ||
      this.Vst3ClassID === VstClassIDs.SteinbergStudioEQ ||
      this.Vst3ClassID === VstClassIDs.SteinbergTremolo ||
      this.Vst3ClassID === VstClassIDs.SteinbergTuner ||
      this.Vst3ClassID === VstClassIDs.SteinbergUV22HR ||
      this.Vst3ClassID === VstClassIDs.SteinbergVintageCompressor ||
      this.Vst3ClassID === VstClassIDs.SteinbergVSTDynamics ||
      this.Vst3ClassID === VstClassIDs.SteinbergRotary
    ) {
      const headerBytes = reader.readBytes(4);
      console.debug(
        `Found component header\n${toHexEditorString(headerBytes)}`
      );
      this.setBytesParameter(VstPreset.CHUNK_COMP_HEADER, headerBytes);

      // Read parameters until end of chunk
      let counter = 1;
      while (reader.getPosition() < this.CompDataEndPosition) {
        // read the null terminated string
        let paramName = "";
        let byte;
        while ((byte = reader.readUInt8()) !== 0) {
          paramName += String.fromCharCode(byte);
        }

        // read until 128 bytes have been read
        const remainingBytes = 128 - paramName.length - 1;
        reader.readBytes(remainingBytes);

        const paramIndex = reader.readInt32();
        const paramValue = new DataView(reader.readBytes(8).buffer).getFloat64(
          0,
          true
        );
        console.debug(
          `Found component parameter ${counter} ${paramName}, index: ${paramIndex}, value: ${paramValue}`
        );

        this.setNumberParameterWithIndex(
          `${VstPreset.CHUNK_COMP}${paramName}`,
          paramIndex,
          paramValue
        );
        counter++;
      }
    } else if (this.Vst3ClassID === VstClassIDs.SteinbergGrooveAgentONE) {
      const xmlContent = reader.readString(chunkSize);
      this.setStringParameterWithIndex("XmlContent", 1, xmlContent);
    } else if (
      this.Vst3ClassID === VstClassIDs.SteinbergGrooveAgentSE ||
      this.Vst3ClassID === VstClassIDs.SteinbergHALionSonicSE ||
      this.Vst3ClassID === VstClassIDs.SteinbergPadShop ||
      this.Vst3ClassID === VstClassIDs.SteinbergPrologue ||
      this.Vst3ClassID === VstClassIDs.SteinbergRetrologue ||
      this.Vst3ClassID === VstClassIDs.SteinbergSamplerTrack ||
      this.Vst3ClassID === VstClassIDs.SteinbergSpector ||
      this.Vst3ClassID === VstClassIDs.SteinbergVSTAmpRack
    ) {
      this.CompChunkData = reader.readBytes(chunkSize);
    } else if (this.Vst3ClassID === VstClassIDs.SteinbergREVerence) {
      const wavFilePath1 = this.readStringNullAndSkip(reader, "utf-16le", 1024);
      console.debug("Wave Path 1: %s", wavFilePath1);
      this.setStringParameterWithIndex("wave-file-path-1", 0, wavFilePath1);

      const wavCount = reader.readUInt32();
      console.debug("Wave count: %d", wavCount);
      this.setNumberParameterWithIndex("wave-count", 0, wavCount);

      const unknown = reader.readUInt32();
      console.debug("unknown: %d", unknown);

      let parameterCount = -1;
      if (wavCount > 0) {
        const wavFilePath2 = this.readStringNullAndSkip(
          reader,
          "utf-16le",
          1024
        );
        this.setStringParameterWithIndex("wave-file-path-2", 0, wavFilePath2);
        console.debug("Wave Path 2: %s", wavFilePath2);

        const wavFileName = this.readStringNullAndSkip(
          reader,
          "utf-16le",
          1024
        );
        this.setStringParameterWithIndex("wave-file-name", 0, wavFileName);
        console.debug("Wav filename: %s", wavFileName);

        const imageCount = reader.readUInt32();
        this.setNumberParameterWithIndex("image-count", 0, imageCount);
        console.debug("Image count: %d", imageCount);

        for (let i = 0; i < imageCount; i++) {
          // images
          const imagePath = this.readStringNullAndSkip(
            reader,
            "utf-16le",
            1024
          );
          this.setStringParameterWithIndex(
            `image-file-name-${i + 1}`,
            0,
            imagePath
          );
          console.debug(`Image ${i + 1}: ${imagePath}`);
        }

        parameterCount = reader.readInt32();
        this.setNumberParameterWithIndex("parameter-count", 0, parameterCount);
        console.debug("Parameter count: %d", parameterCount);
      }

      let parameterCounter = 0;
      while (reader.getPosition() < this.CompDataEndPosition) {
        parameterCounter++;

        if (parameterCount > 0 && parameterCounter > parameterCount) break;

        // read the null terminated string
        let parameterName = "";
        let byte;
        while ((byte = reader.readUInt8()) !== 0) {
          parameterName += String.fromCharCode(byte);
        }
        console.debug(`parameterName: [${parameterCounter}] ${parameterName}`);

        // read until 128 bytes have been read
        const ignore = reader.readBytes(128 - parameterName.length - 1);
        console.debug(`Ignored bytes length (REVerence): ${ignore.length}`);

        const parameterNumber = reader.readUInt32();
        console.debug("parameterNumber: %d", parameterNumber);

        // Note! For some reason bf.ReadDouble() doesn't work, neither with LittleEndian or BigEndian
        const parameterNumberValue = new DataView(
          reader.readBytes(8).buffer
        ).getFloat64(0, true);
        console.debug("parameterNumberValue: %d", parameterNumberValue);

        this.setNumberParameterWithIndex(
          parameterName,
          parameterNumber,
          parameterNumberValue
        );
      }
    } else if (this.Vst3ClassID === VstClassIDs.SteinbergStandardPanner) {
      // read floats
      this.setNumberParameterWithIndex("Unknown1", 1, reader.readFloat32());
      this.setNumberParameterWithIndex("Unknown2", 2, reader.readFloat32());

      // read ints
      this.setNumberParameterWithIndex("Unknown3", 3, reader.readUInt32());
      this.setNumberParameterWithIndex("Unknown4", 4, reader.readUInt32());
      this.setNumberParameterWithIndex("Unknown5", 5, reader.readUInt32());
    }
  }

  protected readContData(reader: BinaryReader, chunkSize: number): void {
    if (chunkSize > 0) {
      // Read 24 bytes header
      const headerBytes = reader.readBytes(24);
      console.debug(
        `Found controller header\n${toHexEditorString(headerBytes)}`
      );
      this.setBytesParameter(VstPreset.CHUNK_CONT_HEADER, headerBytes);

      // Read parameters until end of chunk
      let counter = 1;
      while (reader.getPosition() < this.ContDataEndPosition) {
        let paramName = "";
        let byte;
        while ((byte = reader.readUInt8()) !== 0) {
          paramName += String.fromCharCode(byte);
        }

        // read until 128 bytes have been read
        const remainingBytes = 128 - paramName.length - 1;
        reader.readBytes(remainingBytes);

        const paramIndex = reader.readInt32();
        const paramValue = new DataView(reader.readBytes(8).buffer).getFloat64(
          0,
          true
        );
        console.debug(
          `Found controller parameter ${counter} ${paramName}, index: ${paramIndex}, value: ${paramValue}`
        );

        this.setNumberParameterWithIndex(
          `${VstPreset.CHUNK_CONT}${paramName}`,
          paramIndex,
          paramValue
        );
        counter++;
      }
    } else {
      this.ContChunkData = reader.readBytes(chunkSize);
    }
  }

  public setCompChunkDataHeader(value: number): void {
    // add the 4 unknown bytes before the parameters start
    const bytes = new Uint8Array(4);
    new DataView(bytes.buffer).setUint32(0, value, true);
    this.Parameters.set(
      VstPreset.CHUNK_COMP_HEADER,
      new Parameter(VstPreset.CHUNK_COMP_HEADER, -1, bytes, ParameterType.Bytes)
    );
  }

  /** Utility method to convert a string to UTF-16LE null-terminated bytes
   * @param value - The input string.
   * @returns A Uint8Array containing the UTF-16LE encoded bytes with a null terminator.
   * @example an input of "VERSE3" will return the byte array: [56, 0, 69, 0, 82, 0, 83, 0, 69, 0, 51, 0, 0, 0]
   */
  public stringToUtf16LeNullTerminated(value: string): Uint8Array {
    const bytes = new Uint8Array((value.length + 1) * 2);
    let offset = 0;

    for (let i = 0; i < value.length; i++) {
      const codeUnit = value.charCodeAt(i);
      bytes[offset++] = codeUnit & 0xff; // low byte
      bytes[offset++] = (codeUnit >> 8) & 0xff; // high byte
    }

    // UTF-16 null terminator (00 00) is already zeroed
    return bytes;
  }

  private getParametersAsArrayBuffer(chunkType: string): ArrayBuffer {
    const writer = new BinaryWriter(true); // Little Endian

    for (const parameter of this.Parameters.values()) {
      if (!parameter.Key.startsWith(chunkType)) continue;

      switch (parameter.Type) {
        case ParameterType.Bytes:
          if (parameter.Value instanceof Uint8Array) {
            writer.writeBytes(parameter.Value);
          } else {
            console.warn(
              `Parameter ${parameter.Key} has type Bytes but value is not Uint8Array.`
            );
          }
          break;

        case ParameterType.Number:
          if (typeof parameter.Value === "number") {
            // Write Name (128 bytes, ASCII, null-padded)
            const nameBytes = new Uint8Array(128); // Initialized with zeros

            // remove the chunk type prefix from the name
            const paramName = parameter.Key.substring(chunkType.length);

            const asciiNameBytes = stringToAsciiUint8Array(paramName);
            const lengthToCopy = Math.min(asciiNameBytes.length, 128);
            nameBytes.set(asciiNameBytes.slice(0, lengthToCopy), 0);
            writer.writeBytes(nameBytes);

            // Write Index (int32)
            writer.writeInt32(parameter.Index);

            // Write Value (float64)
            writer.writeFloat64(parameter.Value);
          } else {
            console.warn(
              `Parameter ${parameter.Key} has type Number but value is not a number.`
            );
          }
          break;

        case ParameterType.String:
          if (typeof parameter.Value === "string") {
            // Write String (ASCII)
            const asciiStringBytes = stringToAsciiUint8Array(parameter.Value);
            writer.writeBytes(asciiStringBytes);
          } else {
            console.warn(
              `Parameter ${parameter.Key} has type String but value is not a string.`
            );
          }
          break;

        default:
          console.warn(
            `Unknown parameter type for ${parameter.Key}: ${parameter.Type}`
          );
          break; // Handle unknown types if necessary
      }
    }

    const buffer = writer.getBuffer();
    return buffer;
  }

  protected initCompChunkData(): void {
    const buffer = this.getParametersAsArrayBuffer(VstPreset.CHUNK_COMP);
    this.CompChunkData = buffer ? new Uint8Array(buffer) : new Uint8Array();
  }

  protected initContChunkData(): void {
    const buffer = this.getParametersAsArrayBuffer(VstPreset.CHUNK_CONT);
    this.ContChunkData = buffer ? new Uint8Array(buffer) : new Uint8Array();
  }
}
