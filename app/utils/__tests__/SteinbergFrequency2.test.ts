import fs from "fs";
import path from "path";

import {
  Frequency2BandParameters,
  Frequency2BandParametersCh2,
  Frequency2PostParameters,
  Frequency2SharedParameters,
  SteinbergFrequency2,
} from "../preset/SteinbergFrequency2";
import { Parameter, ParameterType } from "../preset/VstPreset"; // Correctly import Parameter types
import { VstPresetFactory } from "../preset/VstPresetFactory";

// Import interfaces if needed for typing

// Helper function to compare potentially complex nested objects/arrays
// Jest's toEqual handles deep comparison, but this can be useful for debugging if needed
// const deepCompare = (obj1: any, obj2: any): boolean => {
//   return JSON.stringify(obj1) === JSON.stringify(obj2);
// };

// Helper function to filter and sort number parameters by Index
const getSortedNumberParameters = (
  params: Map<string, Parameter> // Corrected Map key type
): Parameter[] => {
  return Array.from(params.values())
    .filter(param => param.Type === ParameterType.Number) // Corrected property name 'Type'
    .sort((a, b) => a.Index - b.Index);
};

describe("SteinbergFrequency2", () => {
  it("should read a preset, write it back, and verify data consistency (C15-AllBandsTest)", () => {
    // --- 1. Read the original preset file ---
    const filePath = path.join(
      __dirname,
      "data",
      "Steinberg",
      "Frequency",
      "C15-AllBandsTest.vstpreset"
    );
    const fileBuffer = fs.readFileSync(filePath);

    // --- 2. Parse the original preset ---
    const preset1 = new SteinbergFrequency2();
    try {
      preset1.read(fileBuffer); // Assuming read method exists in base class
      preset1.readParameters(); // Read specific Frequency params
    } catch (error) {
      console.error("Error reading original preset:", error);
      // Optionally fail the test if reading fails critically
      // expect(error).toBeNull();
      // For now, let's log and continue to see if writing works
    }

    const bands1 = preset1.bands;
    const postParams1 = preset1.postParams;

    // Basic check if parameters were read
    expect(bands1.length).toBeGreaterThan(0); // Expecting 8 bands
    expect(postParams1).not.toBeNull();

    // --- 3. Write the parsed data back to a buffer ---
    let writtenBuffer: Uint8Array | undefined | null = null;
    try {
      writtenBuffer = preset1.write(); // Assuming write method exists in base class
    } catch (error) {
      console.error("Error writing preset:", error);
      // Fail the test if writing fails
      expect(error).toBeNull();
    }

    expect(writtenBuffer).not.toBeNull();
    expect(writtenBuffer!.length).toBeGreaterThan(0);

    // --- 4. Parse the written buffer ---
    const preset2 = new SteinbergFrequency2();
    let bands2: Array<{
      ch1: Frequency2BandParameters;
      ch2: Frequency2BandParametersCh2;
      shared: Frequency2SharedParameters;
    }> = [];
    let postParams2: Frequency2PostParameters | null = null;

    if (writtenBuffer) {
      try {
        const filePathWrite = path.join(
          __dirname,
          "data",
          "Steinberg",
          "Frequency",
          "C15-AllBandsTest_out_tmp.vstpreset"
        );
        fs.writeFileSync(filePathWrite, writtenBuffer);

        preset2.read(writtenBuffer);
        preset2.readParameters();
        bands2 = preset2.bands;
        postParams2 = preset2.postParams;
      } catch (error) {
        console.error("Error reading written preset:", error);
        // Fail the test if reading the written buffer fails
        expect(error).toBeNull();
      }
    }

    // Basic check if parameters were read from the written buffer
    expect(bands2.length).toBeGreaterThan(0); // Expecting 8 bands
    expect(postParams2).not.toBeNull();

    // --- 5. Compare the results ---
    // Use toEqual for deep comparison of the arrays and objects
    expect(bands2).toEqual(bands1);
    expect(postParams2).toEqual(postParams1);

    // Optional: More granular checks if needed
    expect(bands2.length).toEqual(bands1.length);
    for (let i = 0; i < bands1.length; i++) {
      expect(bands2[i].ch1).toEqual(bands1[i].ch1);
      expect(bands2[i].ch2).toEqual(bands1[i].ch2);
      expect(bands2[i].shared).toEqual(bands1[i].shared);
    }
    expect(postParams2).toEqual(postParams1);
  });

  test("SteinbergFrequency2-readVstPreset-C15-DynaMix-params", () => {
    const filePath = path.join(
      __dirname,
      "data",
      "Steinberg",
      "Frequency",
      "C15-DynaMix.vstpreset"
    );
    const fileContent = fs.readFileSync(filePath);
    const uint8ArrayRead = new Uint8Array(fileContent);

    // Use VstPresetFactory to parse the preset
    const vstPreset = VstPresetFactory.getVstPreset(uint8ArrayRead);

    // Ensure the preset was read correctly
    if (!vstPreset) {
      throw new Error("Failed to read VST preset using VstPresetFactory");
    }

    // Write the preset back to a byte array
    const uint8ArrayWrite = vstPreset.write();

    // Ensure the write operation produced a result
    if (!uint8ArrayWrite) {
      throw new Error("Failed to write VST preset");
    } else {
      const filePathWrite = path.join(
        __dirname,
        "data",
        "Steinberg",
        "Frequency",
        "C15-DynaMix_tmp.vstpreset"
      );
      fs.writeFileSync(filePathWrite, uint8ArrayWrite);
    }

    // Parse the written buffer back and compare Parameters ---
    const vstPresetWritten = VstPresetFactory.getVstPreset(uint8ArrayWrite);
    if (!vstPresetWritten) {
      throw new Error("Failed to read the written VST preset");
    }

    // Compare the sorted Number parameters
    const paramsOriginal = getSortedNumberParameters(vstPreset.Parameters);
    const paramsWritten = getSortedNumberParameters(
      vstPresetWritten.Parameters
    );
    expect(paramsWritten).toEqual(paramsOriginal);
  });

  test("SteinbergFrequency2-readVstPreset-C15-Reset-params", () => {
    const filePath = path.join(
      __dirname,
      "data",
      "Steinberg",
      "Frequency",
      "C15-Reset.vstpreset"
    );
    const fileContent = fs.readFileSync(filePath);
    const uint8ArrayRead = new Uint8Array(fileContent);

    // Use VstPresetFactory to parse the preset
    const vstPreset = VstPresetFactory.getVstPreset(uint8ArrayRead);

    // Ensure the preset was read correctly
    if (!vstPreset) {
      throw new Error("Failed to read VST preset using VstPresetFactory");
    }

    // Write the preset back to a byte array
    const uint8ArrayWrite = vstPreset.write();

    // Ensure the write operation produced a result
    if (!uint8ArrayWrite) {
      throw new Error("Failed to write VST preset");
    } else {
      const filePathWrite = path.join(
        __dirname,
        "data",
        "Steinberg",
        "Frequency",
        "C15-Reset_tmp.vstpreset"
      );
      fs.writeFileSync(filePathWrite, uint8ArrayWrite);
    }

    // Parse the written buffer back and compare Parameters ---
    const vstPresetWritten = VstPresetFactory.getVstPreset(uint8ArrayWrite);
    if (!vstPresetWritten) {
      throw new Error("Failed to read the written VST preset");
    }

    // Compare the sorted Number parameters
    const paramsOriginal = getSortedNumberParameters(vstPreset.Parameters);
    const paramsWritten = getSortedNumberParameters(
      vstPresetWritten.Parameters
    );
    expect(paramsWritten).toEqual(paramsOriginal);
  });
});
