/**
 * Removes the Byte Order Mark (BOM) from the beginning and end of a string if present.
 * @param value - The input string.
 * @returns The string with BOM removed.
 */
export function removeByteOrderMark(value: string): string {
  // Convert string to UTF-8 bytes
  const encoder = new TextEncoder();
  let bytes = encoder.encode(value);

  // Remove BOM from start if present
  if (bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf) {
    bytes = bytes.slice(3);
  }

  // Remove BOM from end if present
  const byteLength = bytes.length;
  if (
    bytes[byteLength - 3] === 0xef &&
    bytes[byteLength - 2] === 0xbb &&
    bytes[byteLength - 1] === 0xbf
  ) {
    bytes = bytes.slice(0, -3);
  }

  // Convert back to string
  const decoder = new TextDecoder("utf-8");
  return decoder.decode(bytes);
}
