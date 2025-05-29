import * as fs from "fs";
import * as path from "path";
import * as midiFile from "midi-file";

import { puppeteerPlotlyToSVG } from "../../../jest.setup";
import { AbletonDevicePreset } from "../ableton/AbletonDevicePreset";
import { AbletonHandlers } from "../ableton/AbletonHandlers";
import { convertAutomationToMidi } from "../ableton/Midi";
import { toPlainObject } from "./helpers/testUtils";

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
  test("should handle Ableton Live Project files", async () => {
    const fileName = "Bayze - Move On REMAKE.als";
    const filePath = path.join(__dirname, `data/Ableton/${fileName}`);
    const fileContent = fs.readFileSync(filePath);
    const uint8ArrayRead = new Uint8Array(fileContent);

    const doList = false;
    const doVerbose = true;

    // Call the function with the file data
    const result = await AbletonHandlers.HandleAbletonLiveProject(
      uint8ArrayRead,
      fileName,
      doList,
      doVerbose
    );

    expect(result).toBeDefined();

    const cvpj = result?.cvpj;

    fs.writeFileSync(
      path.join(targetDir, "ableton_output_pre_convert.json"),
      JSON.stringify(cvpj, null, 2)
    );

    const devicePresetFiles = result?.devicePresetFiles;
    expect(devicePresetFiles).not.toBeNull();
    expect(devicePresetFiles?.length).toBeGreaterThan(0);

    if (devicePresetFiles) {
      devicePresetFiles.forEach((presetFile, _index) => {
        const filename = presetFile.filename;
        const extension = presetFile.getSuggestedExtension();
        const format = presetFile.format;
        const tempFilePath = path.join(targetDir, `${filename}.${extension}`);

        const originalXmlContent = presetFile.getOriginalXmlContent();
        if (originalXmlContent) {
          const tempOriginalXmlFilePath = path.join(
            targetDir,
            `${filename}.xml`
          );
          fs.writeFileSync(tempOriginalXmlFilePath, originalXmlContent);
        }

        if (AbletonDevicePreset.isBinaryFormat(format)) {
          fs.writeFileSync(tempFilePath, presetFile.getBinaryContent());
        } else if (AbletonDevicePreset.isStringFormat(format)) {
          fs.writeFileSync(tempFilePath, presetFile.getStringContent());
        } else if (AbletonDevicePreset.isPluginFormat(format)) {
          fs.writeFileSync(
            tempFilePath,
            JSON.stringify(presetFile.getPluginContent(), null, 2)
          );
        }
      });
    }
  });

  test("should convert Ableton Live Project file automation", async () => {
    const fileName = "Bayze - Move On REMAKE.als";
    const filePath = path.join(__dirname, `data/Ableton/${fileName}`);
    const fileContent = fs.readFileSync(filePath);
    const uint8ArrayRead = new Uint8Array(fileContent);

    const doList = false;
    const doVerbose = true;

    // Call the function with the file data
    const result = await AbletonHandlers.HandleAbletonLiveProject(
      uint8ArrayRead,
      fileName,
      doList,
      doVerbose
    );

    expect(result).toBeDefined();

    const cvpj = result?.cvpj;

    const midiAutomationConversionResult = convertAutomationToMidi(
      cvpj,
      fileName,
      true
    );

    const midiDataArray = midiAutomationConversionResult?.midiDataArray;

    expect(midiDataArray).not.toBeNull();
    expect(midiDataArray?.length).toBeGreaterThan(0);

    if (midiDataArray) {
      midiDataArray.forEach((automationMidi, _index) => {
        const midiData = automationMidi.midiData;
        const suggestedFileName = automationMidi.suggestedFileName;
        const tempFilePath = path.join(targetDir, `${suggestedFileName}.mid`);

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
        expect(toPlainObject(midiData)).toStrictEqual(
          toPlainObject(midiDataRead)
        );
      });
    }

    const midiDataLogArray = midiAutomationConversionResult?.midiLogArray;
    if (midiDataLogArray) {
      midiDataLogArray.forEach((automationMidiLog, _index) => {
        const midiDataLog = automationMidiLog.logString;
        const suggestedFileName = automationMidiLog.suggestedFileName;
        const tempFilePath = path.join(targetDir, `${suggestedFileName}.txt`);

        fs.writeFileSync(tempFilePath, midiDataLog);
      });
    }

    if (midiAutomationConversionResult?.automationPlotArray) {
      await Promise.all(
        midiAutomationConversionResult.automationPlotArray.map(
          async (automationPlot, _index) => {
            const plot = automationPlot.plot;
            const suggestedFileName = automationPlot.suggestedFileName;
            const fig = JSON.parse(plot); // Assuming 'plot' is the JSON string of the figure

            const tempFilePath = path.join(
              targetDir,
              `${suggestedFileName}.json`
            );

            fs.writeFileSync(tempFilePath, plot);

            // Use Puppeteer helper to get pure SVG string
            const svg = await puppeteerPlotlyToSVG(fig);

            const outputPath = path.join(targetDir, `${suggestedFileName}.svg`);

            fs.writeFileSync(outputPath, svg, "utf-8");
          }
        )
      );
    }
  }, 30000); // extend timeout for Puppeteer
});
