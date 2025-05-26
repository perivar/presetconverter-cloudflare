export interface SupportsPresetFormats {
  writeFFP?: () => Uint8Array | undefined;
  writeFXP?: (presetName: string) => Uint8Array | undefined;
  write?: () => Uint8Array | undefined;
  toString?: () => string | undefined;
}

export interface OutputFormat<From> {
  formatId: string;
  extension: string;
  displayName: string;
  convert: (preset: From) => Uint8Array | string | undefined;
}

export interface MultiFormatConverter<From, To extends SupportsPresetFormats> {
  from: string;
  to: string;
  displayName: string;
  convertBase: (preset: From) => To;
  outputFormats: OutputFormat<From>[];
}
