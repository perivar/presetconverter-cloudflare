import { XMLParser } from "fast-xml-parser";

import { BinaryFile, ByteOrder } from "./BinaryFile";
import { BinaryReader } from "./BinaryReader";
import { FXP } from "./FXP";
import { Preset } from "./Preset";

export enum ParameterType {
  Number,
  String,
  Bytes,
}

export class Parameter {
  constructor(
    public Name: string,
    public Index: number,
    public Value: number | string | Uint8Array,
    public Type: ParameterType
  ) {}

  public toString(): string {
    switch (this.Type) {
      case ParameterType.Number:
        return `${this.Index.toString().padEnd(6)} | ${this.Name.padEnd(20)} | ${(this.Value as number).toFixed(2).padStart(8)}`;
      case ParameterType.String: {
        const str = this.Value as string;
        const shortenedString =
          str.substring(0, 200) + (str.length > 200 ? " ..." : "");
        return `${this.Index.toString().padEnd(6)} | ${this.Name.padEnd(20)} | ${shortenedString}`;
      }
      case ParameterType.Bytes: {
        const bytes = this.Value as Uint8Array;
        const hexString = Array.from(bytes)
          .map(byte => byte.toString(16).padStart(2, "0"))
          .join(" ");
        return `${this.Index.toString().padEnd(6)} | ${this.Name.padEnd(20)} | ${hexString}`;
      }
      default:
        return `${this.Index.toString().padEnd(6)} | ${this.Name.padEnd(20)} | No Values Set`;
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

  // VST3 Class IDs
  public static readonly VstClassIDs = {
    // Steinberg
    SteinbergAmpSimulator: "E4B91D8420B74C48A8B10F2DB9CB707E",
    SteinbergAutoPan: "1CA6E894E4624F73ADEB29CD01DDE9EE",
    SteinbergBrickwallLimiter: "94DEB7BF378041EE9E2FEDA24E19EF60",
    SteinbergCompressor: "5B38F28281144FFE80285FF7CCF20483",
    SteinbergDeEsser: "75FD13A528D24880982197D541BC582A",
    SteinbergDeEsserNew: "464DF4539C164C03869900DF86BD887F",
    SteinbergDistortion: "A990C1062CDE43839ECEF8FE91743DA5",
    SteinbergDJEq: "B023870608424FABBCF5516BB15FF0EE",
    SteinbergDualFilter: "6143DAECD6184AE2A570FE9F35065E24",
    SteinbergEnvelopeShaper: "C3D60417A5BB4FB288CB1A75FA641EDF",
    SteinbergEQ: "297BA567D83144E1AE921DEF07B41156",
    SteinbergExpander: "2A4C06FF24F14078868891D184CEFB73",
    SteinbergFrequency: "01F6CCC94CAE4668B7C6EC85E681E419",
    SteinbergGate: "3B660266B3CA4B57BBD487AE1E6C0D2A",
    SteinbergGEQ10: "7C215D9E31E2419E9925056D19310ACD",
    SteinbergGrooveAgentONE: "D3F57B09EC6B49998C534F50787A9F86",
    SteinbergGrooveAgentSE: "91585860BA1748E581441ECD96B153ED",
    SteinbergHALionSonicSE: "5B6D6402C5F74C35B3BE88ADF7FC7D27",
    SteinbergLimiter: "B94789B3C4C944EFB0058694DAB8704E",
    SteinbergMagnetoII: "B8874B5BFF884A93A524C74D7FFB1D54",
    SteinbergMaximizer: "44A0C349905B45D0B97C72D2C6F5B565",
    SteinbergModMachine: "27994C1910A04BA991A20C402B922E35",
    SteinbergMonoDelay: "42A36F8AEE394B98BB2E8B63CB68E3E7",
    SteinbergMorphFilter: "25B0872DB12B44B89E32ABBC1D0B3D8A",
    SteinbergMultibandCompressor: "86DFC3F5415C40388D3AA69030C380B1",
    SteinbergMultibandEnvelopeShaper: "F7E6BFADFCD947BEB0A726EF32CBFC70",
    SteinbergNoiseGate: "C3B0615A2A444991B423673DEE2379A7",
    SteinbergOctaver: "4114D8E30C024C1DB0DE375FC53CDBED",
    SteinbergPadShop: "F38B6C9C04CC45C8B98A682A6F45424A",
    SteinbergPingPongDelay: "37A3AA84E3A24D069C39030EC68768E1",
    SteinbergPitchCorrect: "10F9FE4142694F1EAC21E294B42577C6",
    SteinbergPrologue: "FFF583CCDFB246F894308DB9C5D94C8D",
    SteinbergRetrologue: "CC3695D88FE74881B46E6CCFFB291CFF",
    SteinbergREVerence: "ED824AB48E0846D5959682F5626D0972",
    SteinbergSamplerTrack: "D1B42E80F1124DFEAFEDE2480EFB4298",
    SteinbergSpector: "6790343791E94AE79D617D85146881AC",
    SteinbergStandardPanner: "44E1149EDB3E4387BDD827FEA3A39EE7",
    SteinbergStereoDelay: "001DCD3345D14A13B59DAECF75A37536",
    SteinbergStereoEnhancer: "77BBA7CA90F14C9BB298BA9010D6DD78",
    SteinbergStudioChorus: "8545543739404DEB84F4E6CF0DC687B5",
    SteinbergStudioEQ: "946051208E29496E804F64A825C8A047",
    SteinbergTremolo: "E97A6873690F40E986F3EE1007B5C8FC",
    SteinbergTuner: "6B9B08D2CA294270BF092A62865521BF",
    SteinbergUV22HR: "56535455564852757632326872000000",
    SteinbergVintageCompressor: "E0E5F5FC9F854334B69096445A7B2FA8",
    SteinbergVSTAmpRack: "04F35DB10F0C47B9965EA7D63B0CCE67",
    SteinbergVSTDynamics: "A920B15DBBF04B359CB8A471C58E3B91",
    SteinbergRotary: "54B0BB1DD40B4222BE4E876A87430F64",

    // Waves
    WavesAPI2500Mono: "5653544150434D6170692D3235303020",
    WavesBassRiderStereo: "56535442534C53626173732072696465",
    WavesC1CompStereo: "565354434D5053633120636F6D702073",
    WavesC4Stereo: "5653544445515363342073746572656F",
    WavesCLAGuitarsStereo: "56535443475453636C61206775697461",
    WavesDeBreathMono: "5653544252544D646562726561746820",
    WavesDeEsserStereo: "56535444534153646565737365722073",
    WavesDoubler2Stereo: "56535457443253646F75626C65723220",
    WavesDoubler4Stereo: "56535457443453646F75626C65723420",
    WavesHDelayStereo: "56535448424453682D64656C61792073",
    WavesKramerTapeStereo: "565354544150536B72616D6572207461",
    WavesL3LLMultiStereo: "565354523350536C332D6C6C206D756C",
    WavesL3MultiMaximizerStereo: "5653544C3350536C33206D756C74696D",
    WavesLinEQLowbandStereo: "5653544C5153536C696E6571206C6F77",
    WavesMannyMReverbStereo: "5653544D4D52536D616E6E796D207265",
    WavesMaseratiACGStereo: "565354544E41536D6173657261746920",
    WavesMaseratiVX1Stereo: "565354544E56536D6173657261746920",
    WavesMetaFlangerStereo: "565354464C4E536D657461666C616E67",
    WavesOneKnobFilterStereo: "565354525346536F6E656B6E6F622066",
    WavesPuigChild670Stereo: "56535446434853707569676368696C64",
    WavesPuigTecEQP1AStereo: "56535450314153707569677465632065",
    WavesQ10Stereo: "56535445514153713130207374657265",
    WavesQ2Stereo: "5653544551325371322073746572656F",
    WavesRBassStereo: "565354524E4253726261737320737465",
    WavesRChannelStereo: "565354524E5453726368616E6E656C20",
    WavesRCompressorStereo: "5653545552435372636F6D7072657373",
    WavesRDeEsserStereo: "56535452445353726465657373657220",
    WavesREQ6Stereo: "56535452513653726571203620737465",
    WavesRVerbStereo: "56535452524653727665726220737465",
    WavesS1ImagerStereo: "5653544E534853733120696D61676572",
    WavesSSLChannelStereo: "5653545343485373736C6368616E6E65",
    WavesSSLCompStereo: "565354534C435373736L636F6D702073",
    WavesSSLEQMono: "565354534C514D73736C6571206D6F6E",
    WavesSSLEQStereo: "565354534C515373736C657120737465",
    WavesSuperTap2TapsMonoStereo: "5653544D543258737570657274617020",
    WavesSuperTap2TapsStereo: "5653544D543253737570657274617020",
    WavesTrueVerbStereo: "56535454563453747275657665726220",
    WavesTuneLTStereo: "565354544E4C5377617665732074756E",
    WavesVitaminStereo: "56535456544D53766974616D696E2073",
    WavesVocalRiderStereo: "56535452445253766F63616C20726964",

    // UAD
    UADSSLEChannel: "5653544A3941557561642073736C2065",

    // Solid State Logic
    SSLNativeChannel2: "5653544E43533273736C206E6174696",

    // Native Instruments
    NIKontakt5: "5653544E694F356B6F6E74616B742035",
    NIKontakt6: "5653544E694F356B6F6E74616B740000",
    NIKontakt6_64out: "5653544E6924446B6F6E74616B740000",

    // Fabfilter
    FabFilterProQ: "E45D59E8CB2540FAB0F346E115F8AFD4",
    FabFilterProQx64: "5653544650517266616266696C746572",
    FabFilterProQ2: "55FD08E6C00B44A697DA68F61C6FD576",
    FabFilterProQ2x64: "5653544651327066616266696C746572",
    FabFilterProQ3: "5653544651337066616266696C746572", // vst2
    FabfilterProQ3VST3: "72C4DB717A4D459AB97E51745D84B39D", // vst3

    // East West
    EastWestPlay: "ABCDEF019182FAEB2D45572D4577506C",
    EastWestPlayx64: "565354706C6179706C61795F7673745F",

    // MusicLab
    MusicLabRealStrat: "5653544D526C537265616C7374726174",
    MusicLabRealEight: "5653544D526C457265616L6569676874",
    MusicLabRealGuitarClassic: "5653544D526C477265616C6775697461",
    MusicLabRealLPC: "565354524C50437265616C6C70630000",

    // Other
    TBProAudioGainRider2: "F2AEE70D00DE4F4E5442504154425044",
  };

  /// <summary>
  /// Ensure all variables are ready and populated before writing the preset
  /// I.e. the binary content (ChunkData, MetaXmlBytesWithBOM etc.)
  /// and the calculated positions (ListPos etc.)
  /// </summary>
  /// <returns>true if ready</returns>
  protected abstract preparedForWriting(): boolean;

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

  public setNumberParameter(key: string, value: number): void {
    this.Parameters.set(
      key,
      new Parameter(key, this.Parameters.size, value, ParameterType.Number)
    );
  }

  public getNumberParameter(key: string): number | undefined {
    if (
      this.Parameters.has(key) &&
      this.Parameters.get(key)?.Type === ParameterType.Number
    ) {
      return this.Parameters.get(key)?.Value as number;
    }
    return undefined;
  }

  public setStringParameter(key: string, value: string): void {
    this.Parameters.set(
      key,
      new Parameter(key, this.Parameters.size, value, ParameterType.String)
    );
  }

  public getStringParameter(key: string): string | undefined {
    if (
      this.Parameters.has(key) &&
      this.Parameters.get(key)?.Type === ParameterType.String
    ) {
      return this.Parameters.get(key)?.Value as string;
    }
    return undefined;
  }

  public setBytesParameter(key: string, value: Uint8Array): void {
    this.Parameters.set(
      key,
      new Parameter(key, this.Parameters.size, value, ParameterType.Bytes)
    );
  }

  public getBytesParameter(key: string): Uint8Array | undefined {
    if (
      this.Parameters.has(key) &&
      this.Parameters.get(key)?.Type === ParameterType.Bytes
    ) {
      return this.Parameters.get(key)?.Value as Uint8Array;
    }
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
      console.log(`Number of chunks in list: ${numChunks}`);

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

        console.log(
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
    console.log(`Data chunk ID: '${dataChunkID}'`);

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
    } else if (dataChunkID === "FFBS") {
      // FFBS = FabFilter Binary State (proprietary format)
      // Just store the data since we can't parse it in the abstract class
      // Determine which FabFilter Pro-Q version to use based on vst3ClassId
      console.log("Found FabFilter binary state data");

      // let success = false;

      // // Check FabFilter Pro-Q version based on class ID
      // if (
      //   // this.Vst3ClassID.includes(VstPreset.VstClassIDs.FabfilterProQ3VST3) ||
      //   this.Vst3ClassID.includes(VstPreset.VstClassIDs.FabFilterProQ3)
      // ) {
      //   const proQ3 = new FabfilterProQ3();
      //   success = proQ3.readFFP(chunkData, false);
      //   console.log("Loaded FabFilter Pro-Q 3 preset");
      // } else if (
      //   this.Vst3ClassID.includes(VstPreset.VstClassIDs.FabFilterProQ2)
      // ) {
      //   const proQ2 = new FabfilterProQ2();
      //   success = proQ2.readFFP(chunkData, false);
      //   console.log("Loaded FabFilter Pro-Q 2 preset");
      // } else if (
      //   this.Vst3ClassID.includes(VstPreset.VstClassIDs.FabFilterProQ)
      // ) {
      //   const proQ = new FabfilterProQ();
      //   success = proQ.readFFP(chunkData, false);
      //   console.log("Loaded FabFilter Pro-Q 1 preset");
      // }

      const remainingSize = chunkSize - 4;
      const chunkData = reader.readBytes(remainingSize);
      this.CompChunkData = new Uint8Array([...dataChunkIDBytes, ...chunkData]);
    } else {
      // Standard chunk format:
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
}
