import * as fs from "fs";
import * as path from "path";

import { VstPresetFactory } from "../preset/VstPresetFactory";
import { expectUint8ArraysToBeEqual } from "./helpers/testUtils";

// set this to true to debug the outputs as objects
const DO_DEBUG_OBJECT = false;

test("WavesSSLChannel-readVstPreset-MixCoach-Instant-Awesome-Vocal-array", () => {
  const filePath = path.join(
    __dirname,
    "data/Waves/SSLChannel Stereo/MixCoach - Instant Awesome Vocal.vstpreset"
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
      "data/Waves/SSLChannel Stereo/MixCoach - Instant Awesome Vocal_tmp.vstpreset"
    );
    fs.writeFileSync(filePathWrite, uint8ArrayWrite);

    // Compare arrays using the helper function for better diff output on failure
    expectUint8ArraysToBeEqual(uint8ArrayWrite, uint8ArrayRead);
  }
});
