import * as fs from "fs";
import * as path from "path";
import * as midiFile from "midi-file";

import { puppeteerPlotlyToSVG } from "../../../jest.setup";
import { AbletonHandlers } from "../ableton/AbletonHandlers";
import { convertAutomationToMidi } from "../ableton/Midi";

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
  test("should handle Ableton Live Project files", () => {
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

  test("should convert Ableton Live Project file automation", async () => {
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

    const midiAutomationConversionResult = convertAutomationToMidi(
      result,
      "bayze_automation",
      true
    );
    const midiDataArray = midiAutomationConversionResult?.midiDataArray;

    expect(midiDataArray).not.toBeNull();
    expect(midiDataArray?.length).toBeGreaterThan(0);

    if (midiDataArray) {
      midiDataArray.forEach((midiData, index) => {
        const tempFilePath = path.join(
          targetDir,
          `ableton_bayze_automation_${index}.mid`
        );

        // Convert MIDI data to bytes
        const outputArray = midiFile.writeMidi(midiData);
        const outputUint8Array = new Uint8Array(outputArray);

        // Write the MIDI data to a temporary file
        fs.writeFileSync(tempFilePath, outputUint8Array);

        // Read the file back
        const inputUint8Array = fs.readFileSync(tempFilePath);

        // Convert bytes to MIDI data
        const midiDataRead = midiFile.parseMidi(inputUint8Array);

        // Compare the original with the read
        // expect(toPlainObject(midiData)).toStrictEqual(
        //   toPlainObject(midiDataRead)
        // );

        // Clean up the temporary file
        // fs.unlinkSync(tempFilePath);
      });
    }

    if (midiAutomationConversionResult?.logString) {
      const tempFilePath = path.join(
        targetDir,
        `ableton_bayze_automation_midi.txt`
      );

      fs.writeFileSync(tempFilePath, midiAutomationConversionResult.logString);
    }

    if (midiAutomationConversionResult?.automationPlots) {
      await Promise.all(
        midiAutomationConversionResult.automationPlots.map(
          async (plot, _index) => {
            const fig = JSON.parse(plot); // Assuming 'plot' is the JSON string of the figure

            const suggestedFilePath =
              fig.layout?.meta?.suggestedFilename ??
              "ableton_bayze_automation_plot";

            const tempFilePath = path.join(
              targetDir,
              `${suggestedFilePath}.json`
            );

            fs.writeFileSync(tempFilePath, plot);

            // Use Puppeteer helper to get pure SVG string
            const svg = await puppeteerPlotlyToSVG(fig);

            const outputPath = path.join(targetDir, `${suggestedFilePath}.svg`);

            fs.writeFileSync(outputPath, svg, "utf-8");
          }
        )
      );
    }
  }, 30000); // extend timeout for Puppeteer
});
