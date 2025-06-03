import { BinaryFile, ByteOrder } from "../binary/BinaryFile";
import { ensureTrailingSpace } from "../StringUtils";
import { VstClassIDs } from "./VstClassIDs";
import { WavesPreset, WavesPresetSetupDetails } from "./WavesPreset";

/**
 * Waves SSLChannel
 */
export class WavesSSLChannel extends WavesPreset {
  public CompThreshold: number = 0;
  public CompRatio: number = 0;
  public CompFastAttack: boolean = false;
  public CompRelease: number = 0;

  public ExpThreshold: number = 0;
  public ExpRange: number = 0;
  public ExpDisabledGateEnabled: boolean = false;
  public ExpFastAttack: boolean = false;
  public ExpRelease: number = 0;

  public LFTypeBell: boolean = false;
  public LFGain: number = 0;
  public LFFrq: number = 0;

  public LMFGain: number = 0;
  public LMFFrq: number = 0;
  public LMFQ: number = 0;

  public HMFGain: number = 0;
  public HMFFrq: number = 0;
  public HMFQ: number = 0;

  public HFTypeBell: boolean = false;
  public HFGain: number = 0;
  public HFFrq: number = 0;

  public EQToBypass: boolean = false;
  public EQToDynSC: boolean = false;

  public HPFrq: number = 0;
  public LPFrq: number = 0;

  public FilterSplit: boolean = false;
  public DynToChannelOut: boolean = false;
  public DynToByPass: boolean = false;

  public Gain: number = 0;
  public Analog: boolean = false;
  public VUShowOutput: boolean = false;
  public PhaseReverse: boolean = false;
  public InputTrim: number = 0;

  constructor(input?: Uint8Array) {
    super(input);
    this.Vst3ClassID = VstClassIDs.WavesSSLChannelStereo;
    this.PlugInCategory = "Fx|Channel Strip";
    this.PlugInName = "SSLChannel Stereo";
    this.PlugInVendor = "Waves";
  }

  protected readRealWorldParameters(): boolean {
    if (this.PresetPluginName === "SSLChannel") {
      // Check if PresetRealWorldParameters exists and has entries
      if (
        !this.PresetRealWorldParameters ||
        this.PresetRealWorldParameters.size === 0
      ) {
        return false; // No parameters to read
      }

      // Find the active preset entry from the map
      const activeEntry = Array.from(
        this.PresetRealWorldParameters.entries()
      ).find(([_, value]) => value.isActive);

      if (!activeEntry) {
        return false; // No active preset found
      }

      // Destructure to get the realWorldParameters string from the active entry
      const [, { realWorldParameters }] = activeEntry;

      // Split by space or newline
      const splittedPhrase = realWorldParameters.split(/ |\n/);

      this.CompThreshold = parseFloat(splittedPhrase[0]);
      this.CompRatio = parseFloat(splittedPhrase[1]);
      this.CompFastAttack = splittedPhrase[2] === "1";
      this.CompRelease = parseFloat(splittedPhrase[3]);

      this.ExpThreshold = parseFloat(splittedPhrase[5]);
      this.ExpRange = parseFloat(splittedPhrase[6]);
      this.ExpDisabledGateEnabled = splittedPhrase[7] === "1";
      this.ExpFastAttack = splittedPhrase[8] === "1";
      this.ExpRelease = parseFloat(splittedPhrase[9]);

      this.DynToByPass = splittedPhrase[11] === "1";
      this.DynToChannelOut = splittedPhrase[12] === "1";

      this.LFTypeBell = splittedPhrase[13] === "1";
      this.LFGain = parseFloat(splittedPhrase[14]);
      this.LFFrq = parseFloat(splittedPhrase[15]);

      this.LMFGain = parseFloat(splittedPhrase[16]);
      this.LMFFrq = parseFloat(splittedPhrase[17]);
      this.LMFQ = parseFloat(splittedPhrase[18]);

      this.HMFGain = parseFloat(splittedPhrase[19]);
      this.HMFFrq = parseFloat(splittedPhrase[20]);
      this.HMFQ = parseFloat(splittedPhrase[21]);

      this.HFTypeBell = splittedPhrase[22] === "1";
      this.HFGain = parseFloat(splittedPhrase[23]);
      this.HFFrq = parseFloat(splittedPhrase[24]);

      this.EQToBypass = splittedPhrase[25] === "1";
      this.EQToDynSC = splittedPhrase[26] === "1";

      this.HPFrq = parseFloat(splittedPhrase[27]);
      this.LPFrq = parseFloat(splittedPhrase[28]);

      this.FilterSplit = splittedPhrase[29] === "1";

      this.Gain = parseFloat(splittedPhrase[30]);

      this.Analog = splittedPhrase[31] === "1";

      this.VUShowOutput = splittedPhrase[34] === "1";

      this.PhaseReverse = splittedPhrase[39] === "1";
      this.InputTrim = parseFloat(splittedPhrase[40]);

      return true;
    }
    return false;
  }

  public toString(): string {
    const sb: string[] = [];

    sb.push(`PresetName: ${this.PresetName}`);
    if (this.PresetGroup !== null) {
      sb.push(`Group: ${this.PresetGroup}`);
    }
    sb.push(""); // Empty line

    // Dyn To Ch Out (Dynamics to Channel Out) moves the dynamics to the output, making it post-EQ.
    // Filter Split determines whether low pass and high pass filters are placed before the dynamics processors.
    // The routing diagram is determined based on the values of FilterSplit and DynToChannelOut, and the result
    // is appended to a StringBuilder (sb) to represent the routing configuration.
    // The routing options are:
    // 1. If FilterSplit is true and DynToChannelOut is true, the order is FLTR -> EQ -> DYN.
    // 2. If FilterSplit is true and DynToChannelOut is false, the order is FLTR -> DYN -> EQ.
    // 3. If FilterSplit is false, the default order is DYN -> FLTR -> EQ.
    sb.push("Routing Diagram: ");
    if (this.FilterSplit && this.DynToChannelOut) {
      sb.push("FLTR -> EQ -> DYN");
    } else if (this.FilterSplit && !this.DynToChannelOut) {
      sb.push("FLTR -> DYN -> EQ");
    } else if (!this.FilterSplit) {
      sb.push("DYN -> FLTR -> EQ (default)");
    }
    sb.push(""); // Empty line

    sb.push("Low and High Pass Filters:");
    sb.push(
      `\tHP Frequency (18 dB/octave): ${this.HPFrq.toFixed(2)} Hz (16 - 350 Hz)`
    );
    sb.push(
      `\tLP Frequency (12 dB/octave): ${this.LPFrq.toFixed(2)} KHz (22 - 30 KHz)`
    );
    sb.push(`\tFilter Split (Filters before Dynamics): ${this.FilterSplit}`);
    sb.push(""); // Empty line

    sb.push("Compression:");
    sb.push(`\tThreshold: ${this.CompThreshold.toFixed(2)} dB`);
    sb.push(`\tRatio: ${this.CompRatio.toFixed(2)}:1`);
    sb.push(
      `\tFast Attack: ${this.CompFastAttack} (Fast=1 ms otherwise Auto-Sense)`
    );
    sb.push(`\tRelease: ${this.CompRelease.toFixed(2)} s`);
    sb.push(""); // Empty line

    sb.push("Expander/Gate:");
    sb.push(`\tThreshold: ${this.ExpThreshold.toFixed(2)} dB`);
    sb.push(`\tRange: ${this.ExpRange.toFixed(2)} dB`);
    sb.push(`\tGate: ${this.ExpDisabledGateEnabled}`);
    sb.push(
      `\tFast Attack: ${this.ExpFastAttack} (Fast=1 ms otherwise Auto-Sense)`
    );
    sb.push(`\tRelease: ${this.ExpRelease.toFixed(2)} s`);
    sb.push(""); // Empty line

    sb.push("Dynamics To:");
    sb.push(`\tBypass: ${this.DynToByPass}`);
    sb.push(`\tChannel Out (Dynamics after EQ): ${this.DynToChannelOut}`);
    sb.push(""); // Empty line

    sb.push("EQ Section:");
    sb.push(`\tLF Type Bell: ${this.LFTypeBell}`);
    sb.push(`\tLF Gain: ${this.LFGain.toFixed(2)} dB`);
    sb.push(`\tLF Frequency: ${this.LFFrq.toFixed(2)} Hz`);

    sb.push(`\tLMF Gain: ${this.LMFGain.toFixed(2)} dB`);
    sb.push(`\tLMF Frequency: ${this.LMFFrq.toFixed(2)} KHz`);
    sb.push(`\tLMF Q: ${this.LMFQ.toFixed(2)}`);

    sb.push(`\tHMF Gain: ${this.HMFGain.toFixed(2)} dB`);
    sb.push(`\tHMF Frequency: ${this.HMFFrq.toFixed(2)} KHz`);
    sb.push(`\tHMF Q: ${this.HMFQ.toFixed(2)}`);

    sb.push(`\tHF Type Bell: ${this.HFTypeBell}`);
    sb.push(`\tHF Gain: ${this.HFGain.toFixed(2)} dB`);
    sb.push(`\tHF Frequency: ${this.HFFrq.toFixed(2)} KHz`);

    sb.push(`\tTo Bypass: ${this.EQToBypass}`);
    sb.push(`\tTo Dynamics Side-Chain: ${this.EQToDynSC}`);
    sb.push(""); // Empty line

    sb.push("Master Section:");
    sb.push(`\tGain: ${this.Gain.toFixed(2)} dB`);
    sb.push(`\tAnalog: ${this.Analog}`);
    sb.push(`\tVU Show Output: ${this.VUShowOutput}`);
    sb.push(`\tPhase Reverse: ${this.PhaseReverse}`);
    sb.push(`\tInput Trim : ${this.InputTrim.toFixed(2)} dB`);

    return sb.join("\n");
  }

  public generateRealWorldParameters(): string {
    const pb = new WavesPreset.ParamBuilder();

    pb.add(this.formatRealWorldParameter(this.CompThreshold))
      .add(this.formatRealWorldParameter(this.CompRatio))
      .addFlag(this.CompFastAttack)
      .add(this.formatRealWorldParameter(this.CompRelease))
      .addDelimiter()
      .newLine();

    pb.add(this.formatRealWorldParameter(this.ExpThreshold))
      .add(this.formatRealWorldParameter(this.ExpRange))
      .addFlag(this.ExpDisabledGateEnabled)
      .addFlag(this.ExpFastAttack)
      .add(this.formatRealWorldParameter(this.ExpRelease))
      .newLine();

    pb.addDelimiter()
      .addFlag(this.DynToByPass)
      .addFlag(this.DynToChannelOut)
      .addFlag(this.LFTypeBell)
      .add(this.formatRealWorldParameter(this.LFGain))
      .add(this.formatRealWorldParameter(this.LFFrq))
      .add(this.formatRealWorldParameter(this.LMFGain))
      .add(this.formatRealWorldParameter(this.LMFFrq))
      .add(this.formatRealWorldParameter(this.LMFQ))
      .newLine();

    pb.add(this.formatRealWorldParameter(this.HMFGain))
      .add(this.formatRealWorldParameter(this.HMFFrq))
      .add(this.formatRealWorldParameter(this.HMFQ))
      .addFlag(this.HFTypeBell)
      .add(this.formatRealWorldParameter(this.HFGain))
      .add(this.formatRealWorldParameter(this.HFFrq))
      .addFlag(this.EQToBypass)
      .addFlag(this.EQToDynSC)
      .add(this.formatRealWorldParameter(this.HPFrq))
      .newLine();

    pb.add(this.formatRealWorldParameter(this.LPFrq))
      .add(this.FilterSplit ? "1" : "0")
      .add(this.formatRealWorldParameter(this.Gain))
      .add(this.Analog ? "1" : "0")
      .addDelimiter()
      .addDelimiter()
      .addFlag(this.VUShowOutput)
      .addDelimiter()
      .addDelimiter()
      .newLine();

    pb.add("7")
      .add("-18")
      .addFlag(this.PhaseReverse)
      .add(this.formatRealWorldParameter(this.InputTrim))
      .add("* * * * *")
      .newLine();

    pb.add("* -18 -18 -18 -18 -18 -18 -18 -18").newLine();
    pb.add("0 0 ");

    return pb.toString();
  }

  private generatePresetXML(): object {
    const presetDataArray = [];

    // Check if PresetRealWorldParameters is undefined or empty
    if (
      !this.PresetRealWorldParameters ||
      this.PresetRealWorldParameters.size === 0
    ) {
      // Generate the real-world parameter string for the preset
      const parameters = this.generateRealWorldParameters();

      // Initialize PresetRealWorldParameters as a new Map
      this.PresetRealWorldParameters = new Map<
        string,
        WavesPresetSetupDetails
      >();

      // Define the setup key for the preset entry (example: "SETUP_A")
      const setupKey = "SETUP_A";

      // Optionally define the setup name, or leave undefined if not available
      const setupName = undefined;

      // Add a new entry to the map with the generated parameters,
      // the optional setup name, and mark this as the active preset
      this.PresetRealWorldParameters.set(setupKey, {
        realWorldParameters: parameters,
        presetSetupName: setupName,
        isActive: true,
      });
    }

    for (const [
      setupKey,
      details,
    ] of this.PresetRealWorldParameters.entries()) {
      const setupNameEntry =
        details.presetSetupName != null
          ? { "@_SetupName": details.presetSetupName }
          : {};

      presetDataArray.push({
        "@_Setup": setupKey,
        ...setupNameEntry,
        Parameters: {
          "@_Type": "RealWorld",
          // for some reason Waves presets have a space at the end which we need to add
          "#text": ensureTrailingSpace(details.realWorldParameters),
        },
      });
    }

    const presetData = {
      PresetChunkXMLTree: {
        "@_version": "2",
        Preset: {
          "@_Name": this.PresetName,
          "@_GenericType": this.PresetGenericType,
          PresetHeader: {
            PluginName: this.PresetPluginName,
            PluginSubComp: this.PresetPluginSubComp,
            PluginVersion: this.PresetPluginVersion,
            ActiveSetup: this.PresetActiveSetup,
            ReadOnly: "true",
          },
          PresetData: presetDataArray,
        },
      },
    };

    return presetData;
  }

  protected initCompChunkData(): void {
    const xmlContent = this.toXmlString(this.generatePresetXML());
    const xmlPostContent = '<Bypass Version="1.0" Bypass="0"/>\n';

    const encoder = new TextEncoder();
    const xmlContentBytes = encoder.encode(xmlContent);
    const xmlPostContentBytes = encoder.encode(xmlPostContent);

    const bf = new BinaryFile(undefined, ByteOrder.BigEndian);
    const writer = bf.binaryWriter;

    if (!writer) {
      throw new Error("Failed to create binary writer.");
    }

    // length of the xml section until xmlPostContent including 12 bytes
    const xmlContentFullLength = xmlContentBytes.length + 32; // This 32 is magic number from C#
    writer.writeUInt32(xmlContentFullLength);
    writer.writeUInt32(3);
    writer.writeUInt32(1);

    writer.writeString("SCHS");
    writer.writeString("setA");

    const xmlMainLength = xmlContentBytes.length;
    writer.writeUInt32(xmlMainLength);

    writer.writeString("XPst");
    writer.writeBytes(xmlContentBytes);

    writer.writeString("\0\0\0\0"); // C# writes "\0\0\0\0" as 4 bytes

    writer.writeBytes(xmlPostContentBytes);

    const buffer = writer.getBuffer();
    this.CompChunkData = buffer ? new Uint8Array(buffer) : new Uint8Array();
  }
}
