import { AbletonEq8ToFabFilterProQ3 } from "../converters/AbletonEq8ToFabFilterProQ3";
import { AbletonEq8ToSteinbergFrequency } from "../converters/AbletonEq8ToSteinbergFrequency";
import { FabFilterProQ3ToGenericFXP } from "../converters/FabFilterProQ3ToGenericFXP";
import { FabFilterProQBaseToGenericEQ } from "../converters/FabFilterProQBaseToGenericEQ";
import { FabFilterProQBaseToSteinbergFrequency } from "../converters/FabFilterProQBaseToSteinbergFrequency";
import { GenericEQToSteinbergFrequency } from "../converters/GenericEQToSteinbergFrequency";
import { GenericFXPConverter } from "../converters/GenericFXPConverter"; // Import GenericFXPConverter
import { GenericXMLConverter } from "../converters/GenericXMLConverter";
import { REWToFabFilterProQ } from "../converters/REWToFabFilterProQ";
import { REWToFabFilterProQ2 } from "../converters/REWToFabFilterProQ2";
import { REWToFabFilterProQ3 } from "../converters/REWToFabFilterProQ3";
import { SSLNativeBusCompressorToGenericCompressorLimiter } from "../converters/SSLNativeBusCompressorToGenericCompressorLimiter";
import { SSLNativeBusCompressorToText } from "../converters/SSLNativeBusCompressorToText";
import { SSLNativeBusCompressorToWavesSSLComp } from "../converters/SSLNativeBusCompressorToWavesSSLComp";
import { SSLNativeChannelToGenericEQ } from "../converters/SSLNativeChannelToGenericEQ";
import { SSLNativeChannelToText } from "../converters/SSLNativeChannelToText";
import { SSLNativeChannelToUADSSLChannel } from "../converters/SSLNativeChannelToUADSSLChannel";
import { SSLNativeChannelToWavesSSLChannel } from "../converters/SSLNativeChannelToWavesSSLChannel";
import { SteinbergFrequencyToGenericEQ } from "../converters/SteinbergFrequencyToGenericEQ";
import { UADSSLChannelToGenericEQ } from "../converters/UADSSLChannelToGenericEQ";
import { UADSSLChannelToSSLNativeChannel } from "../converters/UADSSLChannelToSSLNativeChannel";
import { UADSSLChannelToText } from "../converters/UADSSLChannelToText";
import { UADSSLChannelToWavesSSLChannel } from "../converters/UADSSLChannelToWavesSSLChannel";
import { WavesSSLChannelToGenericEQ } from "../converters/WavesSSLChannelToGenericEQ";
import { WavesSSLChannelToSSLNativeChannel } from "../converters/WavesSSLChannelToSSLNativeChannel";
import { WavesSSLChannelToText } from "../converters/WavesSSLChannelToText";
import { WavesSSLChannelToUADSSLChannel } from "../converters/WavesSSLChannelToUADSSLChannel";
import { WavesSSLCompToGenericCompressorLimiter } from "../converters/WavesSSLCompToGenericCompressorLimiter";
import { WavesSSLCompToSSLNativeBusCompressor } from "../converters/WavesSSLCompToSSLNativeBusCompressor";
import { WavesSSLCompToText } from "../converters/WavesSSLCompToText";
import { ConverterRegistration } from "./converterRegistry";

export const allConverters: ConverterRegistration[] = [
  { fromTypes: ["AbletonEq8"], converter: AbletonEq8ToFabFilterProQ3 },
  { fromTypes: ["AbletonEq8"], converter: AbletonEq8ToSteinbergFrequency },
  {
    fromTypes: ["FabFilter Pro-Q", "FabFilter Pro-Q 2", "FabFilter Pro-Q 3"],
    converter: FabFilterProQBaseToGenericEQ,
  },
  {
    fromTypes: ["FabFilter Pro-Q", "FabFilter Pro-Q 2", "FabFilter Pro-Q 3"],
    converter: FabFilterProQBaseToSteinbergFrequency,
  },
  { fromTypes: ["FabFilter Pro-Q 3"], converter: FabFilterProQ3ToGenericFXP },

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
  {
    fromTypes: ["WavesSSLChannel"],
    converter: WavesSSLChannelToSSLNativeChannel,
  },
  { fromTypes: ["WavesSSLChannel"], converter: WavesSSLChannelToGenericEQ },
  { fromTypes: ["WavesSSLChannel"], converter: WavesSSLChannelToUADSSLChannel },
  { fromTypes: ["WavesSSLChannel"], converter: WavesSSLChannelToText },
  { fromTypes: ["SSLNativeChannel"], converter: SSLNativeChannelToGenericEQ },
  {
    fromTypes: ["SSLNativeChannel"],
    converter: SSLNativeChannelToWavesSSLChannel,
  },
  {
    fromTypes: ["SSLNativeChannel"],
    converter: SSLNativeChannelToUADSSLChannel,
  },
  { fromTypes: ["SSLNativeChannel"], converter: SSLNativeChannelToText },
  { fromTypes: ["UADSSLChannel"], converter: UADSSLChannelToWavesSSLChannel },
  { fromTypes: ["UADSSLChannel"], converter: UADSSLChannelToSSLNativeChannel },
  { fromTypes: ["UADSSLChannel"], converter: UADSSLChannelToGenericEQ },
  { fromTypes: ["UADSSLChannel"], converter: UADSSLChannelToText },
  { fromTypes: ["WavesSSLComp"], converter: WavesSSLCompToText },
  {
    fromTypes: ["WavesSSLComp"],
    converter: WavesSSLCompToGenericCompressorLimiter,
  },
  {
    fromTypes: ["WavesSSLComp"],
    converter: WavesSSLCompToSSLNativeBusCompressor,
  },
  {
    fromTypes: ["SSLNativeBusCompressor"],
    converter: SSLNativeBusCompressorToText,
  },
  {
    fromTypes: ["SSLNativeBusCompressor"],
    converter: SSLNativeBusCompressorToGenericCompressorLimiter,
  },
  {
    fromTypes: ["SSLNativeBusCompressor"],
    converter: SSLNativeBusCompressorToWavesSSLComp,
  },
];
