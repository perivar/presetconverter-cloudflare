import { XMLBuilder } from "fast-xml-parser";

/**
 * Common character encodings for XML.
 */
export enum Encoding {
  UTF8 = "utf-8",
  UTF16 = "utf-16",
  UTF32 = "utf-32",
  ISO_8859_1 = "ISO-8859-1",
  WINDOWS_1252 = "windows-1252",
}

/**
 * Defines how newlines are handled when writing XML.
 */
export enum NewLineHandling {
  Replace,
  Preserve,
  None,
}

/**
 * Options for configuring the behavior of the `XmlWriter` function.
 */
export interface XmlWriterOptions {
  OmitXmlDeclaration?: boolean;
  Indent?: boolean;
  IndentChars?: string;
  NewLineChars?: string;
  NewLineHandling?: NewLineHandling;
  Encoding?: Encoding;
}

/**
 * Converts a JavaScript object into an XML string based on the provided options.
 */
export function XmlWriter(
  xmlObject: object,
  options?: XmlWriterOptions
): string {
  const defaultOptions: Required<XmlWriterOptions> = {
    OmitXmlDeclaration: false,
    Indent: true,
    IndentChars: "\t",
    NewLineChars: "\r\n",
    NewLineHandling: NewLineHandling.Replace,
    Encoding: Encoding.UTF8,
  };

  const mergedOptions = { ...defaultOptions, ...options };

  const builderOptions = {
    ignoreAttributes: false,
    format: mergedOptions.Indent,
    indentBy: mergedOptions.IndentChars,
    suppressEmptyNode: true,
  };

  const builder = new XMLBuilder(builderOptions);
  let xmlContent = builder.build(xmlObject);

  if (!mergedOptions.OmitXmlDeclaration) {
    xmlContent =
      `<?xml version="1.0" encoding="${mergedOptions.Encoding}"?>` +
      mergedOptions.NewLineChars +
      xmlContent;
  }

  if (mergedOptions.NewLineHandling === NewLineHandling.Replace) {
    xmlContent = xmlContent.replace(
      /\r?\n/g,
      mergedOptions.NewLineChars || "\r\n"
    );
  } else if (mergedOptions.NewLineHandling === NewLineHandling.None) {
    xmlContent = xmlContent.replace(/\r?\n/g, "");
  }

  return xmlContent;
}
