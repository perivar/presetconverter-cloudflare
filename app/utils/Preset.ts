/**
 * Preset interface
 */
export interface Preset {
  read(data: Uint8Array): Promise<boolean>;
  write(): Promise<Uint8Array | undefined>;
}
