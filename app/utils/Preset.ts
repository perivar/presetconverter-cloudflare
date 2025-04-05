/**
 * Preset interface
 */
export interface Preset {
  read(data: Uint8Array): boolean;
  write(): Uint8Array | undefined;
}
