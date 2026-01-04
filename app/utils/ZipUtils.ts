// --- Private Helper Functions (not exported) ---

/**
 * A universal, isomorphic decompression function that works in Node.js and the browser.
 * It dynamically imports the appropriate library based on the environment.
 * @param data The zlib-compressed byte array.
 * @returns A Promise that resolves with the decompressed byte array.
 */
async function universalDecompress(data: Uint8Array): Promise<Uint8Array> {
  if (typeof window === "undefined") {
    // --- SERVER-SIDE (Node.js/Cloudflare Worker) ---
    const zlib = await import("node:zlib");
    return new Promise((resolve, reject) => {
      zlib.unzip(data, (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(new Uint8Array(result));
        }
      });
    });
  } else {
    // --- CLIENT-SIDE (Browser) ---
    const { decompress } = await import("fflate");
    return new Promise((resolve, reject) => {
      decompress(data, (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      });
    });
  }
}

/**
 * Calculates the Adler-32 checksum of a Uint8Array.
 * This is the specific implementation you requested.
 */
function adler32(data: Uint8Array): number {
  const MOD_ADLER = 65521;
  let a = 1;
  let b = 0;
  let i = 0;
  const len = data.length;
  const NMAX = 5552;

  while (i < len) {
    const blockSize = Math.min(len - i, NMAX);
    for (let j = 0; j < blockSize; j++) {
      a += data[i++];
      b += a;
    }
    a %= MOD_ADLER;
    b %= MOD_ADLER;
  }

  return ((b << 16) | a) >>> 0;
}

/**
 * Finds the boundary of a zlib stream within a buffer by verifying the checksum.
 * This function is now ASYNCHRONOUS.
 * @param buffer The buffer assumed to contain a zlib stream at the start.
 * @returns A Promise resolving to an object with the decompressed data and the trailing data, or null on failure.
 */
async function findZlibBoundaryAndDecompress(buffer: Uint8Array): Promise<{
  decompressed: Uint8Array;
  trailing: Uint8Array;
} | null> {
  for (let i = buffer.length; i >= 6; i--) {
    const candidateStream = buffer.subarray(0, i);
    try {
      const decompressed = await universalDecompress(candidateStream);
      const actualChecksum = adler32(decompressed);
      const streamFooter = candidateStream.subarray(-4);
      const dataView = new DataView(
        streamFooter.buffer,
        streamFooter.byteOffset,
        streamFooter.byteLength
      );
      const expectedChecksum = dataView.getUint32(0, false);
      if (actualChecksum === expectedChecksum) {
        return { decompressed: decompressed, trailing: buffer.subarray(i) };
      }
    } catch (_e) {
      // This is not a valid endpoint, continue the loop.
    }
  }
  return null; // No valid, verifiable stream found
}

// --- Public API ---

export interface DecompressionResult {
  data: Uint8Array;
  trailingData: Uint8Array;
  wasCompressed: boolean;
}

/**
 * Searches for a binary marker in a data chunk. If found, it asynchronously decompresses the
 * subsequent zlib stream and separates it from any trailing data. This function is now ASYNCHRONOUS.
 *
 * This utility is isomorphic, working in both Node.js and browser environments by dynamically
 * loading the appropriate decompression library.
 *
 * @param chunkData The raw Uint8Array data chunk to analyze.
 * @param marker The binary marker to search for. Defaults to the JUCE framework's
 *   standard '#zip#\0' marker.
 * @returns A Promise that resolves with an object containing the primary data, trailing data, and a compression flag.
 * @throws An error if the marker is found but the following data cannot be parsed as a valid zlib stream.
 */
export async function decompressAfterMarker(
  chunkData: Uint8Array,
  marker: Uint8Array = new Uint8Array([0x23, 0x7a, 0x69, 0x70, 0x23, 0x00]) // Default: #zip#\0
): Promise<DecompressionResult> {
  let markerIndex = -1;
  if (marker.length > 0) {
    for (let i = 0; i <= chunkData.length - marker.length; i++) {
      let found = true;
      for (let j = 0; j < marker.length; j++) {
        if (chunkData[i + j] !== marker[j]) {
          found = false;
          break;
        }
      }
      if (found) {
        markerIndex = i;
        break;
      }
    }
  }

  if (markerIndex === -1) {
    return {
      data: chunkData,
      trailingData: new Uint8Array(0),
      wasCompressed: false,
    };
  }

  const dataAfterMarker = chunkData.subarray(markerIndex + marker.length);
  const result = await findZlibBoundaryAndDecompress(dataAfterMarker);

  if (!result) {
    throw new Error(
      "Found marker but failed to decompress a valid zlib stream from the following data."
    );
  }

  return {
    data: result.decompressed,
    trailingData: result.trailing,
    wasCompressed: true,
  };
}
