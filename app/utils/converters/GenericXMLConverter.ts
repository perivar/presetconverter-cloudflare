import { GenericXML } from "../preset/GenericXML";
import { MultiFormatConverter } from "./MultiFormatConverter";

export const GenericXMLConverter: MultiFormatConverter<GenericXML, GenericXML> =
  {
    from: "GenericXML",
    to: "GenericXML",
    displayName: "Raw XML Data",

    convertBase(preset: GenericXML): GenericXML {
      // This converter doesn't perform any actual conversion,
      // it just makes the raw XML data available for download.
      return preset;
    },

    outputFormats: [
      {
        formatId: "rawxml",
        extension: ".xml",
        displayName: "Raw XML File",
        convert(preset: GenericXML): string | undefined {
          return preset.content;
        },
      },
    ],
  };
