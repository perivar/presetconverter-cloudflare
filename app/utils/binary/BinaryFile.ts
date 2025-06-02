import { BinaryReader } from "./BinaryReader";
import { BinaryWriter } from "./BinaryWriter";

export enum ByteOrder {
  LittleEndian,
  BigEndian,
}

export class BinaryFile {
  public byteOrder: ByteOrder = ByteOrder.LittleEndian;
  public position: number = 0;
  public binaryReader?: BinaryReader = undefined;
  public binaryWriter?: BinaryWriter = undefined;

  constructor(
    values?: ArrayBuffer | Uint8Array,
    byteOrder: ByteOrder = ByteOrder.LittleEndian
  ) {
    if (values) {
      this.binaryReader = new BinaryReader(
        values,
        byteOrder == ByteOrder.LittleEndian
      );
    } else {
      this.binaryWriter = new BinaryWriter(byteOrder == ByteOrder.LittleEndian);
    }

    // Set position to the beginning of the stream.
    this.position = 0;

    this.byteOrder = byteOrder;
  }

  /**
   * Reads a null-terminated string from the reader.
   * @param reader The BinaryReader instance.
   * @param encoding The text encoding to use (default: "utf-8").
   * @returns The string read.
   */
  static readStringNull(
    reader: BinaryReader,
    encoding: string = "utf-8"
  ): string {
    const decoder = new TextDecoder(encoding);
    const bytes: number[] = [];

    let byte = reader.readInt8();
    while (byte !== 0) {
      bytes.push(byte);
      byte = reader.readInt8();
    }

    return decoder.decode(new Uint8Array(bytes));
  }

  readStringNull(encoding: string = "utf-8"): string {
    if (!this.binaryReader) throw new Error("binaryReader is null");
    const value = BinaryFile.readStringNull(this.binaryReader, encoding);
    this.position = this.binaryReader.getPosition();
    return value;
  }

  /**
   * Writes a null-terminated string to the writer.
   * @param writer The BinaryWriter instance.
   * @param text The string to write.
   * @returns The number of bytes written (including the null terminator).
   */
  static writeStringNull(writer: BinaryWriter, text: string): number {
    if (!text) throw new Error("Text is null");

    const encoder = new TextEncoder();
    const contentBytes = encoder.encode(text);

    contentBytes.forEach(byte => writer.writeInt8(byte));
    writer.writeInt8(0); // Write null terminator

    return contentBytes.length + 1;
  }

  writeStringNull(text: string): number {
    if (!this.binaryWriter) throw new Error("binaryWriter is null");
    return BinaryFile.writeStringNull(this.binaryWriter, text);
  }

  /**
   * Writes a null-terminated string to the writer, padding with zeros to a total length.
   * @param writer The BinaryWriter instance.
   * @param text The string to write.
   * @param totalCount The total number of bytes the written string (including null terminator and padding) should occupy.
   * @returns The total number of bytes written (equal to totalCount).
   */
  static writeStringPadded(
    writer: BinaryWriter,
    text: string,
    totalCount: number
  ): number {
    const count = BinaryFile.writeStringNull(writer, text);
    const remaining = totalCount - count;

    for (let i = 0; i < remaining; i++) {
      writer.writeInt8(0); // Pad with zeroes
    }

    return totalCount;
  }

  writeStringPadded(text: string, totalCount: number): number {
    if (!this.binaryWriter) throw new Error("binaryWriter is null");
    return BinaryFile.writeStringPadded(this.binaryWriter, text, totalCount);
  }

  /**
   * Writes a string to the writer, converting it to a Uint8Array of a given length.
   * If the string is shorter than the specified length, the array will be padded with zeros.
   * @param writer The BinaryWriter instance.
   * @param str The string to write.
   * @param length The desired length of the Uint8Array.
   * @returns The number of bytes written (equal to length).
   */
  static writeString(
    writer: BinaryWriter,
    str: string,
    length: number
  ): number {
    const byteArray = BinaryFile.stringToByteArray(str, length);
    byteArray.forEach(byte => writer.writeInt8(byte));
    return length;
  }

  writeString(str: string, length: number): number {
    if (!this.binaryWriter) throw new Error("binaryWriter is null");
    return BinaryFile.writeString(this.binaryWriter, str, length);
  }

  /**
   * Reads a 16-bit signed integer from the reader using the specified byte order.
   * Temporarily sets the reader's endianness for this operation.
   * @param reader The BinaryReader instance.
   * @param byteOrder The byte order (endianness) to use for reading.
   * @returns The 16-bit signed integer read.
   */
  static readInt16(reader: BinaryReader, byteOrder: ByteOrder): number {
    const originalEndian = reader.isLittleEndian;
    reader.isLittleEndian = byteOrder === ByteOrder.LittleEndian;
    try {
      return reader.readInt16();
    } finally {
      reader.isLittleEndian = originalEndian;
    }
  }

  readInt16(byteOrder?: ByteOrder): number {
    if (!this.binaryReader) throw new Error("binaryReader is null");
    const targetEndian = byteOrder ?? this.byteOrder;
    const value = BinaryFile.readInt16(this.binaryReader, targetEndian);
    this.position = this.binaryReader.getPosition();
    return value;
  }

  /**
   * Reads a 16-bit unsigned integer from the reader using the specified byte order.
   * Temporarily sets the reader's endianness for this operation.
   * @param reader The BinaryReader instance.
   * @param byteOrder The byte order (endianness) to use for reading.
   * @returns The 16-bit unsigned integer read.
   */
  static readUInt16(reader: BinaryReader, byteOrder: ByteOrder): number {
    const originalEndian = reader.isLittleEndian;
    reader.isLittleEndian = byteOrder === ByteOrder.LittleEndian;
    try {
      return reader.readUInt16();
    } finally {
      reader.isLittleEndian = originalEndian;
    }
  }

  readUInt16(byteOrder?: ByteOrder): number {
    if (!this.binaryReader) throw new Error("binaryReader is null");
    const targetEndian = byteOrder ?? this.byteOrder;
    const value = BinaryFile.readUInt16(this.binaryReader, targetEndian);
    this.position = this.binaryReader.getPosition();
    return value;
  }

  /**
   * Reads a 32-bit signed integer from the reader using the specified byte order.
   * Temporarily sets the reader's endianness for this operation.
   * @param reader The BinaryReader instance.
   * @param byteOrder The byte order (endianness) to use for reading.
   * @returns The 32-bit signed integer read.
   */
  static readInt32(reader: BinaryReader, byteOrder: ByteOrder): number {
    const originalEndian = reader.isLittleEndian;
    reader.isLittleEndian = byteOrder === ByteOrder.LittleEndian;
    try {
      return reader.readInt32();
    } finally {
      reader.isLittleEndian = originalEndian;
    }
  }

  readInt32(byteOrder?: ByteOrder): number {
    if (!this.binaryReader) throw new Error("binaryReader is null");
    const targetEndian = byteOrder ?? this.byteOrder;
    const value = BinaryFile.readInt32(this.binaryReader, targetEndian);
    this.position = this.binaryReader.getPosition();
    return value;
  }

  /**
   * Reads a 32-bit unsigned integer from the reader using the specified byte order.
   * Temporarily sets the reader's endianness for this operation.
   * @param reader The BinaryReader instance.
   * @param byteOrder The byte order (endianness) to use for reading.
   * @returns The 32-bit unsigned integer read.
   */
  static readUInt32(reader: BinaryReader, byteOrder: ByteOrder): number {
    const originalEndian = reader.isLittleEndian;
    reader.isLittleEndian = byteOrder === ByteOrder.LittleEndian;
    try {
      return reader.readUInt32();
    } finally {
      reader.isLittleEndian = originalEndian;
    }
  }

  readUInt32(byteOrder?: ByteOrder): number {
    if (!this.binaryReader) throw new Error("binaryReader is null");
    const targetEndian = byteOrder ?? this.byteOrder;
    const value = BinaryFile.readUInt32(this.binaryReader, targetEndian);
    this.position = this.binaryReader.getPosition();
    return value;
  }

  /**
   * Reads a 64-bit signed integer (BigInt) from the reader using the specified byte order.
   * Temporarily sets the reader's endianness for this operation.
   * @param reader The BinaryReader instance.
   * @param byteOrder The byte order (endianness) to use for reading.
   * @returns The 64-bit signed integer (BigInt) read.
   */
  static readInt64(reader: BinaryReader, byteOrder: ByteOrder): bigint {
    const originalEndian = reader.isLittleEndian;
    reader.isLittleEndian = byteOrder === ByteOrder.LittleEndian;
    try {
      return reader.readInt64();
    } finally {
      reader.isLittleEndian = originalEndian;
    }
  }

  readInt64(byteOrder?: ByteOrder): bigint {
    if (!this.binaryReader) throw new Error("binaryReader is null");
    const targetEndian = byteOrder ?? this.byteOrder;
    const value = BinaryFile.readInt64(this.binaryReader, targetEndian);
    this.position = this.binaryReader.getPosition();
    return value;
  }

  /**
   * Reads a 64-bit unsigned integer (BigInt) from the reader using the specified byte order.
   * Temporarily sets the reader's endianness for this operation.
   * @param reader The BinaryReader instance.
   * @param byteOrder The byte order (endianness) to use for reading.
   * @returns The 64-bit unsigned integer (BigInt) read.
   */
  static readUInt64(reader: BinaryReader, byteOrder: ByteOrder): bigint {
    const originalEndian = reader.isLittleEndian;
    reader.isLittleEndian = byteOrder === ByteOrder.LittleEndian;
    try {
      return reader.readUInt64();
    } finally {
      reader.isLittleEndian = originalEndian;
    }
  }

  readUInt64(byteOrder?: ByteOrder): bigint {
    if (!this.binaryReader) throw new Error("binaryReader is null");
    const targetEndian = byteOrder ?? this.byteOrder;
    const value = BinaryFile.readUInt64(this.binaryReader, targetEndian);
    this.position = this.binaryReader.getPosition();
    return value;
  }

  /**
   * Reads a 32-bit floating-point number from the reader using the specified byte order.
   * Temporarily sets the reader's endianness for this operation.
   * @param reader The BinaryReader instance.
   * @param byteOrder The byte order (endianness) to use for reading.
   * @returns The 32-bit float read.
   */
  static readFloat32(reader: BinaryReader, byteOrder: ByteOrder): number {
    const originalEndian = reader.isLittleEndian;
    reader.isLittleEndian = byteOrder === ByteOrder.LittleEndian;
    try {
      return reader.readFloat32();
    } finally {
      reader.isLittleEndian = originalEndian;
    }
  }

  readFloat32(byteOrder?: ByteOrder): number {
    if (!this.binaryReader) throw new Error("binaryReader is null");
    const targetEndian = byteOrder ?? this.byteOrder;
    const value = BinaryFile.readFloat32(this.binaryReader, targetEndian);
    this.position = this.binaryReader.getPosition();
    return value;
  }

  /**
   * Reads a 64-bit floating-point number (double) from the reader using the specified byte order.
   * Temporarily sets the reader's endianness for this operation.
   * @param reader The BinaryReader instance.
   * @param byteOrder The byte order (endianness) to use for reading.
   * @returns The 64-bit float (double) read.
   */
  static readFloat64(reader: BinaryReader, byteOrder: ByteOrder): number {
    const originalEndian = reader.isLittleEndian;
    reader.isLittleEndian = byteOrder === ByteOrder.LittleEndian;
    try {
      return reader.readFloat64();
    } finally {
      reader.isLittleEndian = originalEndian;
    }
  }

  readFloat64(byteOrder?: ByteOrder): number {
    if (!this.binaryReader) throw new Error("binaryReader is null");
    const targetEndian = byteOrder ?? this.byteOrder;
    const value = BinaryFile.readFloat64(this.binaryReader, targetEndian);
    this.position = this.binaryReader.getPosition();
    return value;
  }

  /**
   * Converts a string to a Uint8Array of a given length.
   * If the string is shorter than the specified length, the array will be padded with zeros.
   * @param str The string to convert.
   * @param length The desired length of the Uint8Array.
   * @returns A Uint8Array representation of the string, padded to the specified length.
   */
  static stringToByteArray(str: string, length: number): Uint8Array {
    const encoder = new TextEncoder();
    const encoded = encoder.encode(str);
    const byteArray = new Uint8Array(length);

    for (let i = 0; i < length; i++) {
      if (i < encoded.length) {
        byteArray[i] = encoded[i];
      } else {
        byteArray[i] = 0; // Pad with zeros
      }
    }
    return byteArray;
  }
}
