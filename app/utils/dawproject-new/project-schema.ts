/// File generated automatically from XSD

type Many<T> = T | readonly T[];

// type XmlElement = {
//   "@_xmlns"?: string;
//   [ns: `@_xmlns:${string}`]: string | undefined;
// };
interface XmlElement {}

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

/**
 * Possible values:
 * - linear:
 * - normalized:
 * - percent:
 * - decibel:
 * - hertz:
 * - semitones:
 * - seconds:
 * - beats:
 * - bpm:
 */
export type Unit =
  | "linear"
  | "normalized"
  | "percent"
  | "decibel"
  | "hertz"
  | "semitones"
  | "seconds"
  | "beats"
  | "bpm";

/**
 * Possible values:
 * - beats:
 * - seconds:
 */
export type TimeUnit = "beats" | "seconds";

/**
 * Possible values:
 * - instrument:
 * - noteFX:
 * - audioFX:
 * - analyzer:
 */
export type DeviceRole = "instrument" | "noteFX" | "audioFX" | "analyzer";

/**
 * Possible values:
 * - highPass:
 * - lowPass:
 * - bandPass:
 * - highShelf:
 * - lowShelf:
 * - bell:
 * - notch:
 */
export type EqBandType =
  | "highPass"
  | "lowPass"
  | "bandPass"
  | "highShelf"
  | "lowShelf"
  | "bell"
  | "notch";

/**
 * Possible values:
 * - regular:
 * - master:
 * - effect:
 * - submix:
 * - vca:
 */
export type MixerRole = "regular" | "master" | "effect" | "submix" | "vca";

/**
 * Possible values:
 * - pre:
 * - post:
 */
export type SendType = "pre" | "post";

/**
 * Possible values:
 * - audio:
 * - automation:
 * - notes:
 * - video:
 * - markers:
 * - tracks:
 */
export type ContentType =
  | "audio"
  | "automation"
  | "notes"
  | "video"
  | "markers"
  | "tracks";

/**
 * Possible values:
 * - hold:
 * - linear:
 */
export type Interpolation = "hold" | "linear";

/**
 * Possible values:
 * - gain:
 * - pan:
 * - transpose:
 * - timbre:
 * - formant:
 * - pressure:
 * - channelController:
 * - channelPressure:
 * - polyPressure:
 * - pitchBend:
 * - programChange:
 */
export type ExpressionType =
  | "gain"
  | "pan"
  | "transpose"
  | "timbre"
  | "formant"
  | "pressure"
  | "channelController"
  | "channelPressure"
  | "polyPressure"
  | "pitchBend"
  | "programChange";

export type Project = XmlElement & {
  "@_version": XsString;
} & {
  Application?: Many<unknown>;
  Transport?: Many<unknown>;
  Structure?: Many<XmlElement>;
  Arrangement?: Many<unknown>;
  Scenes?: Many<
    XmlElement & {
      Scene?: Many<unknown>;
    }
  >;
};

export type Application = XmlElement & {
  "@_name": XsString;
  "@_version": XsString;
};

export type Transport = XmlElement & {
  Tempo?: Many<unknown>;
  TimeSignature?: Many<unknown>;
};

export type RealParameter = XmlElement;

export type Parameter = XmlElement;

export type Referenceable = XmlElement;

export type Nameable = XmlElement & {
  "@_name"?: XsString;
  "@_color"?: XsString;
  "@_comment"?: XsString;
};

export type BoolParameter = XmlElement;

export type IntegerParameter = XmlElement;

export type EnumParameter = XmlElement;

export type TimeSignatureParameter = XmlElement;

export type Lane = XmlElement;

export type Arrangement = XmlElement;

export type Lanes = XmlElement;

export type Timeline = XmlElement;

export type Track = XmlElement;

export type Channel = XmlElement;

export type Device = XmlElement;

export type FileReference = XmlElement & {
  "@_path": XsString;
  "@_external"?: XsBoolean;
};

export type Vst2Plugin = XmlElement;

export type Plugin = XmlElement;

export type Vst3Plugin = XmlElement;

export type ClapPlugin = XmlElement;

export type BuiltinDevice = XmlElement;

export type Equalizer = XmlElement;

export type EqBand = XmlElement & {
  "@_type": unknown;
  "@_order"?: XsInt;
} & {
  Freq?: Many<unknown>;
  Gain?: Many<unknown>;
  Q?: Many<unknown>;
  Enabled?: Many<unknown>;
};

export type Compressor = XmlElement;

export type NoiseGate = XmlElement;

export type Limiter = XmlElement;

export type AuPlugin = XmlElement;

export type Send = XmlElement;

export type Note = XmlElement & {
  "@_time": XsString;
  "@_duration": XsString;
  "@_channel": XsInt;
  "@_key": XsInt;
  "@_vel"?: XsString;
  "@_rel"?: XsString;
};

export type Notes = XmlElement;

export type Clip = XmlElement;

export type Clips = XmlElement;

export type ClipSlot = XmlElement;

export type Marker = XmlElement;

export type Markers = XmlElement;

export type Warps = XmlElement;

export type Warp = XmlElement & {
  "@_time": XsDouble;
  "@_contentTime": XsDouble;
};

export type Audio = XmlElement;

export type MediaFile = XmlElement;

export type Video = XmlElement;

export type Point = XmlElement & {
  "@_time": XsString;
};

export type RealPoint = XmlElement;

export type EnumPoint = XmlElement;

export type BoolPoint = XmlElement;

export type IntegerPoint = XmlElement;

export type TimeSignaturePoint = XmlElement;

export type Points = XmlElement;

export type AutomationTarget = XmlElement & {
  "@_parameter"?: unknown;
  "@_expression"?: unknown;
  "@_channel"?: XsInt;
  "@_key"?: XsInt;
  "@_controller"?: XsInt;
};

export type Scene = XmlElement;
