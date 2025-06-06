// SteinbergVstPreset.ts - Port of the C# SteinbergVstPreset class

import { BinaryWriter } from "../binary/BinaryWriter";
import { FXP } from "./FXP";
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

    // always ignore the Cont Chunk Data

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

  public setStartBytes(value: number): void {
    // add the 4 unknown bytes before the parameters start
    const bytes = new Uint8Array(4);
    new DataView(bytes.buffer).setUint32(0, value, true);
    this.Parameters.set(
      "StartBytes",
      new Parameter(
        "StartBytes",
        this.Parameters.size,
        bytes,
        ParameterType.Bytes
      )
    );
  }

  protected initCompChunkData(): void {
    const writer = new BinaryWriter(true); // Little Endian

    for (const parameter of this.Parameters.values()) {
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
            const asciiNameBytes = stringToAsciiUint8Array(parameter.Key);
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
    this.CompChunkData = buffer ? new Uint8Array(buffer) : new Uint8Array();
  }
}
