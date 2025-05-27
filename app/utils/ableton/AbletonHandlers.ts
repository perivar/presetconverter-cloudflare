import { IOUtils } from "../IOUtils";
import { AbletonLiveContent, AbletonProject } from "./AbletonProject";
import { Log } from "./Log";

export class AbletonHandlers {
  /**
   * Handles Ableton Live Project files (.als).
   * Ported from DotNet/Program.cs HandleAbletonLiveProject.
   * @param fileData The file content as a Uint8Array.
   * @param fileName The file name for context.
   * @param doList Whether to list content (currently not fully implemented in TS port).
   * @param doVerbose Whether to output verbose information.
   */
  public static async HandleAbletonLiveProject(
    fileData: Uint8Array,
    fileName: string,
    doList: boolean, // Not fully used in TS port yet
    doVerbose: boolean
  ): Promise<AbletonLiveContent | null> {
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
        decompressedBytes = await IOUtils.Decompress(fileData); // Added await
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
        return null; // Return null if processing failed
      }
    } catch (error) {
      Log.Error(
        `Error handling Ableton Live Project (${fileName}): ${error instanceof Error ? error.message : error}`
      );
      return null; // Return null if processing failed
    }
  }
}
