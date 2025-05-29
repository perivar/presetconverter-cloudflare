import { AbletonPlugin } from "./AbletonPlugin";

export type PresetFormat = "xml" | "fxp" | "vstpreset" | "plugin" | "unknown";

export class AbletonDevicePreset {
  readonly filename: string; // Suggested filename without extension
  readonly format: PresetFormat; // Format of the preset
  readonly content: Uint8Array | string | AbletonPlugin; // Raw content or plugin instance
  readonly originalXML?: string; // Optional: Original XML
  readonly pluginName?: string; // Optional: name of the plugin that created this preset

  constructor(options: {
    filename: string;
    format: PresetFormat;
    content: Uint8Array | string | AbletonPlugin;
    originalXML?: string;
    pluginName?: string;
  }) {
    const { filename, format, content, originalXML, pluginName } = options;

    if (
      (AbletonDevicePreset.isBinaryFormat(format) &&
        !(content instanceof Uint8Array)) ||
      (AbletonDevicePreset.isStringFormat(format) &&
        typeof content !== "string") ||
      (AbletonDevicePreset.isPluginFormat(format) &&
        !(content instanceof AbletonPlugin)) // Added check for 'plugin' format using helper
    ) {
      throw new Error(`Content type mismatch for format '${format}'`);
    }

    this.filename = filename;
    this.format = format;
    this.content = content;
    this.originalXML = originalXML;
    this.pluginName = pluginName;
  }

  static isBinaryFormat(format: PresetFormat): boolean {
    return format === "fxp" || format === "vstpreset" || format === "unknown";
  }

  static isStringFormat(format: PresetFormat): boolean {
    return format === "xml";
  }

  static isPluginFormat(format: PresetFormat): boolean {
    return format === "plugin";
  }

  getBinaryContent(): Uint8Array {
    if (this.content instanceof Uint8Array) return this.content;
    throw new Error(`Preset content is not binary (format: ${this.format})`);
  }

  getStringContent(): string {
    if (typeof this.content === "string") return this.content;
    throw new Error(`Preset content is not string (format: ${this.format})`);
  }

  getPluginContent(): AbletonPlugin {
    if (this.content instanceof AbletonPlugin) return this.content;
    throw new Error(
      `Preset content is not an AbletonPlugin instance (format: ${this.format})`
    );
  }

  getOriginalXmlContent(): string | undefined {
    if (this.originalXML) return this.originalXML;
  }

  getSuggestedExtension(): string {
    switch (this.format) {
      case "fxp":
        return "fxp";
      case "xml":
        return "xml";
      case "vstpreset":
        return "vstpreset";
      case "unknown":
        return "dat";
      case "plugin":
        return "adv"; // ableton device preset
    }
  }

  getFullFilename(): string {
    return `${this.filename}.${this.getSuggestedExtension()}`;
  }
}
