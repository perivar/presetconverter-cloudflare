import {
  amplitudeRatio2Decibel,
  decibel2AmplitudeRatio,
} from "../amplitudeConversions";
import { BinaryFile, ByteOrder } from "../binary/BinaryFile";
import { FXP, FxProgramSet } from "./FXP";
import { Preset } from "./Preset";

export enum ReaEQFilterType {
  LowShelf = 0,
  HighShelf = 1,
  Band = 8,
  LowPass = 3,
  HighPass = 4,
  AllPass = 5,
  Notch = 6,
  BandPass = 7,
  Band_alt = 9,
  Band_alt2 = 2,
}

export class ReaEQBand {
  FilterType: ReaEQFilterType;
  Enabled: boolean;
  FilterFreq: number; // value range 20.0 -> 24000.0 Hz
  FilterGain: number; // value range -90.0 (inf) -> 24.0 dB (Store the inverse=10^(dBVal/20))
  FilterBWOct: number; // value range 0.01 -> 4.00
  LogScaleAutoFreq: boolean = true;

  constructor() {
    this.FilterType = ReaEQFilterType.Band;
    this.Enabled = true;
    this.FilterFreq = 0;
    this.FilterGain = 0;
    this.FilterBWOct = 0;
  }

  toString(): string {
    const typeStr = ReaEQFilterType[this.FilterType];
    return (
      `${this.Enabled ? "Enabled" : "Disabled"} | ${typeStr} | ` +
      `Frequency: ${this.FilterFreq.toFixed(1)} Hz | ` +
      `Gain: ${this.FilterGain.toFixed(1)} dB | ` +
      `Bandwidth: ${this.FilterBWOct.toFixed(3)} oct`
    );
  }
}

export class ReaEQ implements Preset {
  Bands: ReaEQBand[] = [];

  public write(): Uint8Array | undefined {
    const fxp = this.generateFXP();
    return fxp.writeFile();
  }

  private generateFXP(): FXP {
    const fxp = new FXP();
    const fxpContent = new FxProgramSet();
    fxp.content = fxpContent;
    fxpContent.ChunkMagic = "CcnK";
    fxpContent.ByteSize = 0; // will be set correctly by FXP class
    fxpContent.FxMagic = "FPCh";
    fxpContent.Version = 1;
    fxpContent.FxID = "reeq";
    fxpContent.FxVersion = 1100;
    fxpContent.NumPrograms = 1;
    fxpContent.Name = "";

    const bf = new BinaryFile();
    bf.binaryWriter?.writeInt32(33);
    bf.binaryWriter?.writeInt32(this.Bands.length);

    for (const band of this.Bands) {
      bf.binaryWriter?.writeInt32(band.FilterType);
      bf.binaryWriter?.writeInt32(band.Enabled ? 1 : 0);
      bf.binaryWriter?.writeFloat64(band.FilterFreq);
      bf.binaryWriter?.writeFloat64(
        decibel2AmplitudeRatio(Math.round(band.FilterGain * 100) / 100)
      );
      bf.binaryWriter?.writeFloat64(band.FilterBWOct);
      bf.binaryWriter?.writeInt8(1);
    }

    bf.binaryWriter?.writeInt32(1);
    bf.binaryWriter?.writeInt32(1);
    bf.binaryWriter?.writeFloat64(decibel2AmplitudeRatio(0.0));
    bf.binaryWriter?.writeInt32(0);

    // Retrieve the buffer and convert it to Uint8Array
    const buffer = bf.binaryWriter?.getBuffer();
    if (buffer) {
      const ChunkData = new Uint8Array(buffer);
      fxpContent.ChunkSize = ChunkData.length;
      fxpContent.ChunkData = ChunkData;
    }

    return fxp;
  }

  public read(data: Uint8Array): boolean {
    try {
      const fxp = new FXP(data);
      if (!fxp.content || !(fxp.content instanceof FxProgramSet)) {
        return false;
      }

      const programSet = fxp.content;
      if (programSet.FxID !== "reeq") {
        return false;
      }

      // Parse ReaEQ data from the chunk
      const bf = new BinaryFile(programSet.ChunkData, ByteOrder.LittleEndian);

      // Read version and band count
      const _version = bf.binaryReader?.readInt32() || 0;
      const bandCount = bf.binaryReader?.readInt32() || 0;

      this.Bands = [];
      for (let i = 0; i < bandCount; i++) {
        const band = new ReaEQBand();
        band.FilterType = bf.binaryReader?.readInt32() || 0;
        band.Enabled = (bf.binaryReader?.readInt32() || 0) === 1;
        band.FilterFreq = bf.binaryReader?.readFloat64() || 0;
        const gainRatio = bf.binaryReader?.readFloat64() || 1;
        band.FilterGain =
          Math.round(amplitudeRatio2Decibel(gainRatio) * 100) / 100;
        band.FilterBWOct = bf.binaryReader?.readFloat64() || 0;
        band.LogScaleAutoFreq = (bf.binaryReader?.readInt8() || 0) === 1;
        this.Bands.push(band);
      }

      return true;
    } catch (error) {
      console.error("Error reading ReaEQ FXP file:", error);
      return false;
    }
  }
}
