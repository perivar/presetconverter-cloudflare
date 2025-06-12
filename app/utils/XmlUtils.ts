import { XMLParser } from "fast-xml-parser";

/**
 * Finds the index of the first non-whitespace byte in a Uint8Array.
 * @param arr The byte array to search.
 * @returns The index of the first non-whitespace byte, or -1 if all whitespace/empty.
 */
function findFirstNonWhitespaceByteIndex(arr: Uint8Array): number {
  for (let i = 0; i < arr.length; i++) {
    const byte = arr[i];
    // Check against whitespace characters: space (32), tab (9), newline (10), carriage return (13)
    if (byte !== 32 && byte !== 9 && byte !== 10 && byte !== 13) {
      return i;
    }
  }
  return -1; // Indicates the array is empty or contains only whitespace
}

/**
 * Attempts to parse a Uint8Array as XML with pre-flight checks.
 * @param rawChunkData The raw data chunk.
 * @returns The parsed object if successful, otherwise null.
 */
export function attemptXmlParse(rawChunkData: Uint8Array): object | null {
  if (!rawChunkData || rawChunkData.length === 0) {
    return null;
  }

  let chunkData = rawChunkData; // Start with the original data

  // --- THE NEW, ROBUST LOGIC ---
  // Find the first meaningful byte.
  const firstByteIndex = findFirstNonWhitespaceByteIndex(chunkData);

  // If the first meaningful byte is not '<' (ASCII 60), then we assume
  // the data starts with a 4-byte binary header and we slice it off.
  // This handles control chars (like byte 2), non-ASCII chars, etc.
  if (firstByteIndex === -1 || chunkData[firstByteIndex] !== 60) {
    console.log(
      "Data does not appear to start with XML ('<'). Assuming 4-byte header and slicing."
    );
    // Safety check: ensure we have at least 4 bytes before slicing.
    if (chunkData.length >= 4) {
      chunkData = chunkData.slice(4);
    } else {
      // Not enough data to be header + XML, so it can't be valid.
      return null;
    }
  }

  // At this point, chunkData is either the original or the sliced version.
  // We still perform a full parse in a try-catch as the final verification.

  try {
    const fullXmlString = new TextDecoder("utf-8").decode(chunkData);

    // A final trim on the string is good practice before parsing.
    if (fullXmlString.trim() === "") {
      return null;
    }

    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: "@_",
      parseAttributeValue: false,
      parseTagValue: false,
    });

    const parsedResult = parser.parse(fullXmlString);

    if (
      typeof parsedResult !== "object" ||
      parsedResult === null ||
      Object.keys(parsedResult).length === 0
    ) {
      throw new Error("Parsed result is not a valid, non-empty object.");
    }

    return parsedResult;
  } catch (parseError) {
    console.warn(`Final XML parsing failed after initial checks:`, parseError);
    return null;
  }
}
