import * as fs from "fs";
import * as path from "path";

import { VstPresetFactory } from "../preset/VstPresetFactory";
import { WavesSSLComp } from "../preset/WavesSSLComp";
import { expectUint8ArraysToBeEqual } from "./helpers/testUtils";

// set this to true to debug the outputs as objects
const DO_DEBUG_OBJECT = false;

test("WavesSSLComp-readVstPreset-Masterbus-Charles-Dye-array", () => {
  const filePath = path.join(
    __dirname,
    "data/Waves/SSLComp Stereo/Masterbus Charles Dye.vstpreset"
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
      "data/Waves/SSLComp Stereo/Masterbus Charles Dye_tmp.vstpreset"
    );
    fs.writeFileSync(filePathWrite, uint8ArrayWrite);

    // Compare arrays using the helper function for better diff output on failure
    expectUint8ArraysToBeEqual(uint8ArrayWrite, uint8ArrayRead);
  }
});

test("WavesSSLComp-readXPS-SSLComp Settings", () => {
  const filePathXPS = path.join(
    __dirname,
    "data/Waves/WavesXPS/SSLComp Settings.xps"
  );
  const fileContentXPS = fs.readFileSync(filePathXPS, "utf8");

  const wavesSSLComps = WavesSSLComp.parseXml(fileContentXPS, WavesSSLComp);

  const wavesSSLComp = wavesSSLComps.find(
    preset => preset.PresetName === "Per Ivar - Pumping Parallell Bus"
  );

  if (DO_DEBUG_OBJECT) console.log(JSON.stringify(wavesSSLComp, null, 2));

  const uint8ArrayWrite = wavesSSLComp?.write();
  if (uint8ArrayWrite) {
    const filePathWrite = path.join(
      __dirname,
      "data/Waves/SSLComp Stereo/Pumping Parallell Bus_xps_tmp.vstpreset"
    );
    fs.writeFileSync(filePathWrite, uint8ArrayWrite);

    // compare with old preset
    const filePathVstPreset = path.join(
      __dirname,
      "data/Waves/SSLComp Stereo/Pumping Parallell Bus.vstpreset"
    );
    const fileContentVstPreset = fs.readFileSync(filePathVstPreset);
    const uint8ArrayRead = new Uint8Array(fileContentVstPreset);

    const vstPreset = VstPresetFactory.getVstPreset(uint8ArrayRead);
    if (vstPreset) {
      console.log(`${vstPreset.constructor.name}`);
    }

    // compare toString for both presets
    expect(vstPreset?.toString()).toBe(wavesSSLComp?.toString());
  }
});
