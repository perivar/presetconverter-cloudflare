/**
 * This utility handles decompression of gzip-compressed data, supporting both Node.js (server) and browser environments.
 * It uses node:zlib on the server and fflate in the browser. This is the most robust solution for a universal (server/browser) Remix app.
 * It needs to dynamically import both node:zlib and fflate.
 * To enable built-in Node.js APIs and add polyfills, add the nodejs_compat compatibility flag to your wrangler configuration file,
 * and ensure that your Worker's compatibility date is 2024-09-23 or later.
 * Learn more about the Node.js compatibility flag: https://developers.cloudflare.com/workers/configuration/compatibility-flags/#nodejs-compatibility-flag
 */
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
