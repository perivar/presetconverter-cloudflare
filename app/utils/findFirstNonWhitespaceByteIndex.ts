/**
 * Finds the index of the first non-whitespace byte in a Uint8Array.
 * @param arr The byte array to search.
 * @returns The index of the first non-whitespace byte, or -1 if all whitespace/empty.
 */
export function findFirstNonWhitespaceByteIndex(arr: Uint8Array): number {
  for (let i = 0; i < arr.length; i++) {
    const byte = arr[i];
    // Check against whitespace characters: space (32), tab (9), newline (10), carriage return (13)
    if (byte !== 32 && byte !== 9 && byte !== 10 && byte !== 13) {
      return i;
    }
  }
  return -1; // Indicates the array is empty or contains only whitespace
}
