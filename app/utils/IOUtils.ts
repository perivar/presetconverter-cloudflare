// import { gunzipSync } from "fflate"; // Comment out direct import

export class IOUtils {
  /**
   * Decompresses a gzip-compressed byte array asynchronously.
   * @param gzip The gzip-compressed byte array.
   * @returns A Promise that resolves with the decompressed byte array.
   */
  public static async Decompress(gzip: Uint8Array): Promise<Uint8Array> {
    try {
      if (typeof window === "undefined") {
        // Running on the server (Node.js environment)
        // Use Node.js's built-in zlib
        const zlib = await import("node:zlib");
        return new Promise((resolve, reject) => {
          zlib.gunzip(gzip, (error, result) => {
            if (error) {
              reject(error);
            } else {
              resolve(new Uint8Array(result));
            }
          });
        });
      } else {
        // Running in the browser
        // Use fflate
        const { gunzip } = await import("fflate");
        return new Promise((resolve, reject) => {
          gunzip(gzip, (error, result) => {
            if (error) {
              reject(error);
            } else {
              resolve(result);
            }
          });
        });
      }
    } catch (error) {
      console.error("Failed to decompress gzip data:", error);
      throw new Error("Failed to decompress gzip data.");
    }
  }
}
