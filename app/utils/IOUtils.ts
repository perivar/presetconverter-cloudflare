import { gunzipSync } from "node:zlib";

export class IOUtils {
  /**
   * Decompresses a gzip-compressed byte array.
   * @param gzip The gzip-compressed byte array.
   * @returns The decompressed byte array.
   */
  public static Decompress(gzip: Uint8Array): Uint8Array {
    // In Node.js environments, zlib.gunzipSync can be used for gzip decompression.
    // If this code is intended for a browser or other environment without Node.js zlib,
    // a different library (like pako) would be needed.
    try {
      // gunzipSync expects a Buffer or Uint8Array
      const decompressed = gunzipSync(gzip);
      return new Uint8Array(decompressed); // Ensure Uint8Array return type
    } catch (error) {
      console.error("Failed to decompress gzip data:", error);
      // Depending on requirements, you might throw the error or return an empty array/null
      throw new Error("Failed to decompress gzip data.");
    }
  }

  // Add other utility methods here as needed in the future
  // For now, only Decompress is ported as requested.
}
