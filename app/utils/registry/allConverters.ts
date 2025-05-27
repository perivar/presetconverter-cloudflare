import { AbletonToFabFilterProQ3 } from "../converters/AbletonToFabFilterProQ3";
import { AbletonToSteinbergFrequency } from "../converters/AbletonToSteinbergFrequency";
import { FabFilterToGenericEQ } from "../converters/FabFilterToGenericEQ";
import { FabFilterToSteinbergFrequency } from "../converters/FabFilterToSteinbergFrequency";
import { GenericEQToSteinbergFrequency } from "../converters/GenericEQToSteinbergFrequency";
import { REWToFabFilterProQ } from "../converters/REWToFabFilterProQ";
import { REWToFabFilterProQ2 } from "../converters/REWToFabFilterProQ2";
import { REWToFabFilterProQ3 } from "../converters/REWToFabFilterProQ3";
import { SteinbergFrequencyToGenericEQ } from "../converters/SteinbergFrequencyToGenericEQ";
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
];
