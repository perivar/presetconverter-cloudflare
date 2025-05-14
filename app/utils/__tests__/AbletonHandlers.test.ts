import * as fs from "fs";
import * as path from "path";

import { AbletonHandlers } from "../ableton/AbletonHandlers";

const targetDir = path.join(__dirname, "ableton-tests");

beforeAll(() => {
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }
});

afterAll(() => {
  // if (fs.existsSync(targetDir)) {
  //   fs.rmSync(targetDir, { recursive: true, force: true });
  // }
});

describe("AbletonHandlers", () => {
  it("should handle Ableton Live Project files", () => {
    const filePath = path.join(
      __dirname,
      "data/Ableton/Bayze - Move On REMAKE.als"
    );
    const fileContent = fs.readFileSync(filePath);
    const uint8ArrayRead = new Uint8Array(fileContent);

    // Define dummy arguments for the function
    const outputDirectoryPath = targetDir;
    const doList = false;
    const doVerbose = true;

    // Call the function with the file data
    const result = AbletonHandlers.HandleAbletonLiveProject(
      uint8ArrayRead,
      outputDirectoryPath,
      doList,
      doVerbose
    );

    // Add assertions based on the expected structure or content of the result
    // This is a basic assertion and should be refined based on the actual expected output
    expect(result).toBeDefined();
    // expect(result).toHaveProperty('someExpectedProperty');

    fs.writeFileSync(
      path.join(targetDir, "ableton_output_pre_convert.json"),
      JSON.stringify(result, null, 2)
    );
  });
});
