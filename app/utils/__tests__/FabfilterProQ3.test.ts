import * as fs from "fs";
import * as path from "path";

import { FabFilterProQ3 } from "../preset/FabFilterProQ3";
import { FabFilterProQBase } from "../preset/FabFilterProQBase";
import { FXPPresetFactory } from "../preset/FXPPresetFactory";
import { SteinbergVstPreset } from "../preset/SteinbergVstPreset";
import { VstPresetFactory } from "../preset/VstPresetFactory";
import { expectUint8ArraysToBeEqual, toPlainObject } from "./helpers/testUtils";

// set this to true to debug the outputs as objects
const DO_DEBUG_OBJECT = false;

test("FabFilterProQ3-readFFP-HighBass", () => {
  const filePath = path.join(
    __dirname,
    "data/Fabfilter/Q3-Fabfilter Pro-Q 3 High Bass.ffp"
  );
  const fileContent = fs.readFileSync(filePath);
  const uint8Array = new Uint8Array(fileContent);

  const proQ = new FabFilterProQ3();
  proQ.readFFP(uint8Array);

  if (DO_DEBUG_OBJECT) console.log(JSON.stringify(proQ, null, 2));
  expect(toPlainObject(proQ)).toEqual(
    expect.objectContaining({
      Bands: [
        {
          Enabled: true,
          Frequency: 29.999995772390594,
          Gain: 0,
          DynamicRange: 0,
          DynamicThreshold: 0,
          Q: 0.707106742313133,
          Shape: 1,
          Slope: 3,
          StereoPlacement: 2,
        },
        {
          Enabled: true,
          Frequency: 199.99998042680824,
          Gain: 0,
          DynamicRange: 0,
          DynamicThreshold: 0,
          Q: 0.707106742313133,
          Shape: 2,
          Slope: 6,
          StereoPlacement: 2,
        },
        {
          Enabled: true,
          Frequency: 999.9998532010654,
          Gain: 0,
          DynamicRange: 0,
          DynamicThreshold: 0,
          Q: 0.707106742313133,
          Shape: 0,
          Slope: 3,
          StereoPlacement: 2,
        },
        {
          Enabled: true,
          Frequency: 5992.893330021517,
          Gain: -8.553718566894531,
          DynamicRange: 0,
          DynamicThreshold: 0,
          Q: 0.707106742313133,
          Shape: 3,
          Slope: 3,
          StereoPlacement: 2,
        },
        {
          Enabled: false,
          Frequency: 99.99999021340412,
          Gain: 0,
          DynamicRange: 0,
          DynamicThreshold: 0,
          Q: 0.707106742313133,
          Shape: 0,
          Slope: 3,
          StereoPlacement: 2,
        },
        {
          Enabled: false,
          Frequency: 9999.99804268092,
          Gain: 0,
          DynamicRange: 0,
          DynamicThreshold: 0,
          Q: 0.707106742313133,
          Shape: 0,
          Slope: 3,
          StereoPlacement: 2,
        },
        {
          Enabled: false,
          Frequency: 5000.0023265242235,
          Gain: 0,
          DynamicRange: 0,
          DynamicThreshold: 0,
          Q: 0.707106742313133,
          Shape: 0,
          Slope: 3,
          StereoPlacement: 2,
        },
        {
          Enabled: false,
          Frequency: 18000.00594473561,
          Gain: 0,
          DynamicRange: 0,
          DynamicThreshold: 0,
          Q: 0.707106742313133,
          Shape: 4,
          Slope: 1,
          StereoPlacement: 2,
        },
        {
          Enabled: false,
          Frequency: 999.9998532010654,
          Gain: 0,
          DynamicRange: 0,
          DynamicThreshold: 1,
          Q: 1,
          Shape: 0,
          Slope: 3,
          StereoPlacement: 2,
        },
        {
          Enabled: false,
          Frequency: 999.9998532010654,
          Gain: 0,
          DynamicRange: 0,
          DynamicThreshold: 1,
          Q: 1,
          Shape: 0,
          Slope: 3,
          StereoPlacement: 2,
        },
        {
          Enabled: false,
          Frequency: 999.9998532010654,
          Gain: 0,
          DynamicRange: 0,
          DynamicThreshold: 1,
          Q: 1,
          Shape: 0,
          Slope: 3,
          StereoPlacement: 2,
        },
        {
          Enabled: false,
          Frequency: 999.9998532010654,
          Gain: 0,
          DynamicRange: 0,
          DynamicThreshold: 1,
          Q: 1,
          Shape: 0,
          Slope: 3,
          StereoPlacement: 2,
        },
        {
          Enabled: false,
          Frequency: 999.9998532010654,
          Gain: 0,
          DynamicRange: 0,
          DynamicThreshold: 1,
          Q: 1,
          Shape: 0,
          Slope: 3,
          StereoPlacement: 2,
        },
        {
          Enabled: false,
          Frequency: 999.9998532010654,
          Gain: 0,
          DynamicRange: 0,
          DynamicThreshold: 1,
          Q: 1,
          Shape: 0,
          Slope: 3,
          StereoPlacement: 2,
        },
        {
          Enabled: false,
          Frequency: 999.9998532010654,
          Gain: 0,
          DynamicRange: 0,
          DynamicThreshold: 1,
          Q: 1,
          Shape: 0,
          Slope: 3,
          StereoPlacement: 2,
        },
        {
          Enabled: false,
          Frequency: 999.9998532010654,
          Gain: 0,
          DynamicRange: 0,
          DynamicThreshold: 1,
          Q: 1,
          Shape: 0,
          Slope: 3,
          StereoPlacement: 2,
        },
        {
          Enabled: false,
          Frequency: 999.9998532010654,
          Gain: 0,
          DynamicRange: 0,
          DynamicThreshold: 1,
          Q: 1,
          Shape: 0,
          Slope: 3,
          StereoPlacement: 2,
        },
        {
          Enabled: false,
          Frequency: 999.9998532010654,
          Gain: 0,
          DynamicRange: 0,
          DynamicThreshold: 1,
          Q: 1,
          Shape: 0,
          Slope: 3,
          StereoPlacement: 2,
        },
        {
          Enabled: false,
          Frequency: 999.9998532010654,
          Gain: 0,
          DynamicRange: 0,
          DynamicThreshold: 1,
          Q: 1,
          Shape: 0,
          Slope: 3,
          StereoPlacement: 2,
        },
        {
          Enabled: false,
          Frequency: 999.9998532010654,
          Gain: 0,
          DynamicRange: 0,
          DynamicThreshold: 1,
          Q: 1,
          Shape: 0,
          Slope: 3,
          StereoPlacement: 2,
        },
        {
          Enabled: false,
          Frequency: 999.9998532010654,
          Gain: 0,
          DynamicRange: 0,
          DynamicThreshold: 1,
          Q: 1,
          Shape: 0,
          Slope: 3,
          StereoPlacement: 2,
        },
        {
          Enabled: false,
          Frequency: 999.9998532010654,
          Gain: 0,
          DynamicRange: 0,
          DynamicThreshold: 1,
          Q: 1,
          Shape: 0,
          Slope: 3,
          StereoPlacement: 2,
        },
        {
          Enabled: false,
          Frequency: 999.9998532010654,
          Gain: 0,
          DynamicRange: 0,
          DynamicThreshold: 1,
          Q: 1,
          Shape: 0,
          Slope: 3,
          StereoPlacement: 2,
        },
        {
          Enabled: false,
          Frequency: 999.9998532010654,
          Gain: 0,
          DynamicRange: 0,
          DynamicThreshold: 1,
          Q: 1,
          Shape: 0,
          Slope: 3,
          StereoPlacement: 2,
        },
      ],
      Version: 4,
      ParameterCount: 358,
      UnknownParameters: [
        0, 1, 1, 0, 0, 0, 0, 0, 0, 1, 1, -1, 1, 2, 2, 3, 0, 1, 1, 2, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      ],
    })
  );
});

test("FabFilterProQ3-readFFP-HighBass-object", () => {
  const filePath = path.join(
    __dirname,
    "data/Fabfilter/Q3-Fabfilter Pro-Q 3 High Bass.ffp"
  );
  const fileContent = fs.readFileSync(filePath);
  const uint8ArrayRead = new Uint8Array(fileContent);

  const proQRead = new FabFilterProQ3();
  proQRead.readFFP(uint8ArrayRead);
  if (DO_DEBUG_OBJECT) console.log(JSON.stringify(proQRead, null, 2));

  const uint8ArrayWrite = proQRead.writeFFP();
  if (uint8ArrayWrite) {
    const proQWrite = new FabFilterProQ3();
    proQWrite.readFFP(uint8ArrayWrite);
    if (DO_DEBUG_OBJECT) console.log(JSON.stringify(proQWrite, null, 2));

    expect(toPlainObject(proQRead)).toStrictEqual(toPlainObject(proQWrite));
  }
});

test("FabFilterProQ3-readFFP-HighBass-array", () => {
  const filePath = path.join(
    __dirname,
    "data/Fabfilter/Q3-Fabfilter Pro-Q 3 High Bass.ffp"
  );
  const fileContent = fs.readFileSync(filePath);
  const uint8ArrayRead = new Uint8Array(fileContent);

  const proQRead = new FabFilterProQ3();
  proQRead.readFFP(uint8ArrayRead);
  if (DO_DEBUG_OBJECT) console.log(JSON.stringify(proQRead, null, 2));

  const uint8ArrayWrite = proQRead.writeFFP();
  if (uint8ArrayWrite) {
    // Compare arrays using the helper function for better diff output on failure
    expectUint8ArraysToBeEqual(uint8ArrayWrite, uint8ArrayRead);
  }
});

test("FabFilterProQ3-readVstPreset-HighBass-array", () => {
  const filePath = path.join(
    __dirname,
    "data/Fabfilter/Q3-Fabfilter Pro-Q 3 High Bass.vstpreset"
  );
  const fileContent = fs.readFileSync(filePath);
  const uint8ArrayRead = new Uint8Array(fileContent);

  // Get original preset (will be FabFilterProQ3 as a VST3 version)
  const originalPreset = VstPresetFactory.getVstPreset(uint8ArrayRead);
  if (!originalPreset) {
    throw new Error("Failed to read VST preset");
  }
  if (DO_DEBUG_OBJECT) console.log(JSON.stringify(originalPreset, null, 2));

  // Create new SteinbergVstPreset and copy data since the original is a VST3 version
  const steinbergPreset = new SteinbergVstPreset();
  steinbergPreset.Vst3ClassID = originalPreset.Vst3ClassID;
  steinbergPreset.PlugInCategory = originalPreset.PlugInCategory;
  steinbergPreset.PlugInName = originalPreset.PlugInName;
  steinbergPreset.PlugInVendor = originalPreset.PlugInVendor;
  steinbergPreset.CompChunkData =
    originalPreset.CompChunkData ?? new Uint8Array();
  steinbergPreset.ContChunkData =
    originalPreset.ContChunkData ?? new Uint8Array();
  steinbergPreset.doSkipInfoXml = true;

  const uint8ArrayWrite = steinbergPreset.write();
  if (uint8ArrayWrite) {
    const filePathWrite = path.join(
      __dirname,
      "data/Fabfilter/Q3-Fabfilter Pro-Q 3 High Bass_tmp.vstpreset"
    );
    fs.writeFileSync(filePathWrite, uint8ArrayWrite);

    // Compare arrays using the helper function for better diff output on failure
    expectUint8ArraysToBeEqual(uint8ArrayWrite, uint8ArrayRead);
  }
});

test("FabFilterProQ3-readFFP-Zedd-array", () => {
  const filePath = path.join(
    __dirname,
    "data/Fabfilter/Q3-Zedd Saw Chords.ffp"
  );
  const fileContent = fs.readFileSync(filePath);
  const uint8ArrayRead = new Uint8Array(fileContent);

  const proQRead = new FabFilterProQ3();
  proQRead.readFFP(uint8ArrayRead);
  if (DO_DEBUG_OBJECT) console.log(JSON.stringify(proQRead, null, 2));

  const uint8ArrayWrite = proQRead.writeFFP();
  if (uint8ArrayWrite) {
    // Compare arrays using the helper function for better diff output on failure
    expectUint8ArraysToBeEqual(uint8ArrayWrite, uint8ArrayRead);
  }
});

test("FabFilterProQ3-compare-FXP-FFP-HighBass", () => {
  // Load and parse FXP
  const fxpPath = path.join(
    __dirname,
    "data/Fabfilter/Q3-Fabfilter Pro-Q 3 High Bass.fxp"
  );
  const fxpFileContent = fs.readFileSync(fxpPath);
  const fxpUint8Array = new Uint8Array(fxpFileContent);
  const { preset: fxpProQ, source } =
    FXPPresetFactory.getPresetFromFXP(fxpUint8Array);

  // Add a check to ensure fxpProQ is not null before proceeding
  if (!fxpProQ) {
    throw new Error(
      "Failed to read or initialize FXP using FXPPresetFactory.getPresetFromFXP"
    );
  }

  expect(fxpProQ).toBeInstanceOf(FabFilterProQ3); // Keep this check as we know the test file is Q3
  expect(source).toBe("FabFilterProQ3");
  if (DO_DEBUG_OBJECT)
    console.log(
      `FXP Bands (${fxpProQ.constructor.name}):`,
      JSON.stringify((fxpProQ as FabFilterProQBase).Bands, null, 2)
    );

  // Load and parse FFP
  const ffpPath = path.join(
    __dirname,
    "data/Fabfilter/Q3-Fabfilter Pro-Q 3 High Bass.ffp"
  );
  const ffpFileContent = fs.readFileSync(ffpPath);
  const ffpUint8Array = new Uint8Array(ffpFileContent);
  const ffpProQ = new FabFilterProQ3();
  ffpProQ.readFFP(ffpUint8Array);
  if (DO_DEBUG_OBJECT)
    console.log("FFP Bands:", JSON.stringify(ffpProQ.Bands, null, 2));

  // Compare Bands
  expect(toPlainObject((fxpProQ as FabFilterProQBase).Bands)).toEqual(
    toPlainObject(ffpProQ.Bands)
  );
});

test("FabFilterProQ3-readVstPreset-Zedd-array", () => {
  const filePath = path.join(
    __dirname,
    "data/Fabfilter/Q3-Zedd Saw Chords.vstpreset"
  );
  const fileContent = fs.readFileSync(filePath);
  const uint8ArrayRead = new Uint8Array(fileContent);

  const vstPreset = VstPresetFactory.getVstPreset(uint8ArrayRead);
  if (vstPreset) {
    console.log(`${vstPreset.constructor.name}`);
  }
  if (DO_DEBUG_OBJECT) console.log(JSON.stringify(vstPreset, null, 2));

  const uint8ArrayWrite = vstPreset?.write();
  if (uint8ArrayWrite) {
    const filePathWrite = path.join(
      __dirname,
      "data/Fabfilter/Q3-Zedd Saw Chords_tmp.vstpreset"
    );
    fs.writeFileSync(filePathWrite, uint8ArrayWrite);

    // Compare arrays using the helper function for better diff output on failure
    expectUint8ArraysToBeEqual(uint8ArrayWrite, uint8ArrayRead);
  }
});
