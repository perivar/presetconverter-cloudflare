import { FabFilterProQBaseToSteinbergFrequency } from "../converters/FabFilterProQBaseToSteinbergFrequency";
import {
  FabFilterProQ,
  ProQChannelMode,
  ProQLPHPSlope,
  ProQShape,
  ProQStereoPlacement,
} from "../preset/FabFilterProQ";
import {
  FabFilterProQ2,
  ProQ2ChannelMode,
  ProQ2Shape,
  ProQ2Slope,
  ProQ2StereoPlacement,
} from "../preset/FabFilterProQ2";
import {
  FabFilterProQ3,
  ProQ3Shape,
  ProQ3Slope,
  ProQ3StereoPlacement,
} from "../preset/FabFilterProQ3";
import {
  FrequencyBandMode1And8,
  FrequencyBandMode2To7,
  FrequencyChannelMode,
  SteinbergFrequency,
} from "../preset/SteinbergFrequency";
import { VstPreset } from "../preset/VstPreset";

describe("FabFilterProQBaseToSteinbergFrequency", () => {
  let frequency: SteinbergFrequency;

  beforeEach(() => {
    frequency = new SteinbergFrequency();
  });

  describe("toSteinbergFrequency", () => {
    it("should convert a simple Pro-Q preset with bell filters", () => {
      const proQ = new FabFilterProQ();
      proQ.Bands = [
        {
          Enabled: true,
          Shape: ProQShape.Bell,
          Frequency: 1000,
          Gain: 2.5,
          Q: 1.0,
          StereoPlacement: ProQStereoPlacement.Stereo,
          ChannelMode: ProQChannelMode.LeftRight,
          LPHPSlope: ProQLPHPSlope.Slope12dB_oct,
        },
        {
          Enabled: true,
          Shape: ProQShape.Bell,
          Frequency: 3000,
          Gain: -1.5,
          Q: 2.0,
          StereoPlacement: ProQStereoPlacement.Stereo,
          ChannelMode: ProQChannelMode.LeftRight,
          LPHPSlope: ProQLPHPSlope.Slope12dB_oct,
        },
      ];

      const result = FabFilterProQBaseToSteinbergFrequency.convertBase(proQ);

      expect(
        result.getParameterValue(`${VstPreset.CHUNK_COMP}equalizerAbandon1`)
      ).toBe(1.0);
      expect(
        result.getParameterValue(`${VstPreset.CHUNK_COMP}equalizerAgain1`)
      ).toBe(2.5);
      expect(
        result.getParameterValue(`${VstPreset.CHUNK_COMP}equalizerAfreq1`)
      ).toBe(1000);
      expect(
        result.getParameterValue(`${VstPreset.CHUNK_COMP}equalizerAq1`)
      ).toBe(1.0);
      expect(
        result.getParameterValue(`${VstPreset.CHUNK_COMP}equalizerAtype1`)
      ).toBe(FrequencyBandMode1And8.Peak);

      expect(
        result.getParameterValue(`${VstPreset.CHUNK_COMP}equalizerAbandon2`)
      ).toBe(1.0);
      expect(
        result.getParameterValue(`${VstPreset.CHUNK_COMP}equalizerAgain2`)
      ).toBe(-1.5);
      expect(
        result.getParameterValue(`${VstPreset.CHUNK_COMP}equalizerAfreq2`)
      ).toBe(3000);
      expect(
        result.getParameterValue(`${VstPreset.CHUNK_COMP}equalizerAq2`)
      ).toBe(2.0);
      expect(
        result.getParameterValue(`${VstPreset.CHUNK_COMP}equalizerAtype2`)
      ).toBe(FrequencyBandMode2To7.Peak);
    });

    it("should handle low cut and high cut filters", () => {
      const proQ2 = new FabFilterProQ2();
      proQ2.Bands = [
        {
          Enabled: true,
          Shape: ProQ2Shape.LowCut,
          Frequency: 100,
          Gain: 0,
          Q: 0.7,
          StereoPlacement: ProQ2StereoPlacement.Stereo,
          Slope: ProQ2Slope.Slope24dB_oct,
          ChannelMode: ProQ2ChannelMode.LeftRight,
        },
        {
          Enabled: true,
          Shape: ProQ2Shape.HighCut,
          Frequency: 10000,
          Gain: 0,
          Q: 0.7,
          StereoPlacement: ProQ2StereoPlacement.Stereo,
          Slope: ProQ2Slope.Slope12dB_oct,
          ChannelMode: ProQ2ChannelMode.LeftRight,
        },
      ];

      const result = FabFilterProQBaseToSteinbergFrequency.convertBase(proQ2);

      expect(
        result.getParameterValue(`${VstPreset.CHUNK_COMP}equalizerAbandon1`)
      ).toBe(1.0);
      expect(
        result.getParameterValue(`${VstPreset.CHUNK_COMP}equalizerAfreq1`)
      ).toBe(100);
      expect(
        result.getParameterValue(`${VstPreset.CHUNK_COMP}equalizerAq1`)
      ).toBe(0.7);
      expect(
        result.getParameterValue(`${VstPreset.CHUNK_COMP}equalizerAtype1`)
      ).toBe(FrequencyBandMode1And8.Cut24);

      expect(
        result.getParameterValue(`${VstPreset.CHUNK_COMP}equalizerAbandon8`)
      ).toBe(1.0);
      expect(
        result.getParameterValue(`${VstPreset.CHUNK_COMP}equalizerAfreq8`)
      ).toBe(10000);
      expect(
        result.getParameterValue(`${VstPreset.CHUNK_COMP}equalizerAq8`)
      ).toBe(0.7);
      expect(
        result.getParameterValue(`${VstPreset.CHUNK_COMP}equalizerAtype8`)
      ).toBe(FrequencyBandMode1And8.Cut12);
    });

    it("should handle different slope values for cut filters", () => {
      const proQ3 = new FabFilterProQ3();
      proQ3.Bands = [
        {
          Enabled: true,
          Shape: ProQ3Shape.LowCut,
          Frequency: 80,
          Gain: 0,
          Q: 0.7,
          StereoPlacement: ProQ3StereoPlacement.Stereo,
          Slope: ProQ3Slope.Slope96dB_oct,
          DynamicRange: 0,
          DynamicThreshold: 0,
        },
      ];

      const result = FabFilterProQBaseToSteinbergFrequency.convertBase(proQ3);
      expect(
        result.getParameterValue(`${VstPreset.CHUNK_COMP}equalizerAtype1`)
      ).toBe(FrequencyBandMode1And8.Cut96);
    });

    it("should handle stereo placement modes", () => {
      const proQ = new FabFilterProQ();
      proQ.Bands = [
        {
          Enabled: true,
          Shape: ProQShape.Bell,
          Frequency: 1000,
          Gain: 2.5,
          Q: 1.0,
          StereoPlacement: ProQStereoPlacement.LeftOrMid,
          ChannelMode: ProQChannelMode.MidSide,
          LPHPSlope: ProQLPHPSlope.Slope12dB_oct,
        },
        {
          Enabled: true,
          Shape: ProQShape.Bell,
          Frequency: 1000,
          Gain: 2.5,
          Q: 1.0,
          StereoPlacement: ProQStereoPlacement.RightOrSide,
          ChannelMode: ProQChannelMode.MidSide,
          LPHPSlope: ProQLPHPSlope.Slope12dB_oct,
        },
      ];

      const result = FabFilterProQBaseToSteinbergFrequency.convertBase(proQ);

      expect(
        result.getParameterValue(`${VstPreset.CHUNK_COMP}equalizerAon1`)
      ).toBe(1.0);
      expect(
        result.getParameterValue(`${VstPreset.CHUNK_COMP}equalizerAon1Ch2`)
      ).toBe(0.0);
      expect(
        result.getParameterValue(
          `${VstPreset.CHUNK_COMP}equalizerAeditchannel1`
        )
      ).toBe(FrequencyChannelMode.MidSideModeMid);

      expect(
        result.getParameterValue(`${VstPreset.CHUNK_COMP}equalizerAon2`)
      ).toBe(0.0);
      expect(
        result.getParameterValue(`${VstPreset.CHUNK_COMP}equalizerAon2Ch2`)
      ).toBe(1.0);
      expect(
        result.getParameterValue(
          `${VstPreset.CHUNK_COMP}equalizerAeditchannel2`
        )
      ).toBe(FrequencyChannelMode.MidSideModeSide);
    });

    it("should select bands with highest gain changes when more than 10 enabled bands", () => {
      const proQ = new FabFilterProQ();
      proQ.Bands = [
        {
          Enabled: true,
          Shape: ProQShape.LowCut,
          Frequency: 100,
          Gain: 0,
          Q: 0.7,
          StereoPlacement: ProQStereoPlacement.Stereo,
          ChannelMode: ProQChannelMode.LeftRight,
          LPHPSlope: ProQLPHPSlope.Slope12dB_oct,
        },
        {
          Enabled: true,
          Shape: ProQShape.HighCut,
          Frequency: 10000,
          Gain: 0,
          Q: 0.7,
          StereoPlacement: ProQStereoPlacement.Stereo,
          ChannelMode: ProQChannelMode.LeftRight,
          LPHPSlope: ProQLPHPSlope.Slope12dB_oct,
        },
        {
          Enabled: true,
          Shape: ProQShape.Bell,
          Frequency: 200,
          Gain: 10,
          Q: 1.0,
          StereoPlacement: ProQStereoPlacement.Stereo,
          ChannelMode: ProQChannelMode.LeftRight,
          LPHPSlope: ProQLPHPSlope.Slope12dB_oct,
        },
        {
          Enabled: true,
          Shape: ProQShape.Bell,
          Frequency: 400,
          Gain: 9,
          Q: 1.0,
          StereoPlacement: ProQStereoPlacement.Stereo,
          ChannelMode: ProQChannelMode.LeftRight,
          LPHPSlope: ProQLPHPSlope.Slope12dB_oct,
        },
        {
          Enabled: true,
          Shape: ProQShape.Bell,
          Frequency: 800,
          Gain: 8,
          Q: 1.0,
          StereoPlacement: ProQStereoPlacement.Stereo,
          ChannelMode: ProQChannelMode.LeftRight,
          LPHPSlope: ProQLPHPSlope.Slope12dB_oct,
        },
        {
          Enabled: true,
          Shape: ProQShape.Bell,
          Frequency: 1600,
          Gain: 7,
          Q: 1.0,
          StereoPlacement: ProQStereoPlacement.Stereo,
          ChannelMode: ProQChannelMode.LeftRight,
          LPHPSlope: ProQLPHPSlope.Slope12dB_oct,
        },
        {
          Enabled: true,
          Shape: ProQShape.Bell,
          Frequency: 3200,
          Gain: 6,
          Q: 1.0,
          StereoPlacement: ProQStereoPlacement.Stereo,
          ChannelMode: ProQChannelMode.LeftRight,
          LPHPSlope: ProQLPHPSlope.Slope12dB_oct,
        },
        {
          Enabled: true,
          Shape: ProQShape.Bell,
          Frequency: 6400,
          Gain: 5,
          Q: 1.0,
          StereoPlacement: ProQStereoPlacement.Stereo,
          ChannelMode: ProQChannelMode.LeftRight,
          LPHPSlope: ProQLPHPSlope.Slope12dB_oct,
        },
        {
          Enabled: true,
          Shape: ProQShape.Bell,
          Frequency: 8000,
          Gain: 4,
          Q: 1.0,
          StereoPlacement: ProQStereoPlacement.Stereo,
          ChannelMode: ProQChannelMode.LeftRight,
          LPHPSlope: ProQLPHPSlope.Slope12dB_oct,
        },
        {
          Enabled: true,
          Shape: ProQShape.Bell,
          Frequency: 9000,
          Gain: 3,
          Q: 1.0,
          StereoPlacement: ProQStereoPlacement.Stereo,
          ChannelMode: ProQChannelMode.LeftRight,
          LPHPSlope: ProQLPHPSlope.Slope12dB_oct,
        },
        {
          Enabled: true,
          Shape: ProQShape.Bell,
          Frequency: 1000,
          Gain: 2,
          Q: 1.0,
          StereoPlacement: ProQStereoPlacement.Stereo,
          ChannelMode: ProQChannelMode.LeftRight,
          LPHPSlope: ProQLPHPSlope.Slope12dB_oct,
        },
        {
          Enabled: true,
          Shape: ProQShape.Bell,
          Frequency: 5000,
          Gain: 1,
          Q: 1.0,
          StereoPlacement: ProQStereoPlacement.Stereo,
          ChannelMode: ProQChannelMode.LeftRight,
          LPHPSlope: ProQLPHPSlope.Slope12dB_oct,
        },
        {
          Enabled: true,
          Shape: ProQShape.Bell,
          Frequency: 7000,
          Gain: 0.5,
          Q: 1.0,
          StereoPlacement: ProQStereoPlacement.Stereo,
          ChannelMode: ProQChannelMode.LeftRight,
          LPHPSlope: ProQLPHPSlope.Slope12dB_oct,
        },
      ];

      const result = FabFilterProQBaseToSteinbergFrequency.convertBase(proQ);

      // Lowcut on band 1
      expect(
        result.getParameterValue(`${VstPreset.CHUNK_COMP}equalizerAbandon1`)
      ).toBe(1.0);
      expect(
        result.getParameterValue(`${VstPreset.CHUNK_COMP}equalizerAfreq1`)
      ).toBe(100);

      // Highcut on band 8
      expect(
        result.getParameterValue(`${VstPreset.CHUNK_COMP}equalizerAbandon8`)
      ).toBe(1.0);
      expect(
        result.getParameterValue(`${VstPreset.CHUNK_COMP}equalizerAfreq8`)
      ).toBe(10000);

      // Selected bands 2-7: the 6 with highest |gain|: 10,9,8,7,6,5 at frequencies 200,400,800,1600,3200,6400
      expect(
        result.getParameterValue(`${VstPreset.CHUNK_COMP}equalizerAbandon2`)
      ).toBe(1.0);
      expect(
        result.getParameterValue(`${VstPreset.CHUNK_COMP}equalizerAfreq2`)
      ).toBe(200);
      expect(
        result.getParameterValue(`${VstPreset.CHUNK_COMP}equalizerAgain2`)
      ).toBe(10);

      expect(
        result.getParameterValue(`${VstPreset.CHUNK_COMP}equalizerAbandon3`)
      ).toBe(1.0);
      expect(
        result.getParameterValue(`${VstPreset.CHUNK_COMP}equalizerAfreq3`)
      ).toBe(400);
      expect(
        result.getParameterValue(`${VstPreset.CHUNK_COMP}equalizerAgain3`)
      ).toBe(9);

      expect(
        result.getParameterValue(`${VstPreset.CHUNK_COMP}equalizerAbandon4`)
      ).toBe(1.0);
      expect(
        result.getParameterValue(`${VstPreset.CHUNK_COMP}equalizerAfreq4`)
      ).toBe(800);
      expect(
        result.getParameterValue(`${VstPreset.CHUNK_COMP}equalizerAgain4`)
      ).toBe(8);

      expect(
        result.getParameterValue(`${VstPreset.CHUNK_COMP}equalizerAbandon5`)
      ).toBe(1.0);
      expect(
        result.getParameterValue(`${VstPreset.CHUNK_COMP}equalizerAfreq5`)
      ).toBe(1600);
      expect(
        result.getParameterValue(`${VstPreset.CHUNK_COMP}equalizerAgain5`)
      ).toBe(7);

      expect(
        result.getParameterValue(`${VstPreset.CHUNK_COMP}equalizerAbandon6`)
      ).toBe(1.0);
      expect(
        result.getParameterValue(`${VstPreset.CHUNK_COMP}equalizerAfreq6`)
      ).toBe(3200);
      expect(
        result.getParameterValue(`${VstPreset.CHUNK_COMP}equalizerAgain6`)
      ).toBe(6);

      expect(
        result.getParameterValue(`${VstPreset.CHUNK_COMP}equalizerAbandon7`)
      ).toBe(1.0);
      expect(
        result.getParameterValue(`${VstPreset.CHUNK_COMP}equalizerAfreq7`)
      ).toBe(6400);
      expect(
        result.getParameterValue(`${VstPreset.CHUNK_COMP}equalizerAgain7`)
      ).toBe(5);

      // Ensure other bands are disabled
      expect(
        result.getParameterValue(`${VstPreset.CHUNK_COMP}equalizerAbandon9`)
      ).toBeUndefined();
    });

    it("should handle all filter shapes correctly", () => {
      const proQ2 = new FabFilterProQ2();
      proQ2.Bands = [
        {
          Enabled: true,
          Shape: ProQ2Shape.LowShelf,
          Frequency: 100,
          Gain: 2.0,
          Q: 1.0,
          StereoPlacement: ProQ2StereoPlacement.Stereo,
          ChannelMode: ProQ2ChannelMode.LeftRight,
          Slope: ProQ2Slope.Slope12dB_oct,
        },
        {
          Enabled: true,
          Shape: ProQ2Shape.HighShelf,
          Frequency: 10000,
          Gain: -2.0,
          Q: 1.0,
          StereoPlacement: ProQ2StereoPlacement.Stereo,
          ChannelMode: ProQ2ChannelMode.LeftRight,
          Slope: ProQ2Slope.Slope12dB_oct,
        },
        {
          Enabled: true,
          Shape: ProQ2Shape.Notch,
          Frequency: 5000,
          Gain: 0,
          Q: 2.0,
          StereoPlacement: ProQ2StereoPlacement.Stereo,
          ChannelMode: ProQ2ChannelMode.LeftRight,
          Slope: ProQ2Slope.Slope12dB_oct,
        },
        {
          Enabled: true,
          Shape: ProQ2Shape.BandPass,
          Frequency: 2000,
          Gain: 0,
          Q: 1.0,
          StereoPlacement: ProQ2StereoPlacement.Stereo,
          ChannelMode: ProQ2ChannelMode.LeftRight,
          Slope: ProQ2Slope.Slope12dB_oct,
        },
        {
          Enabled: true,
          Shape: ProQ2Shape.TiltShelf,
          Frequency: 1000,
          Gain: 1.5,
          Q: 1.0,
          StereoPlacement: ProQ2StereoPlacement.Stereo,
          ChannelMode: ProQ2ChannelMode.LeftRight,
          Slope: ProQ2Slope.Slope12dB_oct,
        },
      ];

      const result = FabFilterProQBaseToSteinbergFrequency.convertBase(proQ2);

      // Bands should be sorted by frequency:
      // 1. LowShelf (100 Hz)
      // 2. TiltShelf (1000 Hz) - mapped to Peak
      // 3. BandPass (2000 Hz)
      // 4. Notch (5000 Hz)
      // 5. HighShelf (10000 Hz)
      expect(
        result.getParameterValue(`${VstPreset.CHUNK_COMP}equalizerAtype1`)
      ).toBe(FrequencyBandMode1And8.LowShelf);
      expect(
        result.getParameterValue(`${VstPreset.CHUNK_COMP}equalizerAtype2`)
      ).toBe(
        FrequencyBandMode2To7.Peak // TiltShelf maps to Peak
      );
      expect(
        result.getParameterValue(`${VstPreset.CHUNK_COMP}equalizerAtype3`)
      ).toBe(
        FrequencyBandMode2To7.Peak // BandPass maps to Peak
      );
      expect(
        result.getParameterValue(`${VstPreset.CHUNK_COMP}equalizerAtype4`)
      ).toBe(FrequencyBandMode2To7.Notch);
      expect(
        result.getParameterValue(`${VstPreset.CHUNK_COMP}equalizerAtype5`)
      ).toBe(FrequencyBandMode2To7.HighShelf);
    });

    it("should sort bands by frequency", () => {
      const proQ = new FabFilterProQ();
      proQ.Bands = [
        {
          Enabled: true,
          Shape: ProQShape.Bell,
          Frequency: 3000,
          Gain: 0,
          Q: 1.0,
          StereoPlacement: ProQStereoPlacement.Stereo,
          ChannelMode: ProQChannelMode.LeftRight,
          LPHPSlope: ProQLPHPSlope.Slope12dB_oct,
        },
        {
          Enabled: true,
          Shape: ProQShape.Bell,
          Frequency: 1000,
          Gain: 0,
          Q: 1.0,
          StereoPlacement: ProQStereoPlacement.Stereo,
          ChannelMode: ProQChannelMode.LeftRight,
          LPHPSlope: ProQLPHPSlope.Slope12dB_oct,
        },
        {
          Enabled: true,
          Shape: ProQShape.Bell,
          Frequency: 2000,
          Gain: 0,
          Q: 1.0,
          StereoPlacement: ProQStereoPlacement.Stereo,
          ChannelMode: ProQChannelMode.LeftRight,
          LPHPSlope: ProQLPHPSlope.Slope12dB_oct,
        },
      ];

      const result = FabFilterProQBaseToSteinbergFrequency.convertBase(proQ);

      expect(
        result.getParameterValue(`${VstPreset.CHUNK_COMP}equalizerAfreq1`)
      ).toBe(1000);
      expect(
        result.getParameterValue(`${VstPreset.CHUNK_COMP}equalizerAfreq2`)
      ).toBe(2000);
      expect(
        result.getParameterValue(`${VstPreset.CHUNK_COMP}equalizerAfreq3`)
      ).toBe(3000);
    });
  });
});
