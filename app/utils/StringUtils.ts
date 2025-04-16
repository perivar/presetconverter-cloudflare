/**
 * Converts a byte array to a hex and ASCII string representation, similar to a hex editor line.
 * @param bytes - The byte array to convert.
 * @param invert - Whether to invert the byte array before processing (default: false).
 * @returns A string representing the hex and ASCII values.
 */
function toHexAndAsciiString(bytes: Uint8Array, invert = false): string {
  let hex = "";
  let text = "";

  if (bytes) {
    const bytesCloned = invert ? bytes.slice().reverse() : bytes;

    for (let i = 0; i < bytesCloned.length; i++) {
      const byte = bytesCloned[i];
      hex += byte.toString(16).padStart(2, "0").toUpperCase() + " ";

      // Check if the character is printable ASCII (32-126)
      if (byte >= 32 && byte <= 126) {
        text += String.fromCharCode(byte);
      } else {
        text += ".";
      }
    }

    // Pad the hex string to align the ASCII part (16 bytes * 3 chars/byte = 48)
    const hexPadded = hex.padEnd(48);
    return `${hexPadded} ${text}`;
  } else {
    return ""; // Return empty string for null/undefined input
  }
}

/**
 * Converts a byte array to a multi-line hex editor string representation.
 * @param byteData - The byte array to convert.
 * @param invert - Whether to invert the byte array before processing (default: false).
 * @param maxNumberOfLines - The maximum number of lines to output (default: 20).
 * @returns A string formatted like a hex editor view.
 */
export function toHexEditorString(
  byteData: Uint8Array | undefined,
  invert = false,
  maxNumberOfLines = 20
): string {
  const splitLength = 16; // Bytes per line

  if (byteData && byteData.length > 0) {
    let output = "";
    const totalLines = Math.ceil(byteData.length / splitLength);
    const linesToShow = Math.min(totalLines, maxNumberOfLines);

    if (linesToShow < totalLines) {
      output += `Byte Data (showing first ${linesToShow} lines of ${totalLines}):\n`;
    } else {
      output += "Byte Data:\n";
    }

    for (let i = 0; i < linesToShow; i++) {
      const start = i * splitLength;
      const end = start + splitLength;
      const lineBytes = byteData.slice(start, end);
      output += toHexAndAsciiString(lineBytes, invert) + "\n";
    }

    // Remove the last newline character
    if (output.endsWith("\n")) {
      output = output.slice(0, -1);
    }

    return output;
  } else if (byteData && byteData.length === 0) {
    return "Byte Data: (empty)";
  } else {
    return "Byte Data: null";
  }
}
