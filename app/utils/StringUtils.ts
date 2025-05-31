/**
 * Converts a byte array to a hex and ASCII string representation, similar to a hex editor line.
 * @param bytes - The byte array to convert.
 * @param invert - Whether to invert the byte array before processing (default: false).
 * @param highlightIndex - Optional index to highlight with a caret.
 * @param bytesPerLine - The number of bytes to display per line (default: 16).
 * @returns A multi-line string representing the hex and ASCII values with optional caret.
 */
export function toHexAndAsciiString(
  bytes: Uint8Array,
  invert = false,
  highlightIndex?: number,
  bytesPerLine = 16
): string {
  if (!bytes) {
    return "";
  }

  const bytesCloned = invert ? bytes.slice().reverse() : bytes;
  const outputLines: string[] = [];

  for (let i = 0; i < bytesCloned.length; i += bytesPerLine) {
    const lineBytes = bytesCloned.slice(i, i + bytesPerLine);
    let hexPart = "";
    let asciiPart = "";

    for (let j = 0; j < lineBytes.length; j++) {
      const byte = lineBytes[j];
      hexPart += byte.toString(16).padStart(2, "0").toUpperCase() + " ";

      if (byte >= 32 && byte <= 126) {
        asciiPart += String.fromCharCode(byte);
      } else {
        asciiPart += ".";
      }
    }

    // Each byte is 2 hex chars + 1 space
    const line = `${hexPart.padEnd(bytesPerLine * 3)} ${asciiPart}`;
    outputLines.push(line);

    // Check if highlightIndex falls within this line
    if (
      highlightIndex !== undefined &&
      highlightIndex >= i &&
      highlightIndex < i + bytesPerLine
    ) {
      const relativeHighlightIndex = highlightIndex - i;
      const hexCaretPos = relativeHighlightIndex * 3;
      const asciiCaretPos = relativeHighlightIndex;

      const hexCaretPart = " ".repeat(hexCaretPos) + "^^";
      const asciiCaretPart = " ".repeat(asciiCaretPos) + "^";

      const caretLine = `${hexCaretPart.padEnd(bytesPerLine * 3)} ${asciiCaretPart}`;
      outputLines.push(caretLine);
    }
  }

  return outputLines.join("\n");
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

    // Now toHexAndAsciiString handles multi-line, so we can just call it once
    // and then slice the result if maxNumberOfLines is less than totalLines.
    const fullHexAsciiString = toHexAndAsciiString(
      byteData,
      invert,
      undefined,
      splitLength
    );
    const lines = fullHexAsciiString.split("\n"); // Changed to double quotes

    for (let i = 0; i < linesToShow; i++) {
      output += lines[i] + "\n";
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

/**
 * Trims leading/trailing whitespace from each line and replaces multiple whitespace characters with a single space.
 * Also replaces various newline characters with a single space.
 * @param text The input string.
 * @returns The processed string.
 */
export function trimMultiLine(text: string): string {
  if (!text) {
    return "";
  }
  // Replace various newline characters with a single space
  let processedText = text.replace(/(\r\n|\n|\r)/gm, " ");
  // Replace multiple spaces with a single space
  processedText = processedText.replace(/\s\s+/g, " ");
  // Trim leading/trailing whitespace
  processedText = processedText.trim();
  return processedText;
}

/**
 * Ensures the given string ends with a single trailing space.
 * If the string already ends with a space, it returns the string unchanged.
 * Otherwise, it appends one space character at the end.
 *
 * @param str - The input string to check.
 * @returns The input string guaranteed to end with a single space.
 */
export function ensureTrailingSpace(str: string): string {
  return str.endsWith(" ") ? str : str + " ";
}
