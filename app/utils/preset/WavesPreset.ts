import { XMLParser } from "fast-xml-parser";

import { BinaryFile, ByteOrder } from "../binary/BinaryFile";
import { formatNumberWithPrecision } from "../Math";
// Assuming StringUtils exists and has trimMultiLine
import { Encoding, NewLineHandling, XmlWriter } from "../XmlWriter";
import { FxChunkSet, FXP, FxProgramSet } from "./FXP";
import { VstPreset } from "./VstPreset";

/**
 * Represents details for a single preset setup.
 */
export interface WavesPresetSetupDetails {
  realWorldParameters: string; // The parameter text
  presetSetupName?: string; // Name of the preset setup, may be undefined
  isActive: boolean; // True if this is the active preset
}

/**
 * A Waves Preset
 */
export abstract class WavesPreset extends VstPreset {
  public PresetName: string = "";
  public PresetGenericType: string = "";
  public PresetGroup: string | null = null;
  public PresetPluginName: string | null = null;
  public PresetPluginSubComp: string | null = null;
  public PresetPluginVersion: string | null = null;
  public PresetActiveSetup: string = "CURRENT";

  /**
   * Stores RealWorld parameter details indexed by setup keys.
   * Each entry contains the parameters, optional setup name, and active flag.
   */
  public PresetRealWorldParameters:
    | Map<string, WavesPresetSetupDetails>
    | undefined;

  constructor(input?: Uint8Array | FXP) {
    super(input);
  }

  public abstract initFromParameters(): void;

  /**
   * Reads an FXP file and extracts the chunk data.
   * @param data The Uint8Array content of the FXP file.
   * @returns True if the chunk data was successfully read and parsed, false otherwise.
   */
  public readFxp(data: Uint8Array): boolean {
    const fxp = new FXP(data);

    if (fxp.content) {
      if (fxp.content instanceof FxProgramSet) {
        const chunkDataByteArray = fxp.content.ChunkData;
        return this.readChunkData(chunkDataByteArray);
      } else if (fxp.content instanceof FxChunkSet) {
        const chunkDataByteArray = fxp.content.ChunkData;
        return this.readChunkData(chunkDataByteArray);
      }
    }
    return false;
  }

  /**
   * Generates a text summary of the preset.
   * @returns A string containing the text summary.
   */
  public writeTextSummary(): string {
    if (this.PresetPluginName !== null) {
      return this.toString();
    }
    return "";
  }

  protected preparedForWriting(): boolean {
    this.initCompChunkData();
    this.initInfoXml();
    this.calculateBytePositions();
    return true;
  }

  protected abstract initCompChunkData(): void;

  /**
   * Parse out the XML string from the passed chunk data byte array.
   * @param chunkDataByteArray The chunk data as a Uint8Array.
   * @returns The XML string.
   */
  private static parseChunkData(chunkDataByteArray: Uint8Array): string {
    const bf = new BinaryFile(chunkDataByteArray, ByteOrder.BigEndian);
    const reader = bf.binaryReader;

    if (!reader) {
      throw new Error("Failed to create binary reader for chunk data.");
    }

    // Read values, skipping those not directly used for XML extraction
    reader.readInt32(); // val1
    reader.readInt32(); // val2
    reader.readInt32(); // val3
    reader.readString(4); // val4
    reader.readString(4); // val5

    const chunkSize = reader.readInt32();

    reader.readString(4); // val7

    // Read the XML chunk bytes (assuming LittleEndian for the XML content itself)
    const xmlChunkBytes = reader.readBytes(chunkSize);
    const xmlString = new TextDecoder("ascii").decode(xmlChunkBytes); // Assuming ASCII for XML content

    reader.readInt32(); // val8

    return xmlString;
  }

  public readChunkData(chunkDataByteArray: Uint8Array): boolean {
    const xmlString = WavesPreset.parseChunkData(chunkDataByteArray);
    return this.parseXml(xmlString);
  }

  public static getPluginNameFromChunkData(
    chunkDataByteArray: Uint8Array
  ): string | null {
    const xmlString = WavesPreset.parseChunkData(chunkDataByteArray);
    return WavesPreset.getPluginNameFromXml(xmlString);
  }

  private static getPluginNameFromXml(xmlString: string): string | null {
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: "@_",
      parseAttributeValue: false, // do not convert strings to number automatically
      parseTagValue: false, // do not convert strings to number automatically
    });

    try {
      const result = parser.parse(xmlString);
      const presetNode = result?.PresetChunkXMLTree?.Preset;

      if (presetNode) {
        const pluginName = presetNode.PresetHeader?.PluginName;
        if (typeof pluginName === "string") {
          return pluginName;
        }
      }
      return null;
    } catch (error) {
      console.error("Error parsing XML for plugin name:", error);
      return null;
    }
  }

  /**
   * Parses an XML string into an array of WavesPreset objects.
   * @param xmlString The XML string to parse.
   * @returns An array of parsed WavesPreset objects.
   */
  public static parseXml<T extends WavesPreset>(
    xmlString: string,
    presetConstructor: new () => T
  ): T[] {
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: "@_",
      parseAttributeValue: false, // do not convert strings to number automatically
      parseTagValue: false, // do not convert strings to number automatically
    });

    try {
      const result = parser.parse(xmlString);
      let presetNodes: any[] = [];

      if (result?.PresetChunkXMLTree?.Preset) {
        // Assume a VST preset chunk
        presetNodes = Array.isArray(result.PresetChunkXMLTree.Preset)
          ? result.PresetChunkXMLTree.Preset
          : [result.PresetChunkXMLTree.Preset];
      } else if (result?.PresetXMLTree?.Preset) {
        // Assume an XPS preset collection file
        presetNodes = Array.isArray(result.PresetXMLTree.Preset)
          ? result.PresetXMLTree.Preset
          : [result.PresetXMLTree.Preset];
      }

      const parsedPresets: T[] = [];
      for (const presetNode of presetNodes) {
        if (presetNode) {
          const newPreset = new presetConstructor();
          if (newPreset.parsePresetNode(presetNode)) {
            parsedPresets.push(newPreset);
          }
        }
      }
      return parsedPresets;
    } catch (error) {
      console.error("Error parsing XML:", error);
      return [];
    }
  }

  private parseXml(xmlString: string): boolean {
    // This instance method is now redundant if the static method is used for external parsing.
    // However, it's still used internally by readChunkData.
    // The logic here is similar to the static method, but it populates 'this' instance.
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: "@_",
      parseAttributeValue: false, // do not convert strings to number automatically
      parseTagValue: false, // do not convert strings to number automatically
    });

    try {
      const result = parser.parse(xmlString);
      const presetNodes = Array.isArray(result?.PresetChunkXMLTree?.Preset)
        ? result.PresetChunkXMLTree.Preset
        : [result?.PresetChunkXMLTree?.Preset];

      for (const presetNode of presetNodes) {
        if (presetNode) {
          if (this.parsePresetNode(presetNode)) {
            return true;
          }
        }
      }
      return false;
    } catch (error) {
      console.error("Error parsing XML:", error);
      return false;
    }
  }

  /**
   * Parse a Waves Preset Node and extract parameters.
   * @param presetNode The parsed XML node representing the preset.
   * @returns True if parsing was successful.
   */
  private parsePresetNode(presetNode: any): boolean {
    this.PresetName = presetNode["@_Name"] ?? "";
    this.PresetGenericType = presetNode["@_GenericType"] ?? "";

    const presetHeader = presetNode.PresetHeader;
    if (presetHeader) {
      this.PresetPluginName = presetHeader.PluginName ?? "";
      this.PresetPluginSubComp = presetHeader.PluginSubComp ?? "";
      this.PresetPluginVersion = presetHeader.PluginVersion ?? "";
      this.PresetGroup = presetHeader.Group ?? null;
      this.PresetActiveSetup = presetHeader.ActiveSetup ?? "CURRENT";
    }

    // Normalize PresetData to an array
    const presetDataArray = Array.isArray(presetNode.PresetData)
      ? presetNode.PresetData
      : [presetNode.PresetData];

    // Temporary Map to collect valid real-world parameters entries
    const realWorldParamsMap = new Map<string, WavesPresetSetupDetails>();

    for (const presetDataNode of presetDataArray) {
      const setupKey = presetDataNode["@_Setup"] ?? "UNKNOWN";
      const setupName = presetDataNode["@_SetupName"] ?? null;
      const isActive = setupKey === this.PresetActiveSetup;

      // Find the Parameters node with Type="RealWorld"
      const parametersNode = Array.isArray(presetDataNode.Parameters)
        ? presetDataNode.Parameters.find(
            (p: any) => p["@_Type"] === "RealWorld"
          )
        : presetDataNode.Parameters;

      if (parametersNode && parametersNode["#text"]) {
        const text = parametersNode["#text"];
        realWorldParamsMap.set(setupKey, {
          realWorldParameters: text,
          presetSetupName: setupName,
          isActive,
        });
      }
    }

    // Only assign the map if it has at least one entry
    if (realWorldParamsMap.size > 0) {
      this.PresetRealWorldParameters = realWorldParamsMap;
    }

    return this.readRealWorldParameters();
  }

  public toXmlString(xmlObject: object): string {
    const xmlContent = XmlWriter(xmlObject, {
      OmitXmlDeclaration: true,
      Encoding: Encoding.UTF8,
      Indent: true,
      IndentChars: "    ",
      NewLineChars: "\n",
      NewLineHandling: NewLineHandling.Replace,
    });
    return xmlContent;
  }

  /**
   * Formats a floating-point number as a real-world parameter string.
   *
   * - If the number is between 0.01 and 1000 (inclusive), or exactly 0, it will be formatted
   *   using `formatNumberWithPrecision` with the specified number of significant digits.
   * - Otherwise (for very small or very large values), it will be formatted in scientific notation
   *   with 5 digits of precision.
   *
   * @param value - The floating-point number to format.
   * @param precision - Optional number of significant digits to preserve (default: 20).
   * @returns A string representing the formatted number, with either full precision or scientific notation.
   *
   * @example
   * formatRealWorldParameter(0.123456789);           // "0.12345678900000000000"
   * formatRealWorldParameter(0.000001234);           // "1.23400e-6"
   * formatRealWorldParameter(100);                   // "100"
   * formatRealWorldParameter(1.8999999999999999);    // "1.90000000000000000000"
   */
  protected formatRealWorldParameter(value: number, precision = 20): string {
    if ((Math.abs(value) >= 0.01 && Math.abs(value) <= 1000.0) || value === 0) {
      return formatNumberWithPrecision(value, precision);
    } else {
      return value.toExponential(5);
    }
  }

  protected abstract readRealWorldParameters(): boolean;

  /**
   * A utility builder class for constructing parameter strings with support for
   * adding values, flags, delimiters, and managing new lines.
   *
   * This static nested class provides a fluent interface to build complex parameter
   * strings in a structured and readable way. It maintains an internal array of lines,
   * where each line is an array of string parts. Parts within a line are joined by spaces,
   * and lines are joined by newlines.
   *
   * Usage example:
   * ```ts
   * const pb = new WavesPreset.ParamBuilder();
   * pb.add("value1")
   *   .addFlag(true)
   *   .addDelimiter("*")
   *   .newLine()
   *   .add("value2");
   * const result = pb.toString();
   * ```
   */
  static ParamBuilder = class {
    private lines: string[][] = [[]];

    /**
     * Adds a string or number value to the current line.
     * @param value The value to add. It will be converted to a string.
     * @returns The current instance for method chaining.
     */
    add(value: string | number): this {
      this.lines[this.lines.length - 1].push(String(value));
      return this;
    }

    /**
     * Adds a boolean flag to the current line, represented as "1" for true and "0" for false.
     * @param flag The boolean flag to add.
     * @returns The current instance for method chaining.
     */
    addFlag(flag: boolean): this {
      this.lines[this.lines.length - 1].push(flag ? "1" : "0");
      return this;
    }

    /**
     * Adds a delimiter string to the current line. Defaults to "*".
     * @param delim The delimiter string to add.
     * @returns The current instance for method chaining.
     */
    addDelimiter(delim: string = "*"): this {
      this.lines[this.lines.length - 1].push(delim);
      return this;
    }

    /**
     * Starts a new line for subsequent additions.
     * @returns The current instance for method chaining.
     */
    newLine(): this {
      this.lines.push([]);
      return this;
    }

    /**
     * Converts the accumulated lines and parts into a single string, joining parts
     * within a line by spaces and lines by newline characters.
     * @returns The formatted parameter string.
     */
    toString(): string {
      return this.lines.map(line => line.join(" ")).join("\n");
    }
  };
}
