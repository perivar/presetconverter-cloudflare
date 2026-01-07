import { BinaryReader } from "../binary/BinaryReader";
import { Encoding, NewLineHandling, XmlWriter } from "../XmlWriter";
import { SteinbergVstPreset } from "./SteinbergVstPreset";

export abstract class SSLNativePresetBase extends SteinbergVstPreset {
  public PresetName: string = "";
  public PresetVersion: string = "";
  public PresetType: string = "";

  constructor(input?: Uint8Array) {
    super(input);
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

  protected preparedForWriting(): boolean {
    this.initCompChunkData();
    this.initInfoXml();
    this.calculateBytePositions();
    return true;
  }

  protected initCompChunkData(): void {
    const xmlContent = this.toXmlString(this.generatePresetXML());
    this.CompChunkData = new TextEncoder().encode(xmlContent);
  }

  protected abstract generatePresetXML(): object;

  protected readCompData(reader: BinaryReader, chunkSize: number): void {
    const xmlContent = reader.readString(chunkSize);
    this.setStringParameterWithIndex("XmlContent", 1, xmlContent);
  }

  protected static paramToXmlAttribute(
    paramName: string,
    paramValue: number | boolean
  ): object {
    const value =
      typeof paramValue === "boolean" ? (paramValue ? 1.0 : 0.0) : paramValue;
    return {
      "@_id": paramName,
      "@_value": value.toFixed(4), // Keep up to 4 decimal places
    };
  }

  protected static findParamValue(
    paramsContainer: any,
    paramType: string, // "PARAM" or "PARAM_NON_AUTO"
    paramId: string
  ): number {
    if (!paramsContainer || !paramsContainer[paramType]) {
      return 0;
    }

    const params = Array.isArray(paramsContainer[paramType])
      ? paramsContainer[paramType]
      : [paramsContainer[paramType]];
    const param = params.find((p: any) => p?.["@_id"] === paramId);

    return Number.parseFloat(param?.["@_value"] ?? "0");
  }
}
