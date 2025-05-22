import { XMLParser, XMLValidator } from "fast-xml-parser"; // Import necessary classes

import { IOUtils } from "../IOUtils"; // Import IOUtils
import { AbletonProject } from "./AbletonProject";
import { Log } from "./Log"; // Assuming Log is needed

// Assuming File and Path equivalents exist or are handled appropriately in the TS environment
// For XML parsing, AbletonProject already uses 'fast-xml-parser'.
// For encoding, Node.js 'buffer' or 'text-encoding' might be used, or assume UTF-8 string from file read.

export class AbletonHandlers {
  /**
   * Handles Ableton Live Project files (.als).
   * Ported from DotNet/Program.cs HandleAbletonLiveProject.
   * @param fileData The file content as a Uint8Array.
   * @param fileName The file name for context.
   * @param doList Whether to list content (currently not fully implemented in TS port).
   * @param doVerbose Whether to output verbose information.
   */
  public static HandleAbletonLiveProject(
    fileData: Uint8Array,
    fileName: string,
    doList: boolean, // Not fully used in TS port yet
    doVerbose: boolean
  ): any {
    Log.Information(`Handling Ableton Live Project: ${fileName}`);

    try {
      let decompressedBytes = fileData;
      // Check for gzip magic bytes (0x1F, 0x8B)
      if (
        fileData.length >= 2 &&
        fileData[0] === 0x1f &&
        fileData[1] === 0x8b
      ) {
        Log.Debug("Detected gzip compression. Decompressing...");
        decompressedBytes = IOUtils.Decompress(fileData); // Use the ported Decompress
      } else {
        Log.Debug("No gzip compression detected.");
      }

      // Assuming decompressedBytes is UTF-8 encoded XML
      const xmlString = new TextDecoder("utf-8").decode(decompressedBytes);

      // AbletonProject.handleAbletonLiveContent handles the XML parsing and processing
      const convertedProject = AbletonProject.handleAbletonLiveContent(
        xmlString,
        fileName,
        doList,
        doVerbose
      );

      if (convertedProject) {
        Log.Information(
          `Successfully processed Ableton Live Project: ${fileName}`
        );
        return convertedProject;
      } else {
        Log.Error(`Failed to process Ableton Live Project: ${fileName}`);
      }
    } catch (error) {
      Log.Error(
        `Error handling Ableton Live Project (${fileName}): ${error instanceof Error ? error.message : error}`
      );
    }
  }

  /**
   * Handles Ableton Live Preset files (.adv).
   * Ported from DotNet/Program.cs HandleAbletonLivePreset.
   * @param fileData The file content as a Uint8Array.
   * @param fileName The file name for context.
   */
  public static HandleAbletonLivePreset(
    fileData: Uint8Array,
    fileName: string
  ): any {
    Log.Information(`Handling Ableton Live Preset: ${fileName}`);

    try {
      let decompressedBytes = fileData;
      // Check for gzip magic bytes (0x1F, 0x8B)
      if (
        fileData.length >= 2 &&
        fileData[0] === 0x1f &&
        fileData[1] === 0x8b
      ) {
        Log.Debug("Detected gzip compression. Decompressing...");
        decompressedBytes = IOUtils.Decompress(fileData); // Use the ported Decompress
      } else {
        Log.Debug("No gzip compression detected.");
      }

      // Assuming decompressedBytes is UTF-8 encoded XML
      const xmlString = new TextDecoder("utf-8").decode(decompressedBytes);

      // Parse the XML string
      // Note: The original C# code parsed the XML here and then passed the rootXElement
      // to AbletonProject.DoDevices. We need to replicate that structure.
      const parser = new XMLParser({
        // Instantiate XMLParser directly
        ignoreAttributes: false,
        attributeNamePrefix: "@_",
        parseAttributeValue: true,
      });
      let rootXElement: any;
      try {
        // Basic validation check
        const validationResult = XMLValidator.validate(xmlString); // Instantiate XMLValidator directly
        if (validationResult !== true) {
          Log.Warning(
            `XML structure validation failed for preset: ${validationResult.err?.msg}. Attempting to parse anyway.` // Removed fileName from log
          );
        }
        rootXElement = parser.parse(xmlString);
      } catch (error) {
        Log.Error(
          `XML Parsing Error for preset: ${error instanceof Error ? error.message : error}` // Removed fileName from log
        );
        return; // Stop processing this preset on parse error
      }

      // TODO: Fix this!
      // The C# code calls AbletonProject.DoDevices directly with the root element
      // and a specific location identifier ["preset"].
      // We need to find the relevant device element within the preset XML.
      // Based on typical Ableton preset structure, the device is often directly under the root.
      // Let's assume the root element *is* the device element for simplicity,
      // or that the relevant device is the first child element that is an object.

      // const deviceElement = rootXElement
      //   ? Object.values(rootXElement).find(
      //       val => typeof val === "object" && val !== null
      //     )
      //   : null;

      // if (deviceElement) {
      //   // Call doDevices with the parsed device element
      //   // The C# code passes rootXElement as the first argument, which seems to be for automation target lookup context.
      //   // We'll pass the parsed rootXElement for that purpose.
      //   AbletonProject.doDevices(
      //     rootXElement, // Pass the parsed root for context
      //     { Devices: deviceElement }, // Wrap the device element in a 'Devices' object to match doDevices expected input structure
      //     null, // No trackId for a preset
      //     null, // No trackName for a preset
      //     ["preset"], // Location identifier for a preset
      //     outputDirectoryPath,
      //     "unknown_preset", // Use placeholder as original file name is not available
      //     1, // Level 1
      //     true // Assume verbose for presets? Or pass a parameter? Using true for now.
      //   );
      //   Log.Information(`Successfully processed Ableton Live Preset`); // Removed fileName from log
      //   // TODO: Handle the output (presets are saved by doDevices internally in C# version)
      // } else {
      //   Log.Error(`Could not find device element in preset file`); // Removed fileName from log
      // }
    } catch (error) {
      Log.Error(
        `Error handling Ableton Live Preset (${fileName}): ${error instanceof Error ? error.message : error}`
      ); // Removed fileName from log
    }
  }
}
