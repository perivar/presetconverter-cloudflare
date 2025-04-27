/// File generated automatically from XSD

type Many<T> = T | readonly T[];

// type XmlElement = {
//   "@_xmlns"?: string;
//   [ns: `@_xmlns:${string}`]: string | undefined;
// };
type XmlElement = {};

type Prolog = { "?xml"?: { "@_version": string; "@_encoding": string } };

export type XsString = string;

export type XsInt = number | string;

export type XsShort = number | string;

export type XsLong = number | string;

export type XsDouble = number | string;

export type XsDecimal = number | string;

export type XsBoolean = boolean | "true" | "false";

export type XsBase64Binary = string;

export type XsDate = string;

export type XsDateTime = string;

export type SignatureType = unknown;

export type SignatureElement = Prolog & {
  Signature?: Many<SignatureType>;
};

export type MetaData = XmlElement & {
  Title?: Many<XsString>;
  Artist?: Many<XsString>;
  Album?: Many<XsString>;
  OriginalArtist?: Many<XsString>;
  Composer?: Many<XsString>;
  Songwriter?: Many<XsString>;
  Producer?: Many<XsString>;
  Arranger?: Many<XsString>;
  Year?: Many<XsString>;
  Genre?: Many<XsString>;
  Copyright?: Many<XsString>;
  Website?: Many<XsString>;
  Comment?: Many<XsString>;
};
