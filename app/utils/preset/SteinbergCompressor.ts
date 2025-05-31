import { SteinbergVstPreset } from "./SteinbergVstPreset";
import { VstClassIDs } from "./VstClassIDs";

export class SteinbergCompressor extends SteinbergVstPreset {
  constructor(input?: Uint8Array) {
    super(input);
    this.Vst3ClassID = VstClassIDs.SteinbergCompressor;
    this.PlugInCategory = "Fx|Dynamics";
    this.PlugInName = "Compressor";
    this.PlugInVendor = "Steinberg Media Technologies";

    // later presets start with 2304 and contain two more parameters than previous presets (limit and drymix)
    // previous presets start with 2016
    this.setStartBytes(2304);

    this.initParameters();
  }

  public initFromParameters(): void {
    // This method is called by the base class after reading the VST preset file.
    // We need to populate the public properties from the `Parameters` map.
    // For SteinbergCompressor, parameters are directly set in the constructor via initParameters,
    // and the base class's readCompData handles populating the Parameters map.
    // So, no explicit property mapping is needed here unless there are specific
    // properties that are not directly mapped from the parameter names.
  }

  private initParameters(): void {
    this.setNumberParameterWithIndex("threshold", 0, -20.0); // 0.0 to - 60.0
    this.setNumberParameterWithIndex("ratio", 9, 2.0); // 1.0 to 8.0
    this.setNumberParameterWithIndex("attack", 1, 1.0); // 0.1 to 100.0
    this.setNumberParameterWithIndex("release", 2, 500.0); // 10.0 to 1000.0
    this.setNumberParameterWithIndex("autorelease", 14, 0.0); // on is 1.0
    this.setNumberParameterWithIndex("hold", 3, 1.0); // 0.0 to 5000.0
    this.setNumberParameterWithIndex("makeUp", 4, 0.0); // 0.0 to 24.0
    this.setNumberParameterWithIndex("automakeup", 10, 1.0); // on is 1.0
    this.setNumberParameterWithIndex("softknee", 5, 1.0); // on is 1.0
    this.setNumberParameterWithIndex("rms", 6, 80.0); // 0.0 to 100.0
    this.setNumberParameterWithIndex("limit", 48, 0.0); // max ratio = limit on is 1.0
    this.setNumberParameterWithIndex("drymix", 49, 0.0); // 0.0 to 100.0
    this.setNumberParameterWithIndex("live", 8, 0.0); // on is 1.0
    this.setNumberParameterWithIndex("resetMaxGainRed", 42, 0.0); // ?
    this.setNumberParameterWithIndex("bypass", 15, 0.0); // on is 1.0
    this.setNumberParameterWithIndex("makeupMode", 46, 0.0); // on is 1.0
  }
}
