import { XMLParser } from "fast-xml-parser";

import { BinaryFile, ByteOrder } from "../binary/BinaryFile";
import { BinaryReader } from "../binary/BinaryReader";
import { removeByteOrderMark } from "../removeByteOrderMark";
import { toHexEditorString } from "../StringUtils";
import { NewLineHandling, XmlWriter } from "../XmlWriter";
import { FXP } from "./FXP";
import { Preset } from "./Preset";

export enum ParameterType {
  Number,
  String,
  Bytes,
}

export class Parameter {
  /**
   * Creates an instance of Parameter.
   * @param Key - The key of the parameter.
   * @param Index - The index of the parameter.
   * @param Value - The value of the parameter.
   * @param Type - The type of the parameter.
   */
  constructor(
    public Key: string,
    public Index: number,
    public Value: number | string | Uint8Array,
    public Type: ParameterType
  ) {}

  /**
   * Returns a string representation of the Parameter.
   * @returns A formatted string displaying the parameter's key, index, and value.
   */
  public toString(): string {
    switch (this.Type) {
      case ParameterType.Number:
        return `${this.Index.toString().padEnd(6)} | ${this.Key.padEnd(26)} | ${(this.Value as number).toFixed(2).padStart(8)}`;
      case ParameterType.String: {
        const str = this.Value as string;
        const shortenedString =
          str.substring(0, 200) + (str.length > 200 ? " ..." : "");
        return `${this.Index.toString().padEnd(6)} | ${this.Key.padEnd(26)} | ${shortenedString}`;
      }
      case ParameterType.Bytes: {
        const bytes = this.Value as Uint8Array;
        const hexEditorString = toHexEditorString(bytes);
        return `${this.Index.toString().padEnd(6)} | ${this.Key.padEnd(26)} | ${hexEditorString}`;
      }
      default:
        return `${this.Index.toString().padEnd(6)} | ${this.Key.padEnd(26)} | No Values Set`;
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

  /**
   * Ensures all variables are ready and populated before writing the preset.
   * This includes binary content (ChunkData, MetaXmlBytesWithBOM etc.) and calculated positions (ListPos etc.).
   * @returns True if the preset is ready for writing, otherwise false.
   */
  protected abstract preparedForWriting(): boolean;

  /**
   * Reads parameters from the internal Parameters map populated by the base class constructor.
   */
  public abstract initFromParameters(): void;

  protected static readonly CLASS_ID_SIZE = 32;
  protected static readonly HEADER = "VST3";
  protected static readonly VERSION = 1;
  protected static readonly CHUNK_LIST_TYPE = "List";
  public static readonly CHUNK_INFO = "Info"; // kMetaInfo - XML metadata
  public static readonly CHUNK_COMP = "Comp"; // kComponentState - Component state data
  public static readonly CHUNK_CONT = "Cont"; // kControllerState - Controller state data
  public static readonly CHUNK_DATA = "Data"; // kProgramData - Program data (parameters)
  // Note: "Prog" would correspond to kProgramData as well, but is not used in this implementation

  protected static readonly CHUNK_COMP_HEADER = "CompChunkDataHeader";
  protected static readonly CHUNK_CONT_HEADER = "ContChunkDataHeader";

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

  /**
   * Clears all parameters from the Parameters map.
   */
  public clearParameters(): void {
    this.Parameters.clear();
  }

  /**
   * Retrieves a parameter by its name.
   * @param name - The name of the parameter to retrieve.
   * @returns The Parameter object if found, otherwise undefined.
   */
  public getParameter(name: string): Parameter | undefined {
    return this.Parameters.get(name);
  }

  /**
   * Retrieves the value of a parameter by its key.
   * @param key - The key of the parameter whose value to retrieve.
   * @returns The value of the parameter if found, otherwise undefined.
   */
  public getParameterValue(
    key: string
  ): number | string | Uint8Array | undefined {
    return this.Parameters.get(key)?.Value;
  }

  /**
   * Sets a number parameter with a specific index.
   * @param key - The key of the parameter.
   * @param index - The index of the parameter.
   * @param value - The number value to set.
   */
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

  /**
   * Sets a number parameter, assigning it the next available index.
   * @param key - The key of the parameter.
   * @param value - The number value to set.
   */
  public setNumberParameter(key: string, value: number): void {
    return this.setNumberParameterWithIndex(key, -1, value);
  }

  /**
   * Retrieves a number parameter by its key.
   * @param key - The key of the parameter to retrieve.
   * @returns The number value of the parameter if found and is of type Number, otherwise undefined.
   */
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

  /**
   * Sets a string parameter with a specific index.
   * @param key - The key of the parameter.
   * @param index - The index of the parameter.
   * @param value - The string value to set.
   */
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

  /**
   * Sets a string parameter, assigning it the next available index.
   * @param key - The key of the parameter.
   * @param value - The string value to set.
   */
  public setStringParameter(key: string, value: string): void {
    return this.setStringParameterWithIndex(key, -1, value);
  }

  /**
   * Retrieves a string parameter by its key.
   * @param key - The key of the parameter to retrieve.
   * @returns The string value of the parameter if found and is of type String, otherwise undefined.
   */
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

  /**
   * Sets a bytes parameter with a specific index.
   * @param key - The key of the parameter.
   * @param index - The index of the parameter.
   * @param value - The Uint8Array value to set.
   */
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

  /**
   * Sets a bytes parameter, assigning it the next available index.
   * @param key - The key of the parameter.
   * @param value - The Uint8Array value to set.
   */
  public setBytesParameter(key: string, value: Uint8Array): void {
    return this.setBytesParameterWithIndex(key, -1, value);
  }

  /**
   * Retrieves a bytes parameter by its key.
   * @param key - The key of the parameter to retrieve.
   * @returns The Uint8Array value of the parameter if found and is of type Bytes, otherwise undefined.
   */
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

  /**
   * Checks if InfoXmlBytesWithBOM has been initialized and has content.
   * @returns True if InfoXmlBytesWithBOM has content, otherwise false.
   */
  protected hasInfoXml(): boolean {
    return this.InfoXmlBytesWithBOM && this.InfoXmlBytesWithBOM.length > 3; // BOM is 3 bytes
  }

  /**
   * Checks if the 'CompChunkData' parameter exists and is of type Bytes.
   * @returns True if 'CompChunkData' exists and is of type Bytes, otherwise false.
   */
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

  /**
   * Checks if the 'ContChunkData' parameter exists and is of type Bytes.
   * @returns True if 'ContChunkData' exists and is of type Bytes, otherwise false.
   */
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

  /**
   * Gets the component chunk data.
   * @returns The component chunk data as a Uint8Array, or undefined if not set.
   */
  public get CompChunkData(): Uint8Array | undefined {
    const param = this.getParameter("CompChunkData");
    if (param && param.Type === ParameterType.Bytes) {
      return param.Value as Uint8Array;
    }
    return undefined;
  }

  /**
   * Sets the component chunk data.
   * @param value - The Uint8Array containing the component chunk data.
   */
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

  /**
   * Gets the controller chunk data.
   * @returns The controller chunk data as a Uint8Array, or undefined if not set.
   */
  public get ContChunkData(): Uint8Array | undefined {
    const param = this.getParameter("ContChunkData");
    if (param && param.Type === ParameterType.Bytes) {
      return param.Value as Uint8Array;
    }
    return undefined;
  }

  /**
   * Sets the controller chunk data.
   * @param value - The Uint8Array containing the controller chunk data.
   */
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
   * Gets the zero-based position where the chunk data ends (Comp).
   */
  public get CompDataEndPosition(): number {
    return this.CompDataStartPos + this.CompDataChunkSize;
  }

  /**
   * Gets the zero-based position where the chunk data ends (Cont).
   */
  public get ContDataEndPosition(): number {
    return this.ContDataStartPos + this.ContDataChunkSize;
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

        const buffer = writer.getBuffer();
        this.CompChunkData = buffer ? new Uint8Array(buffer) : new Uint8Array();
      } else {
        console.error("Failed to write FXP data to buffer.");
      }
    }
  }

  /**
   * Initializes the Info XML content based on plugin metadata.
   * This method generates an XML string with attributes like MediaType, PlugInCategory, PlugInName, and PlugInVendor,
   * then converts it to UTF-8 bytes with a Byte Order Mark (BOM).
   */
  protected initInfoXml(): void {
    const metaInfoObject = {
      MetaInfo: {
        Attribute: [
          {
            "@_id": "MediaType",
            "@_value": "VstPreset",
            "@_type": "string",
            "@_flags": "writeProtected",
          },
          {
            "@_id": "PlugInCategory",
            "@_value": this.PlugInCategory || "Unknown",
            "@_type": "string",
            "@_flags": "writeProtected",
          },
          {
            "@_id": "PlugInName",
            "@_value": this.PlugInName || "Unknown",
            "@_type": "string",
            "@_flags": "writeProtected",
          },
          {
            "@_id": "PlugInVendor",
            "@_value": this.PlugInVendor || "Unknown",
            "@_type": "string",
            "@_flags": "writeProtected",
          },
        ],
      },
    };

    this.InfoXml = XmlWriter(metaInfoObject, {
      OmitXmlDeclaration: false,
      Indent: true,
      IndentChars: "\t",
      NewLineChars: "\r\n",
      NewLineHandling: NewLineHandling.Replace,
    });

    // Create UTF-8 bytes with BOM
    const encoder = new TextEncoder(); // UTF-8 by default
    const xmlBytes = encoder.encode(this.InfoXml);

    // Prepend BOM (EF BB BF)
    const bom = new Uint8Array([0xef, 0xbb, 0xbf]);
    this.InfoXmlBytesWithBOM = new Uint8Array(bom.length + xmlBytes.length);
    this.InfoXmlBytesWithBOM.set(bom, 0);
    this.InfoXmlBytesWithBOM.set(xmlBytes, bom.length);
  }

  /**
   * Calculates the byte positions and sizes of various chunks within the VST3 preset file.
   * This method sets `CompDataStartPos`, `CompDataChunkSize`, `ContDataStartPos`, `ContDataChunkSize`,
   * `InfoXmlStartPos`, `InfoXmlChunkSize`, and `ListPos`.
   */
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

  /**
   * Parses a parameter chunk from the provided Uint8Array and populates the Parameters map.
   * @param data - The Uint8Array containing the parameter chunk data.
   */
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

  /**
   * Extracts the Vst3ClassID from a Uint8Array without reading the entire preset.
   * Returns undefined if the header or version is incorrect.
   * @param data - The preset bytes.
   * @returns The Vst3ClassID as a string, or undefined if not found or invalid.
   */
  public static extractVst3ClassID(data: Uint8Array): string | undefined {
    try {
      const bf = new BinaryFile(data, ByteOrder.LittleEndian);
      const reader = bf.binaryReader;
      if (!reader) {
        throw new Error("Failed to create binary reader");
      }

      const header = reader.readString(4);
      if (header !== VstPreset.HEADER) {
        console.warn("Invalid VST3 preset file header:", header);
        return undefined;
      }

      const version = reader.readInt32();
      if (version !== VstPreset.VERSION) {
        console.warn(`Unsupported VST3 preset version: ${version}`);
        return undefined;
      }

      // Read 32-byte ASCII-encoded class ID
      const vst3ClassID = reader.readString(VstPreset.CLASS_ID_SIZE);
      return vst3ClassID;
    } catch (error) {
      console.error("Error extracting Vst3ClassID:", error);
      return undefined;
    }
  }

  /**
   * Reads the VST3 preset data from a Uint8Array.
   * This method parses the header, class ID, chunk list, and various data chunks (Info, Comp, Cont).
   * @param data - The Uint8Array containing the VST3 preset data.
   * @returns True if the preset was read successfully, otherwise false.
   * @throws Error if the header, version, or list chunk is invalid.
   */
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
      reader.seek(this.ListPos);

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
          this.CompDataStartPos = chunk.offset;
          this.CompDataChunkSize = chunk.size;
          try {
            this.readCompData(reader, chunk.size);
          } catch (error) {
            console.warn(error);
          }
        } else if (chunk.id === VstPreset.CHUNK_CONT) {
          this.ContDataStartPos = chunk.offset;
          this.ContDataChunkSize = chunk.size;
          try {
            this.readContData(reader, chunk.size);
          } catch (error) {
            console.warn(error);
          }
        }
      }

      reader.seek(currentPos);
      return true;
    } catch (error) {
      console.error("Error reading preset:", error);
      return false;
    }
  }

  /**
   * Attempts to read and parse the Info XML chunk from the binary reader.
   * This method seeks to the Info XML's starting position, reads its bytes (including BOM),
   * decodes it to a string, and then initializes plugin information from it.
   * @param reader - The BinaryReader instance.
   */
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
    this.InfoXmlBytesWithBOM = reader.readBytes(this.InfoXmlChunkSize);

    // Convert to string
    const textDecoder = new TextDecoder("utf-8");
    this.InfoXml = textDecoder.decode(this.InfoXmlBytesWithBOM);

    // Parse XML and extract plugin info
    this.initFromInfoXml();
  }

  /**
   * Initializes plugin information from the parsed Info XML content.
   * This method removes the Byte Order Mark (BOM) if present, parses the XML string,
   * and extracts values for `PlugInCategory`, `PlugInName`, and `PlugInVendor`.
   */
  protected initFromInfoXml(): void {
    if (!this.InfoXml) return;

    // Remove BOM if present
    const xmlString = removeByteOrderMark(this.InfoXml);

    try {
      const parser = new XMLParser({
        ignoreAttributes: false,
        attributeNamePrefix: "@_",
        parseAttributeValue: false, // do not convert strings to number automatically
        parseTagValue: false, // do not convert strings to number automatically
      });

      const result = parser.parse(xmlString);

      // MetaInfo contains an array of Attribute elements
      const attributes = result.MetaInfo.Attribute;
      if (!Array.isArray(attributes)) return;

      // Process each attribute
      for (const attr of attributes) {
        if (attr["@_id"] === "PlugInCategory") {
          this.PlugInCategory = attr["@_value"];
        } else if (attr["@_id"] === "PlugInName") {
          this.PlugInName = attr["@_value"];
        } else if (attr["@_id"] === "PlugInVendor") {
          this.PlugInVendor = attr["@_value"];
        }
      }
    } catch (error) {
      console.error("Error parsing Info XML:", error);
    }
  }

  /**
   * Reads and processes the component chunk data.
   * Subclasses can override for custom parsing.
   * @param reader - The BinaryReader instance to read from.
   * @param chunkSize - The size of the component chunk data.
   */
  protected readCompData(reader: BinaryReader, chunkSize: number): void {
    // Default: store raw bytes
    this.CompChunkData = reader.readBytes(chunkSize);
  }

  /**
   * Attempts to read FXP data from the current position.
   * @param reader - The BinaryReader instance.
   */
  protected tryReadFXP(reader: BinaryReader): void {
    const fxpChunkStart = reader.getPosition();
    const fxpDataChunkStart = reader.readString(4);
    if (fxpDataChunkStart != "CcnK") {
      return;
    }
    const fxpChunkSize = BinaryFile.readUInt32(reader, ByteOrder.BigEndian) + 8;
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
    reader.seek(fxpChunkStart);
    const fxpChunkData = reader.readBytes(fxpChunkSize);
    this.FXP = new FXP(fxpChunkData);
    this.setCompChunkDataFromFXP(this.FXP);
  }

  /**
   * Reads controller chunk data.
   * Subclasses can override for custom parsing.
   * @param reader - The BinaryReader instance to read from.
   * @param chunkSize - The size of the controller chunk data.
   */
  protected readContData(reader: BinaryReader, chunkSize: number): void {
    // Default: store raw bytes
    this.ContChunkData = reader.readBytes(chunkSize);
  }

  /**
   * Reads a null-terminated string from the binary reader and then skips a specified number of bytes.
   * This is useful for reading fixed-size string fields where the actual string might be shorter than the allocated space.
   * @param reader - The BinaryReader instance.
   * @param encoding - The character encoding to use for decoding the string (e.g., "utf-16le").
   * @param totalBytes - The total number of bytes allocated for the string field, including the null terminator and any padding.
   * @returns The decoded string.
   */
  protected readStringNullAndSkip(
    reader: BinaryReader,
    encoding: BufferEncoding,
    totalBytes: number
  ): string {
    const posBeforeNull = reader.getPosition();
    let text = "";
    let byte;
    while ((byte = reader.readUInt8()) !== 0) {
      text += String.fromCharCode(byte);
    }
    const posAfterNull = reader.getPosition();
    const bytesToSkip = totalBytes - (posAfterNull - posBeforeNull);
    reader.readBytes(bytesToSkip); // Ignore these bytes
    return text;
  }

  /**
   * Writes the VST3 preset data to a Uint8Array.
   * This method constructs the VST3 preset file including header, class ID, binary content, and chunk list.
   * @returns A Uint8Array containing the VST3 preset data, or undefined if writing failed.
   * @throws Error if the binary writer cannot be created or if the preset is not ready for writing.
   */
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
   * Generates an FXP (VST preset) binary file from the current FXP object.
   * @returns A `Uint8Array` representing the FXP file contents, or `undefined`
   * if the FXP object is not present or failed to produce content.
   */
  public writeFXP(_presetName?: string): Uint8Array | undefined {
    if (this.preparedForWriting()) {
      const fxpContent = this.FXP?.writeFile();
      return fxpContent ? new Uint8Array(fxpContent) : undefined;
    }
    return undefined;
  }

  /**
   * Generates a string representation of the VstPreset content.
   * Includes Vst3ClassID, all parameters, and the Info XML if available.
   * @returns A multi-line string detailing the preset's configuration.
   */
  public toString(): string {
    const lines: string[] = [];
    lines.push(`Vst3ID: ${this.Vst3ClassID}\n`);

    if (this.Parameters.size > 0) {
      lines.push(`Parameters (${this.Parameters.size})`);
      // Output parameters - Note: Map iteration order isn't guaranteed,
      for (const parameter of this.Parameters.values()) {
        lines.push(parameter.toString());
      }
    }

    if (this.InfoXml) {
      lines.push(`\nInfoXML:`);
      lines.push(this.InfoXml);
    }

    return lines.join("\n");
  }
}
