import { mkdirSync, writeFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { parseArgs } from "util";
import { decompressAfterMarker } from "app/utils/ZipUtils";

import { exampleData } from "./exampleData";

/**
 * Dumps a Uint8Array to the console in a human-readable hex format.
 */
function dumpUint8Array(data: Uint8Array, bytesPerRow = 16): string {
  const lines: string[] = [];
  const textDecoder = new TextDecoder("latin1");
  for (let i = 0; i < data.length; i += bytesPerRow) {
    const chunk = data.subarray(i, i + bytesPerRow);
    const offset = i.toString(16).padStart(8, "0");
    const hex = Array.from(chunk)
      .map(byte => byte.toString(16).padStart(2, "0"))
      .join(" ");
    const asciiChunk = textDecoder.decode(chunk);
    const ascii = Array.from(asciiChunk)
      .map(char =>
        char.charCodeAt(0) >= 0x20 && char.charCodeAt(0) <= 0x7e ? char : "."
      )
      .join("");
    lines.push(`${offset}  ${hex.padEnd(bytesPerRow * 3 - 1)}  |${ascii}|`);
  }
  return lines.join("\n");
}

/**
 * Formats a Uint8Array as a copy-pasteable, exportable TypeScript literal.
 */
function formatAsTypeScriptArray(
  data: Uint8Array,
  variableName: string,
  bytesPerRow = 16
): string {
  const lines: string[] = [
    `// This file was generated by a script.`,
    `export const ${variableName} = new Uint8Array([`,
  ];
  for (let i = 0; i < data.length; i += bytesPerRow) {
    const chunk = data.subarray(i, i + bytesPerRow);
    const hexValues = Array.from(chunk)
      .map(byte => `0x${byte.toString(16).padStart(2, "0")}`)
      .join(", ");
    lines.push(`    ${hexValues},`);
  }
  lines.push("]);");
  return lines.join("\n");
}

/**
 * Prints the help message and usage guide for the script.
 */
function printHelpMessage() {
  console.log(`
---------------------------------------------------------------------
  VST3 Preset Data Dumper
---------------------------------------------------------------------

This script analyzes VST3 preset data, decompresses it if necessary,
and outputs the contents in various formats.

If no arguments are provided, this help message is displayed.

Usage:
  npx tsx scripts/dumpUncompressedData.ts [options]

Options:
  -d, --dump         Dump a hex view of the data to the console.

  -b, --write-bin    Write the primary and trailing data to binary
                     files (.bin) in the 'output/' directory.

  -t, --write-ts     Write the primary and trailing data as TypeScript
                     literals (.ts) in the 'output/' directory.

Examples:
  # Display this help message
  npx tsx scripts/dumpUncompressedData.ts

  # Dump hex view to the console
  npx tsx scripts/dumpUncompressedData.ts -d

  # Write .bin files AND dump hex view to console
  npx tsx scripts/dumpUncompressedData.ts -b -d

  # Write .ts files only
  npx tsx scripts/dumpUncompressedData.ts -t
---------------------------------------------------------------------
`);
}

// --- Main Execution Block ---

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const options = {
    dump: { type: "boolean", short: "d", default: false },
    "write-bin": { type: "boolean", short: "b", default: false },
    "write-ts": { type: "boolean", short: "t", default: false },
  } as const;

  const { values: args } = parseArgs({ options, allowPositionals: false });

  // Check if any action flags were passed. If not, show help and exit.
  const noActionFlags = !args.dump && !args["write-bin"] && !args["write-ts"];
  if (noActionFlags) {
    printHelpMessage();
    process.exit(0);
  }

  // Wrap the core logic in an async IIFE to use top-level await.
  (async () => {
    try {
      const { data, trailingData, wasCompressed } =
        await decompressAfterMarker(exampleData);
      console.log(
        `Extraction complete. Marker found and data decompressed: ${wasCompressed}`
      );

      // Conditionally dump hex to console
      if (args.dump) {
        console.log(`\n--- Primary Data Dump (${data.length} bytes) ---`);
        console.log(dumpUint8Array(data));

        if (trailingData.length > 0) {
          console.log(
            `\n--- Trailing Data Dump (${trailingData.length} bytes) ---`
          );
          console.log(dumpUint8Array(trailingData));
        }
      }

      // Create output directory only if we need to write files.
      const outputDir = "output";
      if (args["write-bin"] || args["write-ts"]) {
        mkdirSync(outputDir, { recursive: true });
        console.log("\n--- Writing requested files to ./output/ directory ---");
      }

      // Conditionally write binary files
      if (args["write-bin"]) {
        const dataFilePath = path.join(outputDir, "primary_data.bin");
        writeFileSync(dataFilePath, data);
        console.log(`✅ Wrote binary data to: ${dataFilePath}`);
        if (trailingData.length > 0) {
          const trailingFilePath = path.join(outputDir, "trailing_data.bin");
          writeFileSync(trailingFilePath, trailingData);
          console.log(`✅ Wrote binary trailing data to: ${trailingFilePath}`);
        }
      }

      // Conditionally write TypeScript literal files
      if (args["write-ts"]) {
        const tsContent = formatAsTypeScriptArray(data, "primaryData");
        const tsFilePath = path.join(outputDir, "primary_data.ts");
        writeFileSync(tsFilePath, tsContent);
        console.log(`✅ Wrote TypeScript literal to: ${tsFilePath}`);
        if (trailingData.length > 0) {
          const tsTrailingContent = formatAsTypeScriptArray(
            trailingData,
            "trailingData"
          );
          const tsTrailingFilePath = path.join(outputDir, "trailing_data.ts");
          writeFileSync(tsTrailingFilePath, tsTrailingContent);
          console.log(
            `✅ Wrote TypeScript literal for trailing data to: ${tsTrailingFilePath}`
          );
        }
      }
    } catch (error) {
      console.error("\nAn error occurred during extraction:", error);
    }
  })();
}
