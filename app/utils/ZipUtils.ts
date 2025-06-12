import { XMLParser } from "fast-xml-parser";

import { findFirstNonWhitespaceByteIndex } from "./findFirstNonWhitespaceByteIndex";

/**
 * Attempts to extract a ZIP archive from a Uint8Array if it starts with #zip# using fflate.
 * @param rawChunkData The raw data chunk.
 * @returns The extracted files (XML parsed or raw Uint8Array) if successful, otherwise null.
 */
export function attemptUnpackVstPreset(
  rawChunkData: Uint8Array
): Promise<object | null> {
  return new Promise(async resolve => {
    if (!rawChunkData || rawChunkData.length === 0) {
      resolve(null);
      return;
    }

    let chunkData = rawChunkData; // Start with the original data
    const firstByteIndex = findFirstNonWhitespaceByteIndex(chunkData);

    // Check for #zip# marker (ASCII: [35, 122, 105, 112, 35])
    const zipMarker = new Uint8Array([35, 122, 105, 112, 35]); // #zip#
    const hasZipMarker =
      firstByteIndex !== -1 &&
      chunkData.length >= firstByteIndex + 5 &&
      chunkData
        .subarray(firstByteIndex, firstByteIndex + 5)
        .every((byte, i) => byte === zipMarker[i]);

    if (!hasZipMarker) {
      console.log("No #zip# marker found. Invalid VST preset data.");
      resolve(null);
      return;
    }

    console.log(
      "Detected #zip# marker. Attempting to extract ZIP archive with fflate."
    );
    // Slice off the #zip# marker and the 0x00 byte (if present)
    const sliceStart =
      chunkData[firstByteIndex + 5] === 0
        ? firstByteIndex + 6
        : firstByteIndex + 5;
    chunkData = chunkData.slice(sliceStart);

    // Slice off the last 60 bytes
    // chunkData = chunkData.slice(sliceStart, chunkData.length - 60);

    try {
      const { unzip } = await import("fflate");
      unzip(chunkData, (err, zipFiles) => {
        if (err) {
          console.warn("Failed to extract ZIP archive with fflate:", err);
          resolve(null);
          return;
        }

        // Process the files in the ZIP archive
        const extractedFiles: Record<string, any> = {};

        for (const [fileName, fileData] of Object.entries(zipFiles)) {
          // Skip directories
          if (fileName.endsWith("/")) {
            continue;
          }

          if (fileName.endsWith(".xml")) {
            // Handle XML files
            const xmlString = new TextDecoder("utf-8").decode(fileData);
            if (xmlString.trim() === "") {
              console.warn(`XML file ${fileName} is empty.`);
              continue;
            }

            try {
              const parser = new XMLParser({
                ignoreAttributes: false,
                attributeNamePrefix: "@_",
                parseAttributeValue: false,
                parseTagValue: false,
              });
              const parsedXml = parser.parse(xmlString);
              if (
                typeof parsedXml !== "object" ||
                parsedXml === null ||
                Object.keys(parsedXml).length === 0
              ) {
                throw new Error(
                  `Parsed XML in ${fileName} is not a valid, non-empty object.`
                );
              }
              extractedFiles[fileName] = parsedXml;
            } catch (xmlError) {
              console.warn(`Failed to parse XML in ${fileName}:`, xmlError);
              extractedFiles[fileName] = null;
            }
          } else {
            // Handle other file types (return as Uint8Array)
            extractedFiles[fileName] = fileData;
          }
        }

        if (Object.keys(extractedFiles).length === 0) {
          console.warn("No valid files extracted from ZIP archive.");
          resolve(null);
          return;
        }

        resolve(extractedFiles);
      });
    } catch (importError) {
      console.warn(
        "Failed to import fflate or process ZIP archive:",
        importError
      );
      resolve(null);
    }
  });
}
