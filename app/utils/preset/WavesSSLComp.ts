import { BinaryFile, ByteOrder } from "../binary/BinaryFile";
import { VstClassIDs } from "./VstClassIDs";
import { WavesPreset, WavesPresetSetupDetails } from "./WavesPreset";

// Ratio [2:1=0, 4:1=1, 10:1=2]
export enum RatioType {
  Ratio_2_1 = 0,
  Ratio_4_1 = 1,
  Ratio_10_1 = 2,
}

export function getWavesSSLCompRatioLabel(ratio: RatioType): string {
  switch (ratio) {
    case RatioType.Ratio_2_1:
      return "2:1";
    case RatioType.Ratio_4_1:
      return "4:1";
    case RatioType.Ratio_10_1:
      return "10:1";
    default:
      return "1:1";
  }
}

export function getWavesSSLCompNumericRatio(ratio?: RatioType): number {
  const map = {
    [RatioType.Ratio_2_1]: 2,
    [RatioType.Ratio_4_1]: 4,
    [RatioType.Ratio_10_1]: 10,
  };

  return map[ratio ?? RatioType.Ratio_2_1] ?? 1;
}

// Fade [Off=0 or *, Out=1, In=2]
export enum FadeType {
  Off = 0,
  Out = 1,
  In = 2,
}

export enum AttackType { // Attack [0 - 5, .1 ms, .3 ms, 1 ms, 3 ms, 10 ms, 30 ms)
  Attack_0_1,
  Attack_0_3,
  Attack_1,
  Attack_3,
  Attack_10,
  Attack_30,
}

export enum ReleaseType { // Release: 0 - 4, .1 s, .3 s, .6 s, 1.2 s, Auto (-1)
  Release_0_1,
  Release_0_3,
  Release_0_6,
  Release_1_2,
  Release_Auto,
}

/**
 * Waves SSLComp
 */
export class WavesSSLComp extends WavesPreset {
  public Threshold: number = 0;
  public Ratio: RatioType = RatioType.Ratio_2_1;
  public Attack: AttackType = AttackType.Attack_0_1;
  public Release: ReleaseType = ReleaseType.Release_0_1;
  public MakeupGain: number = 0;
  public RateS: number = 0;
  public In: boolean = false;
  public Analog: boolean = false;
  public Fade: FadeType = FadeType.Off;

  constructor(input?: Uint8Array) {
    super(input);
    this.Vst3ClassID = VstClassIDs.WavesSSLCompStereo;
    this.PlugInCategory = "Fx|Dynamics";
    this.PlugInName = "SSLComp Stereo";
    this.PlugInVendor = "Waves";
  }

  protected readRealWorldParameters(): boolean {
    // Note that the PresetPluginName is "SSLComp" even if the PlugInName is "SSLComp Stereo"
    if (this.PresetPluginName === "SSLComp") {
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

      // Threshold (-15 - +15)
      this.Threshold = parseFloat(splittedPhrase[0]); // compression threshold in dB

      // Ratio (2:1=0, 4:1=1, 10:1=2)
      this.Ratio = parseInt(splittedPhrase[1]) as RatioType;

      // Fade [Off=0 or *, Out=1, In=2]
      if (splittedPhrase[2] !== "*") {
        this.Fade = parseInt(splittedPhrase[2]) as FadeType;
      } else {
        this.Fade = FadeType.Off;
      }

      // Attack [0 - 5, .1 ms, .3 ms, 1 ms, 3 ms, 10 ms, 30 ms)
      this.Attack = parseInt(splittedPhrase[3]) as AttackType;

      // Release: 0 - 4, .1 s, .3 s, .6 s, 1.2 s, Auto
      this.Release = parseInt(splittedPhrase[4]) as ReleaseType;

      // Make-Up Gain (-5 - +15) dB
      this.MakeupGain = parseFloat(splittedPhrase[5]);

      // Rate-S (1 - +60) seconds, Autofade duration
      this.RateS = parseFloat(splittedPhrase[7]);

      // In (boolean flag)
      this.In = splittedPhrase[8] === "1";

      // Analog (boolean flag)
      this.Analog = splittedPhrase[9] === "1";

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

    sb.push("Compression:");
    sb.push(`\tThreshold: ${this.Threshold.toFixed(2)} dB`);
    sb.push(`\tMake-up Gain: ${this.MakeupGain.toFixed(2)} dB`);

    let attack = 0;
    switch (this.Attack) {
      case AttackType.Attack_0_1:
        attack = 0.1;
        break;
      case AttackType.Attack_0_3:
        attack = 0.3;
        break;
      case AttackType.Attack_1:
        attack = 1.0;
        break;
      case AttackType.Attack_3:
        attack = 3.0;
        break;
      case AttackType.Attack_10:
        attack = 10.0;
        break;
      case AttackType.Attack_30:
        attack = 30.0;
        break;
    }
    sb.push(`\tAttack: ${attack.toFixed(2)} ms`);

    if (this.Release === ReleaseType.Release_Auto) {
      sb.push("\tRelease: Auto");
    } else {
      let release = 0;
      switch (this.Release) {
        case ReleaseType.Release_0_1:
          release = 0.1;
          break;
        case ReleaseType.Release_0_3:
          release = 0.3;
          break;
        case ReleaseType.Release_0_6:
          release = 0.6;
          break;
        case ReleaseType.Release_1_2:
          release = 1.2;
          break;
      }
      sb.push(`\tRelease: ${release} s`);
    }

    sb.push(`\tRatio: ${this.Ratio}`);
    sb.push(`\tRate-S (Autofade duration): ${this.RateS} s`);
    sb.push(`\tIn: ${this.In}`);
    sb.push(`\tAnalog: ${this.Analog}`);
    sb.push(`\tFade: ${this.Fade}`);
    sb.push(""); // Empty line

    return sb.join("\n");
  }

  public generateRealWorldParameters(): string {
    const pb = new WavesPreset.ParamBuilder();

    // Threshold (-15 - +15)
    pb.add(this.formatRealWorldParameter(this.Threshold));

    // Ratio (2:1=0, 4:1=1, 10:1=2)
    pb.add(this.Ratio.toString());

    // Fade [Off=0 or *, Out=1, In=2]
    pb.add(this.Fade.toString());

    // Attack [0 - 5, .1 ms, .3 ms, 1 ms, 3 ms, 10 ms, 30 ms)
    pb.add(this.Attack.toString());

    // Release: 0 - 4, .1 s, .3 s, .6 s, 1.2 s, Auto
    pb.add(this.Release.toString());

    // Make-Up Gain (-5 - +15) dB
    pb.add(this.formatRealWorldParameter(this.MakeupGain));

    // *
    pb.add("*"); // Delimiter1

    // Rate-S (1 - +60) seconds (autofade duration)
    pb.add(this.formatRealWorldParameter(this.RateS));

    // In
    pb.add(this.In ? "1" : "0");

    // Analog
    pb.add(this.Analog ? "1" : "0");

    // Build the first line string and add newline
    pb.newLine();

    // Add second line literal string with newline
    pb.add(
      "0 0 0.94999999999999995559 1 0.94999999999999995559 * * * *"
    ).newLine();

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
          // for some reason Waves presets have a newline at the end which we need to add
          "#text": details.realWorldParameters + "\n",
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

    writer.writeString("SLCS");
    writer.writeString("setA");

    const xmlMainLength = xmlContentBytes.length;
    writer.writeUInt32(xmlMainLength);

    writer.writeString("XPst");
    writer.writeBytes(xmlContentBytes);

    // TODO: is this different for a vstpreset and a xps preset?
    // writer.writeString("Ref\0"); // The c# version writes these 4 bytes
    writer.writeBytes(new Uint8Array([0xa0, 0x84, 0x00, 0x00]));

    writer.writeBytes(xmlPostContentBytes);

    const buffer = writer.getBuffer();
    this.CompChunkData = buffer ? new Uint8Array(buffer) : new Uint8Array();
  }
}
