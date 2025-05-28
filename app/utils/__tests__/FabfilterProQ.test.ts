import * as fs from "fs";
import * as path from "path";

import { FabFilterProQ } from "../preset/FabFilterProQ";
import { ProQBaseBand } from "../preset/FabFilterProQBase";
import { VstPresetFactory } from "../preset/VstPresetFactory";
import { expectUint8ArraysToBeEqual, toPlainObject } from "./helpers/testUtils";

// set this to true to debug the outputs as objects
const DO_DEBUG_OBJECT = false;

test("FabFilterProQ-readFFP-Generic6", () => {
  const filePath = path.join(
    __dirname,
    "data/Fabfilter/Q1-genelec eq filters 6 Generic max boost.ffp"
  );
  const fileContent = fs.readFileSync(filePath);
  const uint8Array = new Uint8Array(fileContent);

  const proQ = new FabFilterProQ();
  proQ.readFFP(uint8Array);

  if (DO_DEBUG_OBJECT) console.log(JSON.stringify(proQ, null, 2));
  expect(toPlainObject(proQ)).toEqual(
    expect.objectContaining({
      Bands: [
        {
          ChannelMode: 0,
          Frequency: 63.5,
          Gain: -5.4,
          Q: 2.93,
          Shape: 0,
          LPHPSlope: 2,
          StereoPlacement: 2,
          Enabled: true,
        },
        {
          ChannelMode: 0,
          Frequency: 91.6,
          Gain: 14.2,
          Q: 2,
          Shape: 0,
          LPHPSlope: 2,
          StereoPlacement: 2,
          Enabled: true,
        },
        {
          ChannelMode: 0,
          Frequency: 136,
          Gain: -18.4,
          Q: 8.64,
          Shape: 0,
          LPHPSlope: 2,
          StereoPlacement: 2,
          Enabled: true,
        },
        {
          ChannelMode: 0,
          Frequency: 154,
          Gain: 16.6,
          Q: 14.31,
          Shape: 0,
          LPHPSlope: 2,
          StereoPlacement: 2,
          Enabled: true,
        },
        {
          ChannelMode: 0,
          Frequency: 170,
          Gain: -9.6,
          Q: 6.85,
          Shape: 0,
          LPHPSlope: 2,
          StereoPlacement: 2,
          Enabled: true,
        },
        {
          ChannelMode: 0,
          Frequency: 226,
          Gain: -5.8,
          Q: 15.94,
          Shape: 0,
          LPHPSlope: 2,
          StereoPlacement: 2,
          Enabled: true,
        },
        {
          ChannelMode: 0,
          Frequency: 249,
          Gain: -6.9,
          Q: 41.27,
          Shape: 0,
          LPHPSlope: 2,
          StereoPlacement: 2,
          Enabled: true,
        },
        {
          ChannelMode: 0,
          Frequency: 280,
          Gain: -8,
          Q: 30.08,
          Shape: 0,
          LPHPSlope: 2,
          StereoPlacement: 2,
          Enabled: true,
        },
        {
          ChannelMode: 0,
          Frequency: 389,
          Gain: -8.4,
          Q: 36.66,
          Shape: 0,
          LPHPSlope: 2,
          StereoPlacement: 2,
          Enabled: true,
        },
        {
          ChannelMode: 0,
          Frequency: 505,
          Gain: 12.2,
          Q: 39.39,
          Shape: 0,
          LPHPSlope: 2,
          StereoPlacement: 2,
          Enabled: true,
        },
        {
          ChannelMode: 0,
          Frequency: 654,
          Gain: -6.9,
          Q: 48.17,
          Shape: 0,
          LPHPSlope: 2,
          StereoPlacement: 2,
          Enabled: true,
        },
        {
          ChannelMode: 0,
          Frequency: 735,
          Gain: 10.6,
          Q: 39.01,
          Shape: 0,
          LPHPSlope: 2,
          StereoPlacement: 2,
          Enabled: true,
        },
        {
          ChannelMode: 0,
          Frequency: 770,
          Gain: -4.7,
          Q: 31.56,
          Shape: 0,
          LPHPSlope: 2,
          StereoPlacement: 2,
          Enabled: true,
        },
        {
          ChannelMode: 0,
          Frequency: 1067,
          Gain: -5.9,
          Q: 22.69,
          Shape: 0,
          LPHPSlope: 2,
          StereoPlacement: 2,
          Enabled: true,
        },
        {
          ChannelMode: 0,
          Frequency: 1275,
          Gain: -5.7,
          Q: 12.91,
          Shape: 0,
          LPHPSlope: 2,
          StereoPlacement: 2,
          Enabled: true,
        },
        {
          ChannelMode: 0,
          Frequency: 1889,
          Gain: 7.5,
          Q: 14.75,
          Shape: 0,
          LPHPSlope: 2,
          StereoPlacement: 2,
          Enabled: true,
        },
        {
          ChannelMode: 0,
          Frequency: 2129,
          Gain: -3.4,
          Q: 18.32,
          Shape: 0,
          LPHPSlope: 2,
          StereoPlacement: 2,
          Enabled: true,
        },
        {
          ChannelMode: 0,
          Frequency: 2829,
          Gain: -5.2,
          Q: 28.59,
          Shape: 0,
          LPHPSlope: 2,
          StereoPlacement: 2,
          Enabled: true,
        },
        {
          ChannelMode: 0,
          Frequency: 3221,
          Gain: -3,
          Q: 13.4,
          Shape: 0,
          LPHPSlope: 2,
          StereoPlacement: 2,
          Enabled: true,
        },
        {
          ChannelMode: 0,
          Frequency: 5126,
          Gain: -3.4,
          Q: 5.91,
          Shape: 0,
          LPHPSlope: 2,
          StereoPlacement: 2,
          Enabled: true,
        },
        {
          ChannelMode: 0,
          Frequency: 1000,
          Gain: 0,
          Q: 1,
          Shape: 0,
          LPHPSlope: 2,
          StereoPlacement: 2,
          Enabled: false,
        },
        {
          ChannelMode: 0,
          Frequency: 1000,
          Gain: 0,
          Q: 1,
          Shape: 0,
          LPHPSlope: 2,
          StereoPlacement: 2,
          Enabled: false,
        },
        {
          ChannelMode: 0,
          Frequency: 1000,
          Gain: 0,
          Q: 1,
          Shape: 0,
          LPHPSlope: 2,
          StereoPlacement: 2,
          Enabled: false,
        },
        {
          ChannelMode: 0,
          Frequency: 1000,
          Gain: 0,
          Q: 1,
          Shape: 0,
          LPHPSlope: 2,
          StereoPlacement: 2,
          Enabled: false,
        },
      ],
      Version: 2,
      ParameterCount: 180,
      OutputGain: 0,
      OutputPan: 0,
      DisplayRange: 2,
      ProcessMode: 0,
      ChannelMode: 0,
      Bypass: 0,
      ReceiveMidi: 0,
      Analyzer: 3,
      AnalyzerResolution: 1,
      AnalyzerSpeed: 2,
      SoloBand: -1,
    })
  );
});

test("FabFilterProQ-readFFP-Generic6-object", () => {
  const filePath = path.join(
    __dirname,
    "data/Fabfilter/Q1-genelec eq filters 6 Generic max boost.ffp"
  );
  const fileContent = fs.readFileSync(filePath);
  const uint8ArrayRead = new Uint8Array(fileContent);

  const proQRead = new FabFilterProQ();
  proQRead.readFFP(uint8ArrayRead);
  if (DO_DEBUG_OBJECT) console.log(JSON.stringify(proQRead, null, 2));

  const uint8ArrayWrite = proQRead.writeFFP();
  if (uint8ArrayWrite) {
    const proQWrite = new FabFilterProQ();
    proQWrite.readFFP(uint8ArrayWrite);
    if (DO_DEBUG_OBJECT) console.log(JSON.stringify(proQWrite, null, 2));

    expect(toPlainObject(proQRead)).toStrictEqual(toPlainObject(proQWrite));
  }
});

test("FabFilterProQ-readFFP-Generic6-array", () => {
  const filePath = path.join(
    __dirname,
    "data/Fabfilter/Q1-genelec eq filters 6 Generic max boost.ffp"
  );
  const fileContent = fs.readFileSync(filePath);
  const uint8ArrayRead = new Uint8Array(fileContent);

  const proQRead = new FabFilterProQ();
  proQRead.readFFP(uint8ArrayRead);
  if (DO_DEBUG_OBJECT) console.log(JSON.stringify(proQRead, null, 2));

  const uint8ArrayWrite = proQRead.writeFFP();
  if (uint8ArrayWrite) {
    // Compare arrays using the helper function for better diff output on failure
    expectUint8ArraysToBeEqual(uint8ArrayWrite, uint8ArrayRead);
  }
});

test("FabFilterProQ-compare-FXP-FFP-Generic", () => {
  // Load and parse FXP
  const fxpPath = path.join(
    __dirname,
    "data/Fabfilter/Q1-genelec eq filters 6 Generic max boost.fxp"
  );
  const fxpFileContent = fs.readFileSync(fxpPath);
  const fxpUint8Array = new Uint8Array(fxpFileContent);

  const { preset: fxpProQ, source } =
    VstPresetFactory.getFabFilterProQPresetFromFXP(fxpUint8Array);

  // Add a check to ensure fxpProQ is not null before proceeding
  if (!fxpProQ) {
    throw new Error(
      "Failed to read or initialize FXP using VstPresetFactory.getFabFilterProQPresetFromFXP"
    );
  }

  expect(fxpProQ).toBeInstanceOf(FabFilterProQ); // Check for Pro-Q 1
  expect(source).toBe("FabFilterProQ");
  if (DO_DEBUG_OBJECT)
    console.log(
      `FXP Bands (${fxpProQ.constructor.name}):`,
      JSON.stringify(fxpProQ.Bands, null, 2)
    );

  // Load and parse FFP
  const ffpPath = path.join(
    __dirname,
    "data/Fabfilter/Q1-genelec eq filters 6 Generic max boost.ffp"
  );
  const ffpFileContent = fs.readFileSync(ffpPath);
  const ffpUint8Array = new Uint8Array(ffpFileContent);
  const ffpProQ = new FabFilterProQ(); // Use Pro-Q 1 class
  ffpProQ.readFFP(ffpUint8Array);
  if (DO_DEBUG_OBJECT)
    console.log("FFP Bands:", JSON.stringify(ffpProQ.Bands, null, 2));

  // Filter out bands with Q values between 4o and 50 since the resolution of the conversions breaks down between these values
  // This is a workaround for the issue with the FabFilter Pro Q plugin
  const filterBands = (bands: ProQBaseBand[]) =>
    bands.filter(band => band.Q < 40 || band.Q > 50);

  const filteredFxpBands = filterBands(fxpProQ.Bands);
  const filteredFfpBands = filterBands(ffpProQ.Bands);

  // Compare filtered Bands
  expect(toPlainObject(filteredFxpBands)).toEqual(
    toPlainObject(filteredFfpBands)
  );
});
