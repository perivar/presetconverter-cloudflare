import * as fs from "fs";
import * as path from "path";

import { VstPresetFactory } from "../preset/VstPresetFactory";
import { WavesSSLChannel } from "../preset/WavesSSLChannel";
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

test("WavesSSLChannel-readXPS-SSLChannel Settings", () => {
  const filePathXPS = path.join(
    __dirname,
    "data/Waves/WavesXPS/SSLChannel Settings.xps"
  );
  const fileContentXPS = fs.readFileSync(filePathXPS, "utf8");

  const wavesSSLChannels = WavesSSLChannel.parseXml(
    fileContentXPS,
    WavesSSLChannel
  );

  const wavesSSLChannel = wavesSSLChannels.find(
    preset => preset.PresetName === "MixCoach - Instant Awesome Vocal"
  );

  if (DO_DEBUG_OBJECT) console.log(JSON.stringify(wavesSSLChannel, null, 2));

  const uint8ArrayWrite = wavesSSLChannel?.write();
  if (uint8ArrayWrite) {
    const filePathVstPreset = path.join(
      __dirname,
      "data/Waves/SSLChannel Stereo/MixCoach - Instant Awesome Vocal.vstpreset"
    );
    const fileContentVstPreset = fs.readFileSync(filePathVstPreset);
    const uint8ArrayRead = new Uint8Array(fileContentVstPreset);

    const vstPreset = VstPresetFactory.getVstPreset(uint8ArrayRead);
    if (vstPreset) {
      console.log(`${vstPreset.constructor.name}`);
    }

    // compare toString for both presets
    expect(vstPreset?.toString()).toBe(wavesSSLChannel?.toString());
  }
});
