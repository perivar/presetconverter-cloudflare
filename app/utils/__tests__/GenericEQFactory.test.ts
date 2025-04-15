import * as fs from "fs";
import * as path from "path";

import { FabfilterProQ } from "../FabfilterProQ";
import { FabfilterProQ2 } from "../FabfilterProQ2";
import { FabfilterProQ3 } from "../FabfilterProQ3";
import { GenericEQFactory } from "../GenericEQFactory";
import {
  GenericEQShape,
  GenericEQSlope,
  GenericEQStereoPlacement,
} from "../GenericEQTypes";
import { SteinbergFrequency } from "../SteinbergFrequency";
import { VstPresetFactory } from "../VstPresetFactory";

// Helper function to load preset files
const loadPresetFile = (filePath: string): Uint8Array => {
  const fullPath = path.join(__dirname, filePath);
  const fileContent = fs.readFileSync(fullPath);
  return new Uint8Array(fileContent);
};

describe("GenericEQFactory", () => {
  describe("fromFabFilterProQ", () => {
    test("should convert FabFilter Pro-Q 1 preset correctly", () => {
      const presetData = loadPresetFile("data/Fabfilter/Q1-Vocal.ffp");
      const proQ = new FabfilterProQ();
      proQ.readFFP(presetData);

      const genericPreset = GenericEQFactory.fromFabFilterProQ(proQ);

      // --- Assertions for ProQ1 conversion ---
      // Note: ProQ1 FFP doesn't store name/vendor in a standard way the parser reads
      expect(genericPreset.Name).toBe("FabFilter Pro-Q");
      expect(genericPreset.Vendor).toBe("FabFilter");
      expect(genericPreset.Version).toBe("1"); // Factory sets this default

      expect(genericPreset.Bands.length).toBe(24); // ProQ1 has 24 bands

      // Values from Q1-Vocal.ffp

      const band1 = genericPreset.Bands[0];
      expect(band1).toEqual(
        expect.objectContaining({
          Enabled: true,
          Frequency: 6517.62,
          Gain: 1.08,
          Q: 1.0,
          Shape: GenericEQShape.Bell, // Shape 0
          Slope: GenericEQSlope.Slope24dB_oct, // Default from factory if not Cut/Shelf
          StereoPlacement: GenericEQStereoPlacement.Stereo, // StereoPlacement 2
        })
      );

      const band2 = genericPreset.Bands[1];
      expect(band2).toEqual(
        expect.objectContaining({
          Enabled: true,
          Frequency: 10031.31,
          Gain: 3.07,
          Q: 0.3,
          Shape: GenericEQShape.HighShelf, // Shape 3
          Slope: GenericEQSlope.Slope24dB_oct, // Default
          StereoPlacement: GenericEQStereoPlacement.Stereo, // StereoPlacement 2
        })
      );

      const band3 = genericPreset.Bands[2];
      expect(band3).toEqual(
        expect.objectContaining({
          Enabled: true,
          Frequency: 70.02,
          Gain: -4.24,
          Q: 0.3,
          Shape: GenericEQShape.LowShelf, // Shape 1
          Slope: GenericEQSlope.Slope24dB_oct, // Default
          StereoPlacement: GenericEQStereoPlacement.Stereo, // StereoPlacement 2
        })
      );

      const band4 = genericPreset.Bands[3];
      expect(band4).toEqual(
        expect.objectContaining({
          Enabled: true,
          Frequency: 40,
          Gain: 0.0, // Gain is irrelevant for Cut
          Q: 1.0,
          Shape: GenericEQShape.LowCut, // Shape 2 in ProQ1
          Slope: GenericEQSlope.Slope12dB_oct, // LPHPSlope 1 in ProQ1
          StereoPlacement: GenericEQStereoPlacement.Stereo, // StereoPlacement 2
        })
      );

      // Check an disabled band
      const lastBand = genericPreset.Bands[23];
      expect(lastBand.Enabled).toBe(false);
    });

    test("should convert FabFilter Pro-Q 2 preset correctly", () => {
      const presetData = loadPresetFile("data/Fabfilter/Q2-Vocal.ffp");
      const proQ2 = new FabfilterProQ2();
      proQ2.readFFP(presetData);

      const genericPreset = GenericEQFactory.fromFabFilterProQ(proQ2);

      // --- Assertions for ProQ2 conversion ---
      expect(genericPreset.Name).toBe("FabFilter Pro-Q 2");
      expect(genericPreset.Vendor).toBe("FabFilter");
      expect(genericPreset.Version).toBe("1"); // Factory sets this default

      expect(genericPreset.Bands.length).toBe(24); // ProQ2 has 24 bands

      // Values from Q2-Vocal.ffp
      const band1 = genericPreset.Bands[0];
      expect(band1).toEqual(
        expect.objectContaining({
          Enabled: true,
          Frequency: 6499.997851788689,
          Gain: 1.0,
          Q: 1.0,
          Shape: GenericEQShape.Bell, // Shape 0
          Slope: GenericEQSlope.Slope12dB_oct,
          StereoPlacement: GenericEQStereoPlacement.Stereo, // StereoPlacement 2
        })
      );

      const band2 = genericPreset.Bands[1];
      expect(band2).toEqual(
        expect.objectContaining({
          Enabled: true,
          Frequency: 9999.99804268092,
          Gain: 3.0,
          Q: 0.3000000038292504,
          Shape: GenericEQShape.HighShelf, // Shape 3
          Slope: GenericEQSlope.Slope12dB_oct,
          StereoPlacement: GenericEQStereoPlacement.Stereo, // StereoPlacement 2
        })
      );

      const band3 = genericPreset.Bands[2];
      expect(band3).toEqual(
        expect.objectContaining({
          Enabled: true,
          Frequency: 60.000011375881584,
          Gain: -3.0,
          Q: 0.3000000038292504,
          Shape: GenericEQShape.LowShelf, // Shape 1
          Slope: GenericEQSlope.Slope12dB_oct, // Slope 1
          StereoPlacement: GenericEQStereoPlacement.Stereo, // StereoPlacement 2
        })
      );

      const band4 = genericPreset.Bands[3];
      expect(band4).toEqual(
        expect.objectContaining({
          Enabled: true,
          Frequency: 30.000005687940792,
          Gain: 0.0,
          Q: 1.0,
          Shape: GenericEQShape.LowCut, // Shape 2
          Slope: GenericEQSlope.Slope12dB_oct, // Slope 1
          StereoPlacement: GenericEQStereoPlacement.Stereo, // StereoPlacement 2
        })
      );

      // Check a disabled band
      const lastBand = genericPreset.Bands[23];
      expect(lastBand.Enabled).toBe(false);
    });

    test("should convert FabFilter Pro-Q 3 preset correctly", () => {
      const presetData = loadPresetFile(
        "data/Fabfilter/Q3-Zedd Saw Chords.ffp"
      );
      const proQ3 = new FabfilterProQ3();
      proQ3.readFFP(presetData);

      const genericPreset = GenericEQFactory.fromFabFilterProQ(proQ3);

      // --- Assertions for ProQ3 conversion ---
      expect(genericPreset.Name).toBe("FabFilter Pro-Q 3");
      expect(genericPreset.Vendor).toBe("FabFilter");
      expect(genericPreset.Version).toBe("1"); // Factory sets this default

      expect(genericPreset.Bands.length).toBe(24); // ProQ3 has 24 bands

      // Values from Q3-Zedd Saw Chords.ffp
      const band1 = genericPreset.Bands[0];
      expect(band1).toEqual(
        expect.objectContaining({
          Enabled: true,
          Frequency: 99.72214661075441,
          Gain: 0.0,
          Q: 0.8688985076913297,
          Shape: GenericEQShape.LowCut, // Shape 2
          Slope: GenericEQSlope.Slope48dB_oct, // Slope 6
          StereoPlacement: GenericEQStereoPlacement.Stereo, // StereoPlacement 2
          DynamicRange: 0,
          DynamicThreshold: 1,
        })
      );

      const band2 = genericPreset.Bands[1];
      expect(band2).toEqual(
        expect.objectContaining({
          Enabled: true,
          Frequency: 228.7448516395526,
          Gain: 2.1224441528320312,
          Q: 2.076328369544847,
          Shape: GenericEQShape.Bell, // Shape 0
          Slope: GenericEQSlope.Slope12dB_oct, // Slope 1
          StereoPlacement: GenericEQStereoPlacement.Stereo, // StereoPlacement 2
          DynamicRange: 0,
          DynamicThreshold: 1,
        })
      );

      const band3 = genericPreset.Bands[2];
      expect(band3).toEqual(
        expect.objectContaining({
          Enabled: true,
          Frequency: 409.4091782708682,
          Gain: -3.0204086303710938,
          Q: 2.5707995846436855,
          Shape: GenericEQShape.Bell, // Shape 0
          Slope: GenericEQSlope.Slope12dB_oct,
          StereoPlacement: GenericEQStereoPlacement.Stereo, // StereoPlacement 2
          DynamicRange: 0,
          DynamicThreshold: 1,
        })
      );

      const band9 = genericPreset.Bands[8];
      expect(band9).toEqual(
        expect.objectContaining({
          Enabled: true,
          Frequency: 12709.496952111627,
          Gain: 0,
          Q: 0.980124115146417,
          Shape: GenericEQShape.HighCut, // Shape 4
          Slope: GenericEQSlope.Slope12dB_oct, // Slope 1
          StereoPlacement: GenericEQStereoPlacement.Stereo, // StereoPlacement 2
          DynamicRange: 0,
          DynamicThreshold: 1,
        })
      );

      // Check a disabled band
      const lastBand = genericPreset.Bands[23];
      expect(lastBand.Enabled).toBe(false);
    });
  });

  describe("fromSteinbergFrequency", () => {
    test("should convert Steinberg Frequency preset 'Boost High Side' correctly", () => {
      const presetData = loadPresetFile(
        "data/Steinberg/Frequency/Boost High Side (Stereo).vstpreset"
      );
      const vstPreset = VstPresetFactory.getVstPreset(presetData);
      if (!vstPreset || !(vstPreset instanceof SteinbergFrequency)) {
        throw new Error(
          "Failed to load or identify Steinberg Frequency preset"
        );
      }
      const frequencyPreset = vstPreset as SteinbergFrequency;
      frequencyPreset.readParameters(); // Crucial step

      const genericPreset =
        GenericEQFactory.fromSteinbergFrequency(frequencyPreset);

      // --- Assertions for Steinberg Frequency conversion ---
      expect(genericPreset.Name).toBe("Frequency");
      expect(genericPreset.Vendor).toBe("Steinberg Media Technologies");
      expect(genericPreset.Version).toBe("1"); // Factory sets this default
      expect(genericPreset.Bands.length).toBe(8); // Frequency has 8 bands

      // Values from Boost High Side (Stereo).vstpreset
      const band1 = genericPreset.Bands[0]; // Band 1
      expect(band1).toEqual(
        expect.objectContaining({
          Enabled: true, // bandOn: 1.0
          Frequency: 25.0, // freq: 25.0
          Gain: 0.0, // gain: 0.0
          Q: 1.0, // q: 1.0
          Shape: GenericEQShape.Bell, // type: 0
          Slope: GenericEQSlope.Slope12dB_oct, // type: 1
          StereoPlacement: GenericEQStereoPlacement.Stereo, // editChannel: 2 (Stereo)
          DynamicRange: undefined,
          DynamicThreshold: undefined,
        })
      );

      const band7 = genericPreset.Bands[6]; // Band 7
      expect(band7).toEqual(
        expect.objectContaining({
          Enabled: true, // bandOn: 1.0
          Frequency: 10000.0, // freq: 10000.0
          Gain: 0.0, // gain: 0.0
          Q: 1.0, // q: 1.0
          Shape: GenericEQShape.Bell, // type: 0
          Slope: GenericEQSlope.Slope12dB_oct,
          StereoPlacement: GenericEQStereoPlacement.Side, // editChannel: 4
          DynamicRange: undefined,
          DynamicThreshold: undefined,
        })
      );
    });

    test("should convert Steinberg Frequency preset 'Cut Low Side' correctly", () => {
      const presetData = loadPresetFile(
        "data/Steinberg/Frequency/Cut Low Side (Stereo).vstpreset"
      );
      const vstPreset = VstPresetFactory.getVstPreset(presetData);
      if (!vstPreset || !(vstPreset instanceof SteinbergFrequency)) {
        throw new Error(
          "Failed to load or identify Steinberg Frequency preset"
        );
      }
      const frequencyPreset = vstPreset as SteinbergFrequency;
      frequencyPreset.readParameters();

      const genericPreset =
        GenericEQFactory.fromSteinbergFrequency(frequencyPreset);

      // --- Assertions ---
      expect(genericPreset.Name).toBe("Frequency");
      expect(genericPreset.Vendor).toBe("Steinberg Media Technologies");
      expect(genericPreset.Bands.length).toBe(8);

      // Values from Cut Low Side (Stereo).vstpreset
      const band1 = genericPreset.Bands[0]; // Band 1
      expect(band1).toEqual(
        expect.objectContaining({
          Enabled: true, // bandOn: 1.0
          Frequency: 25.0, // freq: 25.0
          Gain: 0.0, // gain: 0.0
          Q: 1.0, // q: 1.0
          Shape: GenericEQShape.Bell, // type: 0
          Slope: GenericEQSlope.Slope12dB_oct, // type: 1
          StereoPlacement: GenericEQStereoPlacement.Side, // editChannel: 4
          DynamicRange: undefined,
          DynamicThreshold: undefined,
        })
      );

      // Check a disabled band
      const lastBand = genericPreset.Bands[7];
      expect(lastBand.Enabled).toBe(false);
    });
  });
});
