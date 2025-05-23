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

/**
 * Replaces characters invalid in filenames with a replacement character.
 * Invalid characters: / \ : * ? " < > |
 * @param name The original filename.
 * @param replacement The character to replace invalid characters with (default: '_').
 * @returns A sanitized filename string.
 */
export function makeValidFileName(name: string, replacement = "_"): string {
  if (!name) return "";

  const illegalRe = /[\/\?<>\\:\*\|"]/g;

  const controlRe = /[\x00-\x1f\x80-\x9f]/g;
  const reservedRe = /^\.+$/;
  const windowsReservedRe = /^(con|prn|aux|nul|com[0-9]|lpt[0-9])(\..*)?$/i;
  // const windowsTrailingRe = /[\. ]+$/; // Often handled by OS/filesystem

  let sanitized = name
    .replace(illegalRe, replacement)
    .replace(controlRe, replacement)
    .replace(reservedRe, replacement);
  // .replace(windowsTrailingRe, replacement); // Optional: remove trailing dots/spaces

  // Check for reserved Windows filenames
  if (windowsReservedRe.test(sanitized)) {
    sanitized = replacement + sanitized; // Prepend replacement char
  }

  // Limit length? (Optional)
  // const MAX_FILENAME_LENGTH = 255;
  // if (sanitized.length > MAX_FILENAME_LENGTH) {
  //   sanitized = sanitized.substring(0, MAX_FILENAME_LENGTH);
  // }

  return sanitized;
}

/**
 * Converts a string into a valid JavaScript identifier.
 * Replaces invalid characters with underscores. Ensures it doesn't start with a number.
 * @param str The input string.
 * @returns A valid JavaScript identifier string.
 */
export function makeValidIdentifier(str: string): string {
  if (!str) return "_"; // Return underscore for empty/null/undefined

  let identifier = str.replace(/[^a-zA-Z0-9_$]/g, "_");

  // Ensure it doesn't start with a number
  if (/^[0-9]/.test(identifier)) {
    identifier = "_" + identifier;
  }

  // Handle potential empty string after replacement (e.g., if input was just '---')
  if (!identifier) {
    return "_";
  }

  return identifier;
}

/**
 * Extracts the substring before the first space.
 * @param str The input string.
 * @returns The substring before the first space, or the original string if no space is found.
 */
export function extractBeforeSpace(str: string): string {
  if (!str) return "";
  const spaceIndex = str.indexOf(" ");
  return spaceIndex === -1 ? str : str.substring(0, spaceIndex);
}

/**
 * Returns the file name without its extension.
 *
 * Mimics the behavior of C#'s Path.GetFileNameWithoutExtension by removing
 * the last period and everything after it. If there is no period, the original
 * file name is returned.
 *
 * @param fileName - The full name of the file (e.g., "document.txt").
 * @returns The file name without its extension (e.g., "document").
 *
 * @example
 * getFileNameWithoutExtension("music.mp3");       // "music"
 * getFileNameWithoutExtension("archive.tar.gz");  // "archive.tar"
 * getFileNameWithoutExtension("README");          // "README"
 */
export function getFileNameWithoutExtension(fileName: string): string {
  return fileName.includes(".")
    ? fileName.substring(0, fileName.lastIndexOf("."))
    : fileName;
}
