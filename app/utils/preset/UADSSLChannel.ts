import { XMLParser } from "fast-xml-parser"; // Import XMLParser directly

import { BinaryFile, ByteOrder } from "../binary/BinaryFile";
import { FxChunkSet, FxContent, FXP, FxProgramSet } from "./FXP";
import xmlContent from "./UADSSLChannelParametersMap.xml?raw"; // ?raw is using Vite's raw import feature
import { VstClassIDs } from "./VstClassIDs";
import { VstPreset } from "./VstPreset";

export class UADSSLChannel extends VstPreset {
  public presetName: string = "";
  public PresetHeaderVar1: number = 3;
  public PresetHeaderVar2: number = 2;

  // Parameter Variable Names
  public Input: number = 0;
  public Phase: number = 0;
  public HPFreq: number = 0;
  public LPFreq: number = 0;
  public HP_LPDynSC: number = 0;
  public CompRatio: number = 0;
  public CompThresh: number = 0;
  public CompRelease: number = 0;
  public CompAttack: number = 0;
  public StereoLink: number = 0;
  public Select: number = 0;
  public ExpThresh: number = 0;
  public ExpRange: number = 0;
  public ExpRelease: number = 0;
  public ExpAttack: number = 0;
  public DynIn: number = 0;
  public CompIn: number = 0;
  public ExpIn: number = 0;
  public LFGain: number = 0;
  public LFFreq: number = 0;
  public LFBell: number = 0;
  public LMFGain: number = 0;
  public LMFFreq: number = 0;
  public LMFQ: number = 0;
  public HMFQ: number = 0;
  public HMFGain: number = 0;
  public HMFFreq: number = 0;
  public HFGain: number = 0;
  public HFFreq: number = 0;
  public HFBell: number = 0;
  public EQIn: number = 0;
  public EQDynSC: number = 0;
  public PreDyn: number = 0;
  public Output: number = 0;
  public EQType: number = 0;
  public Power: number = 0;

  // lists to store lookup values - now static
  private static displayTextDict: { [key: string]: string[] } = {};
  private static displayNumbersDict: { [key: string]: (number | string)[] } =
    {};
  private static valuesDict: { [key: string]: number[] } = {};

  constructor() {
    super();
    this.Vst3ClassID = VstClassIDs.UADSSLEChannel;
    this.PlugInCategory = "Fx|Channel Strip";
    this.PlugInName = "UAD SSL E Channel Strip";
    this.PlugInVendor = "Universal Audio, Inc.";

    UADSSLChannel.initializeMappingTables();
  }

  public initFromParameters(): void {
    // This method is required by the VstPreset abstract class.
    // The UADSSLChannel's parameters are read directly from the FXP chunk data
    // in readFXP, so this method can remain empty for now.
  }

  public static initializeMappingTables(): void {
    // Instantiate XMLParser directly within the class
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: "@_",
      parseAttributeValue: false, // do not convert strings to number automatically
      parseTagValue: false, // do not convert strings to number automatically
    });
    const xmlDoc = parser.parse(xmlContent);

    // Access the 'Parameter' array directly from 'ParametersMap'
    const parameters = xmlDoc.ParametersMap.Parameter;

    const mappedEntries = parameters.map((paramElement: any) => {
      const paramName = paramElement["@_name"];
      if (!paramName) {
        throw new Error("Parameter element missing 'name' attribute.");
      }
      // Ensure Entry is always treated as an array, as fast-xml-parser might return a single object if only one entry exists
      const entries = Array.isArray(paramElement.Entry)
        ? paramElement.Entry
        : [paramElement.Entry];
      return {
        key: paramName,
        value: entries,
      };
    });

    UADSSLChannel.displayTextDict = mappedEntries.reduce(
      (
        acc: { [key: string]: string[] },
        entry: { key: string; value: any[] }
      ) => {
        acc[entry.key] = entry.value.map((e: any) => e.DisplayText || "");
        return acc;
      },
      {}
    );

    UADSSLChannel.displayNumbersDict = mappedEntries.reduce(
      (
        acc: { [key: string]: (number | string)[] },
        entry: { key: string; value: any[] }
      ) => {
        acc[entry.key] = entry.value.map((e: any) => {
          const displayNum = e.DisplayNumber || "0";
          // Attempt to parse as float, if NaN, keep as string
          const parsedNum = parseFloat(displayNum.replace(",", "."));
          return isNaN(parsedNum) ? displayNum : parsedNum;
        });
        return acc;
      },
      {}
    );

    UADSSLChannel.valuesDict = mappedEntries.reduce(
      (
        acc: { [key: string]: number[] },
        entry: { key: string; value: any[] }
      ) => {
        acc[entry.key] = entry.value.map((e: any) =>
          parseFloat((e.Value || "0").replace(",", "."))
        );
        return acc;
      },
      {}
    );
  }

  public findClosestValue(
    paramName: string,
    searchDisplayValue: number
  ): number {
    const displayNumbers = UADSSLChannel.displayNumbersDict[paramName];
    const values = UADSSLChannel.valuesDict[paramName];

    if (!displayNumbers || !values) {
      throw new Error(`Parameter '${paramName}' not found in mapping tables.`);
    }

    let foundClosest: number | string = displayNumbers[0];
    let minDistance = Infinity;
    let foundIndex = 0;

    // Find the closest numerical value if searchDisplayValue is a number
    if (typeof searchDisplayValue === "number") {
      for (let i = 0; i < displayNumbers.length; i++) {
        const currentDisplayNumber = displayNumbers[i];
        if (typeof currentDisplayNumber === "number") {
          const distance = Math.abs(currentDisplayNumber - searchDisplayValue);
          if (distance < minDistance) {
            minDistance = distance;
            foundClosest = currentDisplayNumber;
            foundIndex = i;
          }
        }
      }
    } else {
      // If searchDisplayValue is not a number, or if no numerical match,
      // we might need a different logic for string matching or direct lookup.
      // For now, we'll assume the primary use case is numerical comparison.
      // If a direct string match is needed, it would be handled differently.
      // For the purpose of this task, we prioritize numerical closeness.
      // If the first element is a string and no numerical match is found,
      // it will return the first string element.
      foundClosest = displayNumbers[0];
      foundIndex = 0;
    }

    return values[foundIndex];
  }

  public findClosestDisplayText(
    paramName: string,
    searchParamValue: number
  ): string {
    const values = UADSSLChannel.valuesDict[paramName];
    const displayText = UADSSLChannel.displayTextDict[paramName];

    if (!values || !displayText) {
      throw new Error(`Parameter '${paramName}' not found in mapping tables.`);
    }

    let foundClosest = values[0];
    let minDistance = Math.abs(foundClosest - searchParamValue);
    let foundIndex = 0;

    for (let i = 1; i < values.length; i++) {
      const distance = Math.abs(values[i] - searchParamValue);
      if (distance < minDistance) {
        minDistance = distance;
        foundClosest = values[i];
        foundIndex = i;
      }
    }
    return displayText[foundIndex];
  }

  public findClosestParameterValue(
    paramName: string,
    searchParamValue: number
  ): number | string {
    const values = UADSSLChannel.valuesDict[paramName];
    const displayNumbers = UADSSLChannel.displayNumbersDict[paramName];

    if (!values || !displayNumbers) {
      throw new Error(`Parameter '${paramName}' not found in mapping tables.`);
    }

    let foundClosestValue = values[0];
    let minDistance = Math.abs(foundClosestValue - searchParamValue);
    let foundIndex = 0;

    for (let i = 1; i < values.length; i++) {
      const distance = Math.abs(values[i] - searchParamValue);
      if (distance < minDistance) {
        minDistance = distance;
        foundClosestValue = values[i];
        foundIndex = i;
      }
    }
    return displayNumbers[foundIndex];
  }

  public getParameterDisplay(
    paramName: string,
    value: number
  ): { displayNumber: number | string; displayText: string } {
    const displayText = this.findClosestDisplayText(paramName, value);
    const displayNumber = this.findClosestParameterValue(paramName, value);

    return { displayNumber, displayText };
  }

  protected preparedForWriting(): boolean {
    this.initCompChunkData();
    this.initInfoXml();
    this.calculateBytePositions();
    return true;
  }

  private initCompChunkData(): void {
    this.FXP = this.generateFXP(true);
    this.setCompChunkDataFromFXP(this.FXP);
  }

  public readFXP(fxp: FXP): boolean {
    if (!fxp || !fxp.content) return false;

    let chunkData: Uint8Array = new Uint8Array();
    if (fxp.content instanceof FxProgramSet) {
      chunkData = fxp.content.ChunkData;
    } else if (fxp.content instanceof FxChunkSet) {
      chunkData = fxp.content.ChunkData;
    }

    const bFile = new BinaryFile(chunkData, ByteOrder.LittleEndian);

    this.PresetHeaderVar1 = bFile.binaryReader?.readInt32() || 0;
    this.PresetHeaderVar2 = bFile.binaryReader?.readInt32() || 0;
    this.presetName =
      bFile.binaryReader?.readString(32).replace(/\0/g, "") || "";

    this.Input = bFile.binaryReader?.readFloat32() || 0;
    this.Phase = bFile.binaryReader?.readFloat32() || 0;
    this.HPFreq = bFile.binaryReader?.readFloat32() || 0;
    this.LPFreq = bFile.binaryReader?.readFloat32() || 0;
    this.HP_LPDynSC = bFile.binaryReader?.readFloat32() || 0;
    this.CompRatio = bFile.binaryReader?.readFloat32() || 0;
    this.CompThresh = bFile.binaryReader?.readFloat32() || 0;
    this.CompRelease = bFile.binaryReader?.readFloat32() || 0;
    this.CompAttack = bFile.binaryReader?.readFloat32() || 0;
    this.StereoLink = bFile.binaryReader?.readFloat32() || 0;
    this.Select = bFile.binaryReader?.readFloat32() || 0;
    this.ExpThresh = bFile.binaryReader?.readFloat32() || 0;
    this.ExpRange = bFile.binaryReader?.readFloat32() || 0;
    this.ExpRelease = bFile.binaryReader?.readFloat32() || 0;
    this.ExpAttack = bFile.binaryReader?.readFloat32() || 0;
    this.DynIn = bFile.binaryReader?.readFloat32() || 0;
    this.CompIn = bFile.binaryReader?.readFloat32() || 0;
    this.ExpIn = bFile.binaryReader?.readFloat32() || 0;
    this.LFGain = bFile.binaryReader?.readFloat32() || 0;
    this.LFFreq = bFile.binaryReader?.readFloat32() || 0;
    this.LFBell = bFile.binaryReader?.readFloat32() || 0;
    this.LMFGain = bFile.binaryReader?.readFloat32() || 0;
    this.LMFFreq = bFile.binaryReader?.readFloat32() || 0;
    this.LMFQ = bFile.binaryReader?.readFloat32() || 0;
    this.HMFQ = bFile.binaryReader?.readFloat32() || 0;
    this.HMFGain = bFile.binaryReader?.readFloat32() || 0;
    this.HMFFreq = bFile.binaryReader?.readFloat32() || 0;
    this.HFGain = bFile.binaryReader?.readFloat32() || 0;
    this.HFFreq = bFile.binaryReader?.readFloat32() || 0;
    this.HFBell = bFile.binaryReader?.readFloat32() || 0;
    this.EQIn = bFile.binaryReader?.readFloat32() || 0;
    this.EQDynSC = bFile.binaryReader?.readFloat32() || 0;
    this.PreDyn = bFile.binaryReader?.readFloat32() || 0;
    this.Output = bFile.binaryReader?.readFloat32() || 0;
    this.EQType = bFile.binaryReader?.readFloat32() || 0;
    this.Power = bFile.binaryReader?.readFloat32() || 0;

    return true;
  }

  public writeFXPToByteArray(): Uint8Array {
    const fxp = this.generateFXP(false);
    return new Uint8Array(fxp.writeFile() || new ArrayBuffer(0)); // Ensure it returns Uint8Array
  }

  private generateFXP(isBank: boolean): FXP {
    let fxpContent: FxContent;
    const fxp = new FXP();

    if (isBank) {
      fxpContent = new FxChunkSet();
      (fxpContent as FxChunkSet).NumPrograms = 1;
      (fxpContent as FxChunkSet).Future = "\0".repeat(128);
    } else {
      fxpContent = new FxProgramSet();
      (fxpContent as FxProgramSet).NumPrograms = 1;
      (fxpContent as FxProgramSet).Name = this.presetName;
    }

    fxp.content = fxpContent;
    fxpContent.ChunkMagic = "CcnK";
    fxpContent.ByteSize = 0;

    fxpContent.FxMagic = isBank ? "FBCh" : "FPCh";
    fxpContent.Version = 1;
    fxpContent.FxID = "J9AU";
    fxpContent.FxVersion = 1;

    const chunkData = this.getChunkData(fxpContent.FxMagic);

    if (fxp.content instanceof FxProgramSet) {
      (fxp.content as FxProgramSet).ChunkSize = chunkData.length;
      (fxp.content as FxProgramSet).ChunkData = chunkData;
    } else if (fxp.content instanceof FxChunkSet) {
      (fxpContent as FxChunkSet).ChunkSize = chunkData.length;
      (fxpContent as FxChunkSet).ChunkData = chunkData;
    }

    return fxp;
  }

  private getChunkData(fxMagic: string): Uint8Array {
    const bf = new BinaryFile(undefined, ByteOrder.LittleEndian);

    if (fxMagic === "FBCh") {
      bf.binaryWriter?.writeUInt32(3);
      bf.binaryWriter?.writeUInt32(0);
      bf.binaryWriter?.writeUInt32(32);
    }

    bf.binaryWriter?.writeInt32(this.PresetHeaderVar1);
    bf.binaryWriter?.writeInt32(this.PresetHeaderVar2);
    bf.writeStringPadded(this.presetName, 32);

    bf.binaryWriter?.writeFloat32(this.Input);
    bf.binaryWriter?.writeFloat32(this.Phase);
    bf.binaryWriter?.writeFloat32(this.HPFreq);
    bf.binaryWriter?.writeFloat32(this.LPFreq);
    bf.binaryWriter?.writeFloat32(this.HP_LPDynSC);
    bf.binaryWriter?.writeFloat32(this.CompRatio);
    bf.binaryWriter?.writeFloat32(this.CompThresh);
    bf.binaryWriter?.writeFloat32(this.CompRelease);
    bf.binaryWriter?.writeFloat32(this.CompAttack);
    bf.binaryWriter?.writeFloat32(this.StereoLink);
    bf.binaryWriter?.writeFloat32(this.Select);
    bf.binaryWriter?.writeFloat32(this.ExpThresh);
    bf.binaryWriter?.writeFloat32(this.ExpRange);
    bf.binaryWriter?.writeFloat32(this.ExpRelease);
    bf.binaryWriter?.writeFloat32(this.ExpAttack);
    bf.binaryWriter?.writeFloat32(this.DynIn);
    bf.binaryWriter?.writeFloat32(this.CompIn);
    bf.binaryWriter?.writeFloat32(this.ExpIn);
    bf.binaryWriter?.writeFloat32(this.LFGain);
    bf.binaryWriter?.writeFloat32(this.LFFreq);
    bf.binaryWriter?.writeFloat32(this.LFBell);
    bf.binaryWriter?.writeFloat32(this.LMFGain);
    bf.binaryWriter?.writeFloat32(this.LMFFreq);
    bf.binaryWriter?.writeFloat32(this.LMFQ);
    bf.binaryWriter?.writeFloat32(this.HMFQ);
    bf.binaryWriter?.writeFloat32(this.HMFGain);
    bf.binaryWriter?.writeFloat32(this.HMFFreq);
    bf.binaryWriter?.writeFloat32(this.HFGain);
    bf.binaryWriter?.writeFloat32(this.HFFreq);
    bf.binaryWriter?.writeFloat32(this.HFBell);
    bf.binaryWriter?.writeFloat32(this.EQIn);
    bf.binaryWriter?.writeFloat32(this.EQDynSC);
    bf.binaryWriter?.writeFloat32(this.PreDyn);
    bf.binaryWriter?.writeFloat32(this.Output);
    bf.binaryWriter?.writeFloat32(this.EQType);
    bf.binaryWriter?.writeFloat32(this.Power);

    return new Uint8Array(bf.binaryWriter?.getBuffer() || new ArrayBuffer(0));
  }

  public toString(): string {
    let sb = `PresetName: ${this.presetName}\n`;
    sb += `Input:           ${this.Input.toFixed(2).padEnd(5)} = ${this.findClosestDisplayText("Input", this.Input)} (-20.0 dB -> 20.0 dB)\n`;
    sb += `Phase:           ${this.Phase.toFixed(2).padEnd(5)} = ${this.findClosestDisplayText("Phase", this.Phase)} (Normal -> Inverted)\n`;
    sb += `HP Freq:         ${this.HPFreq.toFixed(2).padEnd(5)} = ${this.findClosestDisplayText("HP Freq", this.HPFreq)} (Out -> 304 Hz)\n`;
    sb += `LP Freq:         ${this.LPFreq.toFixed(2).padEnd(5)} = ${this.findClosestDisplayText("LP Freq", this.LPFreq)} (Out -> 3.21 k)\n`;
    sb += `HP/LP Dyn SC:    ${this.HP_LPDynSC.toFixed(2).padEnd(5)} = ${this.findClosestDisplayText("HP/LP Dyn SC", this.HP_LPDynSC)} (Off -> On)\n`;
    sb += `CMP Ratio:       ${this.CompRatio.toFixed(2).padEnd(5)} = ${this.findClosestDisplayText("CMP Ratio", this.CompRatio)} (1.00:1 -> Limit)\n`;
    sb += `CMP Thresh:      ${this.CompThresh.toFixed(2).padEnd(5)} = ${this.findClosestDisplayText("CMP Thresh", this.CompThresh)} (10.0 dB -> -20.0 dB)\n`;
    sb += `CMP Release:     ${this.CompRelease.toFixed(2).padEnd(5)} = ${this.findClosestDisplayText("CMP Release", this.CompRelease)} (0.10 s -> 4.00 s)\n`;
    sb += `CMP Attack:      ${this.CompAttack.toFixed(2).padEnd(5)} = ${this.findClosestDisplayText("CMP Attack", this.CompAttack)} (Auto -> Fast)\n`;
    sb += `Stereo Link:     ${this.StereoLink.toFixed(2).padEnd(5)} = ${this.findClosestDisplayText("Stereo Link", this.StereoLink)} (UnLink -> Link)\n`;
    sb += `Select:          ${this.Select.toFixed(2).padEnd(5)} = ${this.findClosestDisplayText("Select", this.Select)} (Expand -> Gate 2)\n`;
    sb += `EXP Thresh:      ${this.ExpThresh.toFixed(2).padEnd(5)} = ${this.findClosestDisplayText("EXP Thresh", this.ExpThresh)} (-30.0 dB -> 10.0 dB)\n`;
    sb += `EXP Range:       ${this.ExpRange.toFixed(2).padEnd(5)} = ${this.findClosestDisplayText("EXP Range", this.ExpRange)} (0.0 dB -> 40.0 dB)\n`;
    sb += `EXP Release:     ${this.ExpRelease.toFixed(2).padEnd(5)} = ${this.findClosestDisplayText("EXP Release", this.ExpRelease)} (0.10 s -> 4.00 s)\n`;
    sb += `EXP Attack:      ${this.ExpAttack.toFixed(2).padEnd(5)} = ${this.findClosestDisplayText("EXP Attack", this.ExpAttack)} (Auto -> Fast)\n`;
    sb += `DYN In:          ${this.DynIn.toFixed(2).padEnd(5)} = ${this.findClosestDisplayText("DYN In", this.DynIn)} (Out -> In)\n`;
    sb += `Comp In:         ${this.CompIn.toFixed(2).padEnd(5)} = ${this.findClosestDisplayText("Comp In", this.CompIn)} (Out -> In)\n`;
    sb += `Exp In:          ${this.ExpIn.toFixed(2).padEnd(5)} = ${this.findClosestDisplayText("Exp In", this.ExpIn)} (Out -> In)\n`;
    sb += `LF Gain:         ${this.LFGain.toFixed(2).padEnd(5)} = ${this.findClosestDisplayText("LF Gain", this.LFGain)} (-10.0 dB -> 10.0 dB)\n`;
    sb += `LF Freq:         ${this.LFFreq.toFixed(2).padEnd(5)} = ${this.findClosestDisplayText("LF Freq", this.LFFreq)} (36.1 Hz -> 355 Hz)\n`;
    sb += `LF Bell:         ${this.LFBell.toFixed(2).padEnd(5)} = ${this.findClosestDisplayText("LF Bell", this.LFBell)} (Shelf -> Bell)\n`;
    sb += `LMF Gain:        ${this.LMFGain.toFixed(2).padEnd(5)} = ${this.findClosestDisplayText("LMF Gain", this.LMFGain)} (-15.6 dB -> 15.6 dB)\n`;
    sb += `LMF Freq:        ${this.LMFFreq.toFixed(2).padEnd(5)} = ${this.findClosestDisplayText("LMF Freq", this.LMFFreq)} (251 Hz -> 2.17 k)\n`;
    sb += `LMF Q:           ${this.LMFQ.toFixed(2).padEnd(5)} = ${this.findClosestDisplayText("LMF Q", this.LMFQ)} (2.50 -> 2.50)\n`;
    sb += `HMF Q:           ${this.HMFQ.toFixed(2).padEnd(5)} = ${this.findClosestDisplayText("HMF Q", this.HMFQ)} (4.00 -> 0.40)\n`;
    sb += `HMF Gain:        ${this.HMFGain.toFixed(2).padEnd(5)} = ${this.findClosestDisplayText("HMF Gain", this.HMFGain)} (-16.5 dB -> 16.5 dB)\n`;
    sb += `HMF Freq:        ${this.HMFFreq.toFixed(2).padEnd(5)} = ${this.findClosestDisplayText("HMF Freq", this.HMFFreq)} (735 Hz -> 6.77 k)\n`;
    sb += `HF Gain:         ${this.HFGain.toFixed(2).padEnd(5)} = ${this.findClosestDisplayText("HF Gain", this.HFGain)} (-16.0 dB -> 16.1 dB)\n`;
    sb += `HF Freq:         ${this.HFFreq.toFixed(2).padEnd(5)} = ${this.findClosestDisplayText("HF Freq", this.HFFreq)} (6.93 k -> 21.7 k)\n`;
    sb += `HF Bell:         ${this.HFBell.toFixed(2).padEnd(5)} = ${this.findClosestDisplayText("HF Bell", this.HFBell)} (Shelf -> Bell)\n`;
    sb += `EQ In:           ${this.EQIn.toFixed(2).padEnd(5)} = ${this.findClosestDisplayText("EQ In", this.EQIn)} (Out -> In)\n`;
    sb += `EQ Dyn SC:       ${this.EQDynSC.toFixed(2).padEnd(5)} = ${this.findClosestDisplayText("EQ Dyn SC", this.EQDynSC)} (Off -> On)\n`;
    sb += `Pre Dyn:         ${this.PreDyn.toFixed(2).padEnd(5)} = ${this.findClosestDisplayText("Pre Dyn", this.PreDyn)} (Off -> On)\n`;
    sb += `Output:          ${this.Output.toFixed(2).padEnd(5)} = ${this.findClosestDisplayText("Output", this.Output)} (-20.0 dB -> 20.0 dB)\n`;
    sb += `EQ Type:         ${this.EQType.toFixed(2).padEnd(5)} = ${this.findClosestDisplayText("EQ Type", this.EQType)} (Black -> Brown)\n`;
    sb += `Power:           ${this.Power.toFixed(2).padEnd(5)} = ${this.findClosestDisplayText("Power", this.Power)} (Off -> On)\n`;
    return sb;
  }
}
