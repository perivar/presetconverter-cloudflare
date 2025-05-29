import { SupportsPresetFormats } from "../converters/MultiFormatConverter";

export class GenericXML implements SupportsPresetFormats {
  readonly content: string;
  readonly pluginName?: string;

  constructor(content: string, pluginName?: string) {
    this.content = content;
    this.pluginName = pluginName;
  }

  // Implement SupportsPresetFormats
  toString(): string | undefined {
    return this.content;
  }
}
