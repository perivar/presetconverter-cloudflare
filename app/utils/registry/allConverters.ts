import { AbletonEq8ToFabFilterProQ3 } from "../converters/AbletonEq8ToFabFilterProQ3";
import { AbletonEq8ToSteinbergFrequency } from "../converters/AbletonEq8ToSteinbergFrequency";
import { FabFilterProQ3ToGenericFXP } from "../converters/FabFilterProQ3ToGenericFXP";
import { FabFilterProQBaseToGenericEQ } from "../converters/FabFilterProQBaseToGenericEQ";
import { FabFilterProQBaseToSteinbergFrequency } from "../converters/FabFilterProQBaseToSteinbergFrequency";
import { FabFilterProQBaseToSteinbergFrequency2 } from "../converters/FabFilterProQBaseToSteinbergFrequency2";
import { GenericEQToSteinbergFrequency } from "../converters/GenericEQToSteinbergFrequency";
import { GenericFXPConverter } from "../converters/GenericFXPConverter";
import { GenericXMLConverter } from "../converters/GenericXMLConverter";
import { REWToFabFilterProQ } from "../converters/REWToFabFilterProQ";
import { REWToFabFilterProQ2 } from "../converters/REWToFabFilterProQ2";
import { REWToFabFilterProQ3 } from "../converters/REWToFabFilterProQ3";
import { SSLNativeBusCompressorToGenericCompressorLimiter } from "../converters/SSLNativeBusCompressorToGenericCompressorLimiter";
import { SSLNativeBusCompressorToRawFXP } from "../converters/SSLNativeBusCompressorToRawFXP";
import { SSLNativeBusCompressorToText } from "../converters/SSLNativeBusCompressorToText";
import { SSLNativeBusCompressorToWavesSSLComp } from "../converters/SSLNativeBusCompressorToWavesSSLComp";
import { SSLNativeChannelToGenericEQ } from "../converters/SSLNativeChannelToGenericEQ";
import { SSLNativeChannelToRawFXP } from "../converters/SSLNativeChannelToRawFXP";
import { SSLNativeChannelToText } from "../converters/SSLNativeChannelToText";
import { SSLNativeChannelToUADSSLChannel } from "../converters/SSLNativeChannelToUADSSLChannel";
import { SSLNativeChannelToWavesSSLChannel } from "../converters/SSLNativeChannelToWavesSSLChannel";
import { SteinbergFrequencyToGenericEQ } from "../converters/SteinbergFrequencyToGenericEQ";
import { UADSSLChannelToGenericEQ } from "../converters/UADSSLChannelToGenericEQ";
import { UADSSLChannelToRawFXP } from "../converters/UADSSLChannelToRawFXP";
import { UADSSLChannelToSSLNativeChannel } from "../converters/UADSSLChannelToSSLNativeChannel";
import { UADSSLChannelToText } from "../converters/UADSSLChannelToText";
import { UADSSLChannelToWavesSSLChannel } from "../converters/UADSSLChannelToWavesSSLChannel";
import { VstPresetToRawText } from "../converters/VstPresetToRawText";
import { WavesSSLChannelToGenericEQ } from "../converters/WavesSSLChannelToGenericEQ";
import { WavesSSLChannelToRawFXP } from "../converters/WavesSSLChannelToRawFXP";
import { WavesSSLChannelToSSLNativeChannel } from "../converters/WavesSSLChannelToSSLNativeChannel";
import { WavesSSLChannelToText } from "../converters/WavesSSLChannelToText";
import { WavesSSLChannelToUADSSLChannel } from "../converters/WavesSSLChannelToUADSSLChannel";
import { WavesSSLCompToGenericCompressorLimiter } from "../converters/WavesSSLCompToGenericCompressorLimiter";
import { WavesSSLCompToRawFXP } from "../converters/WavesSSLCompToRawFXP";
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
  {
    fromTypes: ["FabFilter Pro-Q", "FabFilter Pro-Q 2", "FabFilter Pro-Q 3"],
    converter: FabFilterProQBaseToSteinbergFrequency2,
  },
  { fromTypes: ["FabFilter Pro-Q 3"], converter: FabFilterProQ3ToGenericFXP },
  { fromTypes: ["GenericEQPreset"], converter: GenericEQToSteinbergFrequency },
  { fromTypes: ["GenericFXP"], converter: GenericFXPConverter },
  { fromTypes: ["GenericXML"], converter: GenericXMLConverter },
  { fromTypes: ["REWText"], converter: REWToFabFilterProQ },
  { fromTypes: ["REWText"], converter: REWToFabFilterProQ2 },
  { fromTypes: ["REWText"], converter: REWToFabFilterProQ3 },
  {
    fromTypes: ["SSLNativeBusCompressor"],
    converter: SSLNativeBusCompressorToGenericCompressorLimiter,
  },
  {
    fromTypes: ["SSLNativeBusCompressor"],
    converter: SSLNativeBusCompressorToRawFXP,
  },
  {
    fromTypes: ["SSLNativeBusCompressor"],
    converter: SSLNativeBusCompressorToText,
  },
  {
    fromTypes: ["SSLNativeBusCompressor"],
    converter: SSLNativeBusCompressorToWavesSSLComp,
  },
  { fromTypes: ["SSLNativeChannel"], converter: SSLNativeChannelToGenericEQ },
  { fromTypes: ["SSLNativeChannel"], converter: SSLNativeChannelToRawFXP },
  { fromTypes: ["SSLNativeChannel"], converter: SSLNativeChannelToText },
  {
    fromTypes: ["SSLNativeChannel"],
    converter: SSLNativeChannelToUADSSLChannel,
  },
  {
    fromTypes: ["SSLNativeChannel"],
    converter: SSLNativeChannelToWavesSSLChannel,
  },
  {
    fromTypes: ["SteinbergFrequency"],
    converter: SteinbergFrequencyToGenericEQ,
  },
  {
    fromTypes: ["SteinbergFrequency", "SteinbergCompressor"],
    converter: VstPresetToRawText,
  },
  { fromTypes: ["UADSSLChannel"], converter: UADSSLChannelToGenericEQ },
  { fromTypes: ["UADSSLChannel"], converter: UADSSLChannelToRawFXP },
  { fromTypes: ["UADSSLChannel"], converter: UADSSLChannelToSSLNativeChannel },
  { fromTypes: ["UADSSLChannel"], converter: UADSSLChannelToText },
  { fromTypes: ["UADSSLChannel"], converter: UADSSLChannelToWavesSSLChannel },
  { fromTypes: ["WavesSSLChannel"], converter: WavesSSLChannelToGenericEQ },
  { fromTypes: ["WavesSSLChannel"], converter: WavesSSLChannelToRawFXP },
  {
    fromTypes: ["WavesSSLChannel"],
    converter: WavesSSLChannelToSSLNativeChannel,
  },
  { fromTypes: ["WavesSSLChannel"], converter: WavesSSLChannelToText },
  { fromTypes: ["WavesSSLChannel"], converter: WavesSSLChannelToUADSSLChannel },
  {
    fromTypes: ["WavesSSLComp"],
    converter: WavesSSLCompToGenericCompressorLimiter,
  },
  { fromTypes: ["WavesSSLComp"], converter: WavesSSLCompToRawFXP },
  {
    fromTypes: ["WavesSSLComp"],
    converter: WavesSSLCompToSSLNativeBusCompressor,
  },
  { fromTypes: ["WavesSSLComp"], converter: WavesSSLCompToText },
];
