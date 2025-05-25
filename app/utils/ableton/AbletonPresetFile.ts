type PresetFormat = "text" | "xml" | "fxp" | "unknown";

export class AbletonPresetFile {
  readonly filename: string; // Suggested filename without extension
  readonly format: PresetFormat; // Format of the preset
  readonly content: Uint8Array | string; // Raw content
  readonly pluginName?: string; // Optional: name of the plugin that created this preset

  constructor(options: {
    filename: string;
    format: PresetFormat;
    content: Uint8Array | string;
    pluginName?: string;
  }) {
    const { filename, format, content, pluginName } = options;

    if (
      (AbletonPresetFile.isBinaryFormat(format) &&
        !(content instanceof Uint8Array)) ||
      (AbletonPresetFile.isStringFormat(format) && typeof content !== "string")
    ) {
      throw new Error(`Content type mismatch for format '${format}'`);
    }

    this.filename = filename;
    this.format = format;
    this.content = content;
    this.pluginName = pluginName;
  }

  static isBinaryFormat(format: PresetFormat): boolean {
    return format === "fxp" || format === "unknown";
  }

  static isStringFormat(format: PresetFormat): boolean {
    return format === "text" || format === "xml";
  }

  getBinaryContent(): Uint8Array {
    if (this.content instanceof Uint8Array) return this.content;
    throw new Error(`Preset content is not binary (format: ${this.format})`);
  }

  getStringContent(): string {
    if (typeof this.content === "string") return this.content;
    throw new Error(`Preset content is not string (format: ${this.format})`);
  }

  getSuggestedExtension(): string {
    switch (this.format) {
      case "fxp":
        return "fxp";
      case "xml":
        return "xml";
      case "text":
        return "txt";
      case "unknown":
        return "dat";
    }
  }

  getFullFilename(): string {
    return `${this.filename}.${this.getSuggestedExtension()}`;
  }

  toJSON(): Record<string, any> {
    return {
      filename: this.filename,
      format: this.format,
      content:
        this.content instanceof Uint8Array
          ? Array.from(this.content)
          : this.content,
      pluginName: this.pluginName,
    };
  }

  static fromJSON(data: {
    filename: string;
    format: PresetFormat;
    content: number[] | string;
    pluginName?: string;
  }): AbletonPresetFile {
    return new AbletonPresetFile({
      filename: data.filename,
      format: data.format,
      content: AbletonPresetFile.isBinaryFormat(data.format)
        ? new Uint8Array(data.content as number[])
        : (data.content as string),
      pluginName: data.pluginName,
    });
  }
}
