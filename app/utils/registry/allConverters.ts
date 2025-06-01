import { AbletonToFabFilterProQ3 } from "../converters/AbletonToFabFilterProQ3";
import { AbletonToSteinbergFrequency } from "../converters/AbletonToSteinbergFrequency";
import { FabFilterToGenericEQ } from "../converters/FabFilterToGenericEQ";
import { FabFilterToSteinbergFrequency } from "../converters/FabFilterToSteinbergFrequency";
import { GenericEQToSteinbergFrequency } from "../converters/GenericEQToSteinbergFrequency";
import { GenericFXPConverter } from "../converters/GenericFXPConverter"; // Import GenericFXPConverter
import { GenericXMLConverter } from "../converters/GenericXMLConverter";
import { REWToFabFilterProQ } from "../converters/REWToFabFilterProQ";
import { REWToFabFilterProQ2 } from "../converters/REWToFabFilterProQ2";
import { REWToFabFilterProQ3 } from "../converters/REWToFabFilterProQ3";
import { SSLNativeChannelToText } from "../converters/SSLNativeChannelToText";
import { SSLNativeToGenericEQ } from "../converters/SSLNativeToGenericEQ";
import { SSLNativeToWavesSSLChannel } from "../converters/SSLNativeToWavesSSLChannel";
import { SteinbergFrequencyToGenericEQ } from "../converters/SteinbergFrequencyToGenericEQ";
import { WavesSSLChannelToText } from "../converters/WavesSSLChannelToText";
import { WavesSSLCompToGenericCompressorLimiter } from "../converters/WavesSSLCompToGenericCompressorLimiter";
import { WavesSSLCompToText } from "../converters/WavesSSLCompToText";
import { WavesSSLToGenericEQ } from "../converters/WavesSSLToGenericEQ";
import { WavesSSLToSSLNativeChannel } from "../converters/WavesSSLToSSLNativeChannel";
import { ConverterRegistration } from "./converterRegistry";

export const allConverters: ConverterRegistration[] = [
  { fromTypes: ["AbletonEq8"], converter: AbletonToFabFilterProQ3 },
  { fromTypes: ["AbletonEq8"], converter: AbletonToSteinbergFrequency },
  {
    fromTypes: ["FabFilter Pro-Q", "FabFilter Pro-Q 2", "FabFilter Pro-Q 3"],
    converter: FabFilterToGenericEQ,
  },
  {
    fromTypes: ["FabFilter Pro-Q", "FabFilter Pro-Q 2", "FabFilter Pro-Q 3"],
    converter: FabFilterToSteinbergFrequency,
  },
  { fromTypes: ["GenericEQPreset"], converter: GenericEQToSteinbergFrequency },
  {
    fromTypes: ["SteinbergFrequency"],
    converter: SteinbergFrequencyToGenericEQ,
  },
  { fromTypes: ["REWText"], converter: REWToFabFilterProQ },
  { fromTypes: ["REWText"], converter: REWToFabFilterProQ2 },
  { fromTypes: ["REWText"], converter: REWToFabFilterProQ3 },
  { fromTypes: ["GenericFXP"], converter: GenericFXPConverter },
  { fromTypes: ["GenericXML"], converter: GenericXMLConverter },
  { fromTypes: ["WavesSSLChannel"], converter: WavesSSLToSSLNativeChannel },
  { fromTypes: ["WavesSSLChannel"], converter: WavesSSLToGenericEQ },
  { fromTypes: ["SSLNativeChannel"], converter: SSLNativeToGenericEQ },
  { fromTypes: ["SSLNativeChannel"], converter: SSLNativeToWavesSSLChannel },
  { fromTypes: ["WavesSSLChannel"], converter: WavesSSLChannelToText },
  { fromTypes: ["SSLNativeChannel"], converter: SSLNativeChannelToText },
  { fromTypes: ["WavesSSLComp"], converter: WavesSSLCompToText },
  {
    fromTypes: ["WavesSSLComp"],
    converter: WavesSSLCompToGenericCompressorLimiter,
  },
];
