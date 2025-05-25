/**
 * Waves SSLComp
 */
/**
 * Ratio [2:1=0, 4:1=1, 10:1=2]
 */
export enum WavesSSLCompRatioType {
  Ratio_2_1 = 0,
  Ratio_4_1 = 1,
  Ratio_10_1 = 2,
}

/**
 * Attack [0 - 5, .1 ms, .3 ms, 1 ms, 3 ms, 10 ms, 30 ms)
 */
export enum WavesSSLCompAttackType {
  Attack_0_1 = 0,
  Attack_0_3 = 1,
  Attack_1 = 2,
  Attack_3 = 3,
  Attack_10 = 4,
  Attack_30 = 5,
}

/**
 * Release: 0 - 4, .1 s, .3 s, .6 s, 1.2 s, Auto (-1)
 */
export enum WavesSSLCompReleaseType {
  Release_0_1 = 0,
  Release_0_3 = 1,
  Release_0_6 = 2,
  Release_1_2 = 3,
  Release_Auto = 4,
}

/**
 * Fade [Off=0 or *, Out=1, In=2]
 */
export enum WavesSSLCompFadeType {
  Off = 0,
  On = 1,
}

/**
 * Waves SSLComp
 */
export class WavesSSLComp {
  PresetName: string = "";
  PresetGenericType: string = "SLCO";
  PresetGroup: string = "";
  PresetPluginName: string = "SSLComp";
  PresetPluginSubComp: string = "SLCS";
  PresetPluginVersion: string = "10.0.0.16";
  PresetActiveSetup: string = "SETUP_A";
  PresetSetupName: string = "";

  Threshold: number = 0; // Threshold (-15 - +15)
  Ratio: WavesSSLCompRatioType = WavesSSLCompRatioType.Ratio_4_1; // Ratio (2:1=0, 4:1=1, 10:1=2)
  Attack: WavesSSLCompAttackType = WavesSSLCompAttackType.Attack_1; // Attack [0 - 5, .1 ms, .3 ms, 1 ms, 3 ms, 10 ms, 30 ms)
  Release: WavesSSLCompReleaseType = WavesSSLCompReleaseType.Release_0_6; // Release: 0 - 4, .1 s, .3 s, .6 s, 1.2 s, Auto (-1)
  MakeupGain: number = 0; // Make-Up Gain (-5 - +15) dB
  RateS: number = 0; // Rate-S (1 - +60) seconds, Autofade duration. Variable from 1 to 60 seconds
  In: boolean = true; // In
  Analog: boolean = false; // Analog
  Fade: WavesSSLCompFadeType = WavesSSLCompFadeType.Off; // Fade [Off=0 or *, Out=1, In=2]
}
