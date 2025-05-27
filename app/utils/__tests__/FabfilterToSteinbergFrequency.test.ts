import { FabFilterToSteinbergFrequency } from "../converters/FabFilterToSteinbergFrequency";
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
  BandMode1And8,
  BandMode2To7,
  ChannelMode,
  SteinbergFrequency,
} from "../preset/SteinbergFrequency";

describe("FabFilterToSteinbergFrequency", () => {
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

      const result = FabFilterToSteinbergFrequency.convertBase(proQ);

      expect(result.getParameterValue("equalizerAbandon1")).toBe(1.0);
      expect(result.getParameterValue("equalizerAgain1")).toBe(2.5);
      expect(result.getParameterValue("equalizerAfreq1")).toBe(1000);
      expect(result.getParameterValue("equalizerAq1")).toBe(1.0);
      expect(result.getParameterValue("equalizerAtype1")).toBe(
        BandMode1And8.Peak
      );

      expect(result.getParameterValue("equalizerAbandon2")).toBe(1.0);
      expect(result.getParameterValue("equalizerAgain2")).toBe(-1.5);
      expect(result.getParameterValue("equalizerAfreq2")).toBe(3000);
      expect(result.getParameterValue("equalizerAq2")).toBe(2.0);
      expect(result.getParameterValue("equalizerAtype2")).toBe(
        BandMode2To7.Peak
      );
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

      const result = FabFilterToSteinbergFrequency.convertBase(proQ2);

      expect(result.getParameterValue("equalizerAbandon1")).toBe(1.0);
      expect(result.getParameterValue("equalizerAfreq1")).toBe(100);
      expect(result.getParameterValue("equalizerAq1")).toBe(0.7);
      expect(result.getParameterValue("equalizerAtype1")).toBe(
        BandMode1And8.Cut24
      );

      expect(result.getParameterValue("equalizerAbandon8")).toBe(1.0);
      expect(result.getParameterValue("equalizerAfreq8")).toBe(10000);
      expect(result.getParameterValue("equalizerAq8")).toBe(0.7);
      expect(result.getParameterValue("equalizerAtype8")).toBe(
        BandMode1And8.Cut12
      );
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

      const result = FabFilterToSteinbergFrequency.convertBase(proQ3);
      expect(result.getParameterValue("equalizerAtype1")).toBe(
        BandMode1And8.Cut96
      );
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

      const result = FabFilterToSteinbergFrequency.convertBase(proQ);

      expect(result.getParameterValue("equalizerAon1")).toBe(1.0);
      expect(result.getParameterValue("equalizerAon1Ch2")).toBe(0.0);
      expect(result.getParameterValue("equalizerAeditchannel1")).toBe(
        ChannelMode.MidSideModeMid
      );

      expect(result.getParameterValue("equalizerAon2")).toBe(0.0);
      expect(result.getParameterValue("equalizerAon2Ch2")).toBe(1.0);
      expect(result.getParameterValue("equalizerAeditchannel2")).toBe(
        ChannelMode.MidSideModeSide
      );
    });

    it("should skip disabled bands", () => {
      const proQ = new FabFilterProQ();
      proQ.Bands = [
        {
          Enabled: false,
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
          Frequency: 2000,
          Gain: 1.5,
          Q: 1.5,
          StereoPlacement: ProQStereoPlacement.Stereo,
          ChannelMode: ProQChannelMode.LeftRight,
          LPHPSlope: ProQLPHPSlope.Slope12dB_oct,
        },
      ];

      const result = FabFilterToSteinbergFrequency.convertBase(proQ);

      expect(result.getParameterValue("equalizerAbandon1")).toBe(0.0);
      expect(result.getParameterValue("equalizerAbandon2")).toBe(1.0);
      expect(result.getParameterValue("equalizerAfreq2")).toBe(2000);
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

      const result = FabFilterToSteinbergFrequency.convertBase(proQ2);

      // Bands should be sorted by frequency:
      // 1. LowShelf (100 Hz)
      // 2. TiltShelf (1000 Hz) - mapped to Peak
      // 3. BandPass (2000 Hz)
      // 4. Notch (5000 Hz)
      // 5. HighShelf (10000 Hz)
      expect(result.getParameterValue("equalizerAtype1")).toBe(
        BandMode1And8.LowShelf
      );
      expect(result.getParameterValue("equalizerAtype2")).toBe(
        BandMode2To7.Peak // TiltShelf maps to Peak
      );
      expect(result.getParameterValue("equalizerAtype3")).toBe(
        BandMode2To7.Peak // BandPass maps to Peak
      );
      expect(result.getParameterValue("equalizerAtype4")).toBe(
        BandMode2To7.Notch
      );
      expect(result.getParameterValue("equalizerAtype5")).toBe(
        BandMode2To7.HighShelf
      );
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

      const result = FabFilterToSteinbergFrequency.convertBase(proQ);

      expect(result.getParameterValue("equalizerAfreq1")).toBe(1000);
      expect(result.getParameterValue("equalizerAfreq2")).toBe(2000);
      expect(result.getParameterValue("equalizerAfreq3")).toBe(3000);
    });
  });
});
