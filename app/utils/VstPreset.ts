import { XMLParser } from "fast-xml-parser";

import { BinaryFile, ByteOrder } from "./BinaryFile";
import { BinaryReader } from "./BinaryReader";
import { FXP } from "./FXP";
import { Preset } from "./Preset";
import { toHexEditorString } from "./StringUtils";
import { VstClassIDs } from "./VstClassIDs";

export enum ParameterType {
  Number,
  String,
  Bytes,
}

export class Parameter {
  constructor(
    public Key: string,
    public Index: number,
    public Value: number | string | Uint8Array,
    public Type: ParameterType
  ) {}

  public toString(): string {
    switch (this.Type) {
      case ParameterType.Number:
        return `${this.Index.toString().padEnd(6)} | ${this.Key.padEnd(20)} | ${(this.Value as number).toFixed(2).padStart(8)}`;
      case ParameterType.String: {
        const str = this.Value as string;
        const shortenedString =
          str.substring(0, 200) + (str.length > 200 ? " ..." : "");
        return `${this.Index.toString().padEnd(6)} | ${this.Key.padEnd(20)} | ${shortenedString}`;
      }
      case ParameterType.Bytes: {
        const bytes = this.Value as Uint8Array;
        const hexEditorString = toHexEditorString(bytes);
        return `${this.Index.toString().padEnd(6)} | ${this.Key.padEnd(20)} | ${hexEditorString}`;
      }
      default:
        return `${this.Index.toString().padEnd(6)} | ${this.Key.padEnd(20)} | No Values Set`;
    }
  }
}

export abstract class VstPreset implements Preset {
  /**
   * Creates a new VstPreset from raw VST3 or FXP/FXB data
   * @param input Either raw preset data (Uint8Array) or an FXP object
   */
  constructor(input?: Uint8Array | FXP) {
    if (input instanceof FXP) {
      this.FXP = input;
    } else {
      if (input) {
        this.read(input);
      }
    }
  }

  /*
    VST3 Preset File Format Definition
    ==================================

    0   +---------------------------+
        | HEADER                    |
        | header id ('VST3')        |       4 Bytes
        | version                   |       4 Bytes (int32)
        | ASCII-encoded class id    |       32 Bytes 
    +--| offset to chunk list      |        8 Bytes (int64)
    |  +---------------------------+
    |  | DATA AREA                 |<-+
    |  | data of chunks 1..n       |  |
    |  ...                       ...  |
    |  |                           |  |
    +->+---------------------------+  |
        | CHUNK LIST                |  |
        | list id ('List')          |  |    4 Bytes
        | entry count               |  |    4 Bytes (int32)
        +---------------------------+  |
        |  1..n                     |  |
        |  +----------------------+ |  |
        |  | chunk id             | |  |    4 Bytes
        |  | offset to chunk data |----+    8 Bytes (int64)
        |  | size of chunk data   | |       8 Bytes (int64)
        |  +----------------------+ |
    EOF +---------------------------+   
  */

  /// <summary>
  /// Ensure all variables are ready and populated before writing the preset
  /// I.e. the binary content (ChunkData, MetaXmlBytesWithBOM etc.)
  /// and the calculated positions (ListPos etc.)
  /// </summary>
  /// <returns>true if ready</returns>
  protected abstract preparedForWriting(): boolean;

  // <summary>
  // Reads parameters from the internal Parameters map populated by the base class constructor
  // </summary>
  public abstract initFromParameters(): void;

  protected static readonly CLASS_ID_SIZE = 32;
  protected static readonly HEADER = "VST3";
  protected static readonly VERSION = 1;
  protected static readonly CHUNK_LIST_TYPE = "List";
  protected static readonly CHUNK_INFO = "Info"; // kMetaInfo - XML metadata
  protected static readonly CHUNK_COMP = "Comp"; // kComponentState - Component state data
  protected static readonly CHUNK_CONT = "Cont"; // kControllerState - Controller state data
  protected static readonly CHUNK_DATA = "Data"; // kProgramData - Program data (parameters)
  // Note: "Prog" would correspond to kProgramData as well, but is not used in this implementation

  // Vst Preset Fields
  public Vst3ClassID: string = "";
  public PlugInCategory: string = "";
  public PlugInName: string = "";
  public PlugInVendor: string = "";

  public InfoXml: string = "";
  public InfoXmlBytesWithBOM: Uint8Array = new Uint8Array();
  public doSkipInfoXml: boolean = false; // determine if InfoXml should be skipped

  // Byte positions and sizes within a vstpreset (for writing)
  public ListPos: number = 0;
  public CompDataStartPos: number = 0;
  public CompDataChunkSize: number = 0;
  public ContDataStartPos: number = 0;
  public ContDataChunkSize: number = 0;
  public InfoXmlStartPos: number = 0;
  public InfoXmlChunkSize: number = 0;

  public Parameters: Map<string, Parameter> = new Map();
  public FXP: FXP | null = null;

  public getParameter(name: string): Parameter | undefined {
    return this.Parameters.get(name);
  }

  public getParameterValue(
    key: string
  ): number | string | Uint8Array | undefined {
    return this.Parameters.get(key)?.Value;
  }

  public setNumberParameterWithIndex(
    key: string,
    index: number,
    value: number
  ): void {
    this.Parameters.set(
      key,
      new Parameter(key, index, value, ParameterType.Number)
    );
  }

  public setNumberParameter(key: string, value: number): void {
    return this.setNumberParameterWithIndex(key, this.Parameters.size, value);
  }

  public getNumberParameter(key: string): number | undefined {
    if (
      this.Parameters.has(key) &&
      this.Parameters.get(key)?.Type === ParameterType.Number
    ) {
      return this.Parameters.get(key)?.Value as number;
    }

    console.warn(`Number parameter "${key}" not found or not of type Number.`);
    return undefined;
  }

  public setStringParameterWithIndex(
    key: string,
    index: number,
    value: string
  ): void {
    this.Parameters.set(
      key,
      new Parameter(key, index, value, ParameterType.String)
    );
  }

  public setStringParameter(key: string, value: string): void {
    return this.setStringParameterWithIndex(key, this.Parameters.size, value);
  }

  public getStringParameter(key: string): string | undefined {
    if (
      this.Parameters.has(key) &&
      this.Parameters.get(key)?.Type === ParameterType.String
    ) {
      return this.Parameters.get(key)?.Value as string;
    }

    console.warn(`String parameter "${key}" not found or not of type String.`);
    return undefined;
  }

  public setBytesParameterWithIndex(
    key: string,
    index: number,
    value: Uint8Array
  ): void {
    this.Parameters.set(
      key,
      new Parameter(key, index, value, ParameterType.Bytes)
    );
  }

  public setBytesParameter(key: string, value: Uint8Array): void {
    return this.setBytesParameterWithIndex(key, this.Parameters.size, value);
  }

  public getBytesParameter(key: string): Uint8Array | undefined {
    if (
      this.Parameters.has(key) &&
      this.Parameters.get(key)?.Type === ParameterType.Bytes
    ) {
      return this.Parameters.get(key)?.Value as Uint8Array;
    }

    console.warn(`Bytes parameter "${key}" not found or not of type Bytes.`);
    return undefined;
  }

  protected hasInfoXml(): boolean {
    // Check if InfoXmlBytesWithBOM has been initialized and has content
    return this.InfoXmlBytesWithBOM && this.InfoXmlBytesWithBOM.length > 3; // BOM is 3 bytes
  }

  protected hasCompChunkData(): boolean {
    const key = "CompChunkData";
    if (
      this.Parameters.has(key) &&
      this.Parameters.get(key)?.Type === ParameterType.Bytes
    ) {
      return true;
    }
    return false;
  }

  // Getter for CompChunkData
  public get CompChunkData(): Uint8Array | undefined {
    const param = this.getParameter("CompChunkData");
    if (param && param.Type === ParameterType.Bytes) {
      return param.Value as Uint8Array;
    }
    return undefined;
  }

  // Setter for CompChunkData
  public set CompChunkData(value: Uint8Array) {
    const key = "CompChunkData";
    if (!this.hasCompChunkData()) {
      // Add new parameter
      this.Parameters.set(
        key,
        new Parameter(key, value.length, value, ParameterType.Bytes)
      );
    } else {
      // Update existing parameter
      const existingParam = this.Parameters.get(key);
      if (existingParam) {
        console.debug(
          `${existingParam.Value instanceof Uint8Array ? existingParam.Value.length : 0} bytes of Comp Chunk data already exist! Overwriting with new content of ${value.length} bytes ...`
        );
        existingParam.Index = value.length;
        existingParam.Value = value;
        existingParam.Type = ParameterType.Bytes; // Ensure type is correct
      } else {
        // Should not happen if hasCompChunkData is true, but handle defensively
        this.Parameters.set(
          key,
          new Parameter(key, value.length, value, ParameterType.Bytes)
        );
      }
    }
  }

  protected hasContChunkData(): boolean {
    const key = "ContChunkData";
    if (
      this.Parameters.has(key) &&
      this.Parameters.get(key)?.Type === ParameterType.Bytes
    ) {
      return true;
    }
    return false;
  }

  // Getter for ContChunkData
  public get ContChunkData(): Uint8Array | undefined {
    const param = this.getParameter("ContChunkData");
    if (param && param.Type === ParameterType.Bytes) {
      return param.Value as Uint8Array;
    }
    return undefined;
  }

  // Setter for ContChunkData
  public set ContChunkData(value: Uint8Array) {
    const key = "ContChunkData";
    if (!this.hasContChunkData()) {
      // Add new parameter
      this.Parameters.set(
        key,
        new Parameter(key, value.length, value, ParameterType.Bytes)
      );
    } else {
      // Update existing parameter
      const existingParam = this.Parameters.get(key);
      if (existingParam) {
        console.debug(
          `${existingParam.Value instanceof Uint8Array ? existingParam.Value.length : 0} bytes of Cont Chunk data already exist! Overwriting with new content of ${value.length} bytes ...`
        );
        existingParam.Index = value.length;
        existingParam.Value = value;
        existingParam.Type = ParameterType.Bytes; // Ensure type is correct
      } else {
        // Should not happen if hasContChunkData is true, but handle defensively
        this.Parameters.set(
          key,
          new Parameter(key, value.length, value, ParameterType.Bytes)
        );
      }
    }
  }

  /**
   * Additional way of setting chunk data using an FXP and wrap the data in a VstW container
   * @param fxp fxp content
   */
  public setCompChunkDataFromFXP(fxp: FXP): void {
    if (fxp) {
      const bf = new BinaryFile(undefined, ByteOrder.BigEndian); // VstW header is BigEndian
      const writer = bf.binaryWriter;
      if (!writer) {
        throw new Error("Failed to create binary writer for VstW header");
      }

      writer.writeString("VstW");

      // Write VstW chunk size (always 8 for the header part itself)
      const vst2ChunkSize = 8;
      writer.writeUInt32(vst2ChunkSize);

      // Write VstW chunk version
      const vst2Version = 1;
      writer.writeUInt32(vst2Version);

      // Write VstW bypass
      const vst2Bypass = 0;
      writer.writeUInt32(vst2Bypass);

      // Write the FXP data itself
      const fxpData = fxp.writeFile();
      if (fxpData) {
        // Switch back to LittleEndian if necessary for the main VST3 structure,
        // but FXP itself is BigEndian, so we write its bytes directly.
        // The VstW container itself doesn't dictate the endianness of the contained data.
        writer.writeBytes(fxpData);

        // Get the combined buffer
        const buffer = writer.getBuffer();
        this.CompChunkData = new Uint8Array(buffer);
      } else {
        console.error("Failed to write FXP data to buffer.");
      }
    }
  }

  protected initInfoXml(): void {
    const xmlString = `<?xml version="1.0" encoding="utf-8"?>\r
<MetaInfo>\r
\t<Attribute id="MediaType" value="VstPreset" type="string" flags="writeProtected"/>\r
\t<Attribute id="PlugInCategory" value="${this.PlugInCategory || "Unknown"}" type="string" flags="writeProtected"/>\r
\t<Attribute id="PlugInName" value="${this.PlugInName || "Unknown"}" type="string" flags="writeProtected"/>\r
\t<Attribute id="PlugInVendor" value="${this.PlugInVendor || "Unknown"}" type="string" flags="writeProtected"/>\r
</MetaInfo>\r
`;

    this.InfoXml = xmlString;

    // Create UTF-8 bytes with BOM
    const encoder = new TextEncoder(); // UTF-8 by default
    const xmlBytes = encoder.encode(this.InfoXml);

    // Prepend BOM (EF BB BF)
    const bom = new Uint8Array([0xef, 0xbb, 0xbf]);
    this.InfoXmlBytesWithBOM = new Uint8Array(bom.length + xmlBytes.length);
    this.InfoXmlBytesWithBOM.set(bom, 0);
    this.InfoXmlBytesWithBOM.set(xmlBytes, bom.length);
  }

  protected calculateBytePositions(): void {
    this.CompDataStartPos = 48; // Fixed header size (VST3(4) + version(4) + classId(32) + listPosOffset(8) = 48)

    this.CompDataStartPos = 48; // parameter data start position
    this.CompDataChunkSize = 0;
    if (this.hasCompChunkData()) {
      this.CompDataChunkSize = this.CompChunkData?.length ?? 0; // byte length of Comp parameter data
    }

    this.ContDataStartPos = this.CompDataStartPos + this.CompDataChunkSize;
    this.ContDataChunkSize = 0;
    if (this.hasContChunkData()) {
      this.ContDataChunkSize = this.ContChunkData?.length ?? 0; // byte length of Cont parameter data
    }

    this.InfoXmlStartPos = this.ContDataStartPos + this.ContDataChunkSize;
    this.InfoXmlChunkSize = this.hasInfoXml()
      ? this.InfoXmlBytesWithBOM.length
      : 0;

    // This is the position where the 'List' chunk itself starts.
    this.ListPos = this.InfoXmlStartPos + this.InfoXmlChunkSize;
  }

  protected parseParameterChunk(data: Uint8Array): void {
    const view = new DataView(data.buffer);
    let offset = 0;

    const count = view.getInt32(offset, true);
    offset += 4;

    for (let i = 0; i < count; i++) {
      const namePtr = view.getInt32(offset, true);
      offset += 4;
      const value = view.getFloat32(offset, true);
      offset += 4;
      offset += 4; // Skip reserved field

      // Read name from string table
      let nameOffset = namePtr;
      let name = "";
      while (data[nameOffset] !== 0) {
        name += String.fromCharCode(data[nameOffset]);
        nameOffset++;
      }

      this.setNumberParameter(name, value);
    }
  }

  read(data: Uint8Array): boolean {
    try {
      const bf = new BinaryFile(data, ByteOrder.LittleEndian);
      const reader = bf.binaryReader;
      if (!reader) {
        throw new Error("Failed to create binary reader");
      }

      const header = reader.readString(4);
      if (header !== VstPreset.HEADER) {
        throw new Error("Invalid VST3 preset file header");
      }

      const version = reader.readInt32();
      if (version !== VstPreset.VERSION) {
        throw new Error(`Unsupported VST3 preset version: ${version}`);
      }

      // Read 32-byte ASCII-encoded class ID
      this.Vst3ClassID = reader.readString(VstPreset.CLASS_ID_SIZE);

      // Read 8-byte offset to chunk list
      this.ListPos = Number(reader.readInt64());

      // Store current position
      const currentPos = reader.getPosition();

      // Seek to list position
      reader.seek(Number(this.ListPos));

      // Read list chunk
      const listChunk = reader.readString(4);
      if (listChunk !== VstPreset.CHUNK_LIST_TYPE) {
        throw new Error(`Invalid list chunk: ${listChunk}`);
      }

      // Read number of chunks in list
      const numChunks = reader.readInt32();
      console.debug(`Number of chunks in list: ${numChunks}`);

      // Read chunk entries
      const chunks = [];
      for (let i = 0; i < numChunks; i++) {
        //  +----------------------+
        //  | chunk id             |    4 Bytes
        //  | offset to chunk data |    8 Bytes (int64)
        //  | size of chunk data   |    8 Bytes (int64)
        //  +----------------------+

        const chunkId = reader.readString(4);
        const chunkOffset = Number(reader.readInt64());
        const chunkSize = Number(reader.readInt64());

        chunks.push({
          id: chunkId,
          offset: chunkOffset,
          size: chunkSize,
        });

        console.debug(
          `Chunk ${i}: ID=${chunkId}, Offset=${chunkOffset}, Size=${chunkSize}`
        );
      }

      // Process chunks
      for (const chunk of chunks) {
        // Seek to chunk data
        reader.seek(chunk.offset);

        if (chunk.id === VstPreset.CHUNK_INFO) {
          this.InfoXmlStartPos = chunk.offset;
          this.InfoXmlChunkSize = chunk.size;
          this.tryReadInfoXml(reader);
        } else if (chunk.id === VstPreset.CHUNK_COMP) {
          try {
            this.readCompData(reader, chunk.size);
          } catch (error) {
            console.warn(error);
          }
        } else if (chunk.id === VstPreset.CHUNK_CONT) {
          this.ContChunkData = reader.readBytes(chunk.size);
        }
      }

      reader.seek(currentPos);
      return true;
    } catch (error) {
      console.error("Error reading preset:", error);
      return false;
    }
  }

  protected tryReadInfoXml(reader: BinaryReader): void {
    // Get current position before reading XML
    const currentPos = reader.getPosition();

    // Seek to start of meta xml
    const skipBytes = this.InfoXmlStartPos - currentPos;
    if (skipBytes > 0) {
      console.log(`Skipping bytes: ${skipBytes}`);
      reader.seek(this.InfoXmlStartPos);
    }

    // Read XML bytes with BOM
    this.InfoXmlBytesWithBOM = reader.readBytes(Number(this.InfoXmlChunkSize));

    // Convert to string
    const textDecoder = new TextDecoder("utf-8");
    this.InfoXml = textDecoder.decode(this.InfoXmlBytesWithBOM);

    // Parse XML and extract plugin info
    this.initFromInfoXml();
  }

  protected initFromInfoXml(): void {
    if (!this.InfoXml) return;

    // Remove BOM if present
    const xmlString = this.removeByteOrderMark(this.InfoXml);

    try {
      const parser = new XMLParser({
        ignoreAttributes: false,
        attributeNamePrefix: "",
        parseAttributeValue: true,
      });

      const result = parser.parse(xmlString);

      // MetaInfo contains an array of Attribute elements
      const attributes = result.MetaInfo.Attribute;
      if (!Array.isArray(attributes)) return;

      // Process each attribute
      for (const attr of attributes) {
        if (attr.id === "PlugInCategory") {
          this.PlugInCategory = attr.value;
        } else if (attr.id === "PlugInName") {
          this.PlugInName = attr.value;
        } else if (attr.id === "PlugInVendor") {
          this.PlugInVendor = attr.value;
        }
      }
    } catch (error) {
      console.error("Error parsing Info XML:", error);
    }
  }

  protected removeByteOrderMark(value: string): string {
    // Convert string to UTF-8 bytes
    const encoder = new TextEncoder();
    let bytes = encoder.encode(value);

    // Remove BOM from start if present
    if (bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf) {
      bytes = bytes.slice(3);
    }

    // Remove BOM from end if present
    const byteLength = bytes.length;
    if (
      bytes[byteLength - 3] === 0xef &&
      bytes[byteLength - 2] === 0xbb &&
      bytes[byteLength - 1] === 0xbf
    ) {
      bytes = bytes.slice(0, -3);
    }

    // Convert back to string
    const decoder = new TextDecoder("utf-8");
    return decoder.decode(bytes);
  }

  protected readCompData(reader: BinaryReader, chunkSize: number): void {
    // First 4 bytes identify the chunk type (ASCII)
    const dataChunkIDBytes = reader.readBytes(4);
    const dataChunkID = String.fromCharCode(...dataChunkIDBytes);
    console.debug(`Data chunk ID: '${dataChunkID}'`);

    if (dataChunkID === "VstW") {
      // Handle VstW chunk (VST2 wrapper)
      // Get the current position and read the next 12 bytes for BigEndian processing
      const headerBytes = reader.readBytes(12);

      // Create a temporary BigEndian reader for the header
      const tempBf = new BinaryFile(headerBytes, ByteOrder.BigEndian);
      const tempReader = tempBf.binaryReader;
      if (tempReader) {
        const vst2ChunkSize = tempReader.readUInt32();
        const vst2Version = tempReader.readUInt32();
        const vst2Bypass = tempReader.readUInt32();
        console.log(
          "VST2 Wrapper - Size: %d, Version: %d, Bypass: %d",
          vst2ChunkSize,
          vst2Version,
          vst2Bypass
        );
      }

      // const remainingSize = chunkSize - 16;
      // const chunkData = reader.readBytes(remainingSize);
      // this.CompChunkData = new Uint8Array([...dataChunkIDBytes, ...chunkData]);
    } else if (
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
      // rewind 4 bytes (seek to comp data start pos)
      reader.seek(reader.getPosition() - 4);

      // Read version bytes (4 bytes)
      const versionBytes = reader.readBytes(4);
      const versionNumber = new DataView(versionBytes.buffer).getInt32(0, true);
      console.debug("Version number: ", versionNumber);

      this.setBytesParameter("StartBytes", versionBytes);

      // Read parameters until end of chunk
      while (reader.getPosition() < chunkSize) {
        // Read null-terminated string
        let paramName = "";
        let byte;
        while ((byte = reader.readUInt8()) !== 0) {
          paramName += String.fromCharCode(byte);
        }

        // Read remaining bytes to complete 128 bytes
        const remainingBytes = 128 - paramName.length - 1;
        reader.readBytes(remainingBytes); // Ignore these bytes

        const paramIndex = reader.readInt32();
        const paramValue = new DataView(reader.readBytes(8).buffer).getFloat64(
          0,
          true
        );

        console.debug(
          `Found parameter ${paramName}, index: ${paramIndex}, value: ${paramValue}`
        );

        this.setNumberParameterWithIndex(paramName, paramIndex, paramValue);
      }

      // try to read the info xml
      // this.tryReadInfoXml(reader);

      return;
    } else {
      // Standard chunk format
      const remainingSize = chunkSize - 4;
      const chunkData = reader.readBytes(remainingSize);
      this.CompChunkData = new Uint8Array([...dataChunkIDBytes, ...chunkData]);
    }

    // OK, getting here we should have access to a fxp/fxb chunk:
    const fxpChunkStart = reader.getPosition();
    const fxpDataChunkStart = reader.readString(4);
    if (fxpDataChunkStart != "CcnK") {
      throw new Error(
        `Data does not contain any known formats or FXB or FXP data (DataChunkStart: ${fxpDataChunkStart})`
      );
    }

    // OK, seems to be a valid fxb or fxp chunk.
    // Get chunk size and add 8 bytes to include all bytes from 'CcnK' and the 4 chunk-size bytes
    // Note: FXP chunks use BigEndian byte order
    const fxpChunkSize = BinaryFile.readUInt32(reader, ByteOrder.BigEndian) + 8;

    // Read magic value to determine chunk type (FXP/FXB)
    const fxpMagicChunkID = reader.readString(4);

    if (
      fxpMagicChunkID != "FxCk" &&
      fxpMagicChunkID != "FPCh" &&
      fxpMagicChunkID != "FxBk" &&
      fxpMagicChunkID != "FBCh"
    ) {
      throw new Error(
        `Data does not contain any known formats or FXB or FXP data (fxpMagicChunkID: ${fxpMagicChunkID})`
      );
    }

    // Read fxp chunk data
    reader.seek(fxpChunkStart);
    const fxpChunkData = reader.readBytes(fxpChunkSize);

    // Create new FXP object with chunk data
    this.FXP = new FXP(fxpChunkData);

    // Set the chunk data using FXP
    this.setCompChunkDataFromFXP(this.FXP);

    // try to read the info xml
    // this.tryReadInfoXml(reader);
  }

  write(): Uint8Array | undefined {
    const bf = new BinaryFile(undefined, ByteOrder.LittleEndian);
    const writer = bf.binaryWriter;
    if (!writer) throw new Error("Failed to create binary writer");

    if (this.preparedForWriting()) {
      // Write file header
      writer.writeString(VstPreset.HEADER);
      writer.writeInt32(VstPreset.VERSION);

      // Write class ID (32 bytes) or empty class ID if not set
      writer.writeString(
        this.Vst3ClassID || "".padEnd(VstPreset.CLASS_ID_SIZE, "\0")
      );

      // Write list position
      writer.writeInt64(BigInt(this.ListPos));

      // Write binary content - Comp chunk
      // Write binary content
      if (this.hasCompChunkData()) {
        writer.writeBytes(this.CompChunkData ?? new Uint8Array(0));
      }
      if (this.hasContChunkData()) {
        writer.writeBytes(this.ContChunkData ?? new Uint8Array(0));
      }

      // The UTF-8 representation of the Byte order mark is the (hexadecimal) byte sequence 0xEF,0xBB,0xBF.
      writer.writeBytes(this.InfoXmlBytesWithBOM);

      // Write LIST and number of chunks
      writer.writeString(VstPreset.CHUNK_LIST_TYPE);
      let numListChunks = 2; // Always write Comp, Cont
      // increment if Info chunk is present
      if (this.InfoXmlChunkSize > 0) {
        numListChunks++;
      }
      writer.writeInt32(numListChunks);

      // Write Comp chunk info
      writer.writeString(VstPreset.CHUNK_COMP);
      writer.writeInt64(BigInt(this.CompDataStartPos));
      writer.writeInt64(BigInt(this.CompDataChunkSize));

      // Write Cont chunk info
      writer.writeString(VstPreset.CHUNK_CONT);
      writer.writeInt64(BigInt(this.ContDataStartPos));
      writer.writeInt64(BigInt(this.ContDataChunkSize));

      // Write Info chunk info
      if (this.InfoXmlChunkSize > 0) {
        writer.writeString(VstPreset.CHUNK_INFO);
        writer.writeInt64(BigInt(this.InfoXmlStartPos));
        writer.writeInt64(BigInt(this.InfoXmlChunkSize));
      }

      const buffer = writer.getBuffer();
      return buffer ? new Uint8Array(buffer) : undefined;
    }
  }

  /**
   * Generates a string representation of the VstPreset content.
   * Includes Vst3ClassID, all parameters, and the Info XML if available.
   * @returns A multi-line string detailing the preset's configuration.
   */
  public toString(): string {
    const lines: string[] = [];
    lines.push(`Vst3ID: ${this.Vst3ClassID}`);

    if (this.Parameters.size > 0) {
      // Output parameters - Note: Map iteration order isn't guaranteed,
      // but matches the C# Dictionary behavior in this context.
      for (const parameter of this.Parameters.values()) {
        lines.push(parameter.toString());
      }
    }

    if (this.InfoXml) {
      lines.push(this.InfoXml);
    }

    return lines.join("\n");
  }
}
