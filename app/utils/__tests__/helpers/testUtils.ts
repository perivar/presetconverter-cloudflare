import { toHexAndAsciiString } from "../../StringUtils";

export function toPlainObject(obj: unknown): unknown {
  return JSON.parse(JSON.stringify(obj));
}

// Define a type alias for TypedArray constructors
type TypedArray =
  | Int8Array
  | Uint8Array
  | Uint8ClampedArray
  | Int16Array
  | Uint16Array
  | Int32Array
  | Uint32Array
  | Float32Array
  | Float64Array;

export function areTypedArraysEqual<T extends TypedArray>(
  arr1: T,
  arr2: T
): boolean {
  if (arr1.length !== arr2.length) {
    return false;
  }
  for (let i = 0; i < arr1.length; i++) {
    if (arr1[i] !== arr2[i]) {
      return false;
    }
  }
  return true;
}

/**
 * Compares two Uint8Arrays using Jest's expect().toEqual().
 * If they are not equal, it prints a hex diff around the first differing byte
 * and re-throws the Jest expectation error.
 *
 * @param received The received Uint8Array.
 * @param expected The expected Uint8Array.
 * @param context The number of bytes to show before and after the difference (default: 16).
 */
export function expectUint8ArraysToBeEqual(
  received: Uint8Array,
  expected: Uint8Array,
  context = 16
): void {
  try {
    expect(received).toEqual(expected);
  } catch (error) {
    // Find the first differing index
    let diffIndex = -1;
    const len = Math.min(expected.length, received.length);
    for (let i = 0; i < len; i++) {
      if (expected[i] !== received[i]) {
        diffIndex = i;
        break;
      }
    }
    // If no difference found yet, but lengths differ, the difference is at the end
    if (diffIndex === -1 && expected.length !== received.length) {
      diffIndex = len;
    }

    if (diffIndex !== -1) {
      const start = Math.max(0, diffIndex - context);
      const endExpected = Math.min(expected.length, diffIndex + context);
      const endReceived = Math.min(received.length, diffIndex + context);

      const sliceExpected = expected.slice(start, endExpected);
      const sliceReceived = received.slice(start, endReceived);

      const formattedExpected = toHexAndAsciiString(
        sliceExpected,
        false,
        diffIndex - start
      );
      const formattedReceived = toHexAndAsciiString(
        sliceReceived,
        false,
        diffIndex - start
      );

      // Log the hex and ASCII diff to stderr for better visibility in test runners
      console.error(
        `\nDiff around index ${diffIndex} (offset ${start}):\n` +
          `Expected:\n${formattedExpected}\n` +
          `Received:\n${formattedReceived}\n`
      );
    }
    // Re-throw the original Jest error to ensure the test fails correctly
    throw error;
  }
}
