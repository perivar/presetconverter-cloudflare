import { SupportsPresetFormats } from "../converters/MultiFormatConverter";

export class GenericFXP implements SupportsPresetFormats {
  readonly content: Uint8Array;
  readonly pluginName?: string;

  constructor(content: Uint8Array, pluginName?: string) {
    this.content = content;
    this.pluginName = pluginName;
  }

  // Implement SupportsPresetFormats
  writeFXP(presetName: string): Uint8Array | undefined {
    return this.content;
  }
}
