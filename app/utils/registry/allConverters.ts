import { AbletonToFabFilterProQ3 } from "../converters/AbletonToFabFilterProQ3";
import { AbletonToSteinbergFrequency } from "../converters/AbletonToSteinbergFrequency";
import { FabFilterToGenericEQ } from "../converters/FabFilterToGenericEQ";
import { FabFilterToSteinbergFrequency } from "../converters/FabFilterToSteinbergFrequency";
import { GenericEQToSteinbergFrequency } from "../converters/GenericEQToSteinbergFrequency";
import { REWToFabFilterProQ } from "../converters/REWToFabFilterProQ";
import { REWToFabFilterProQ2 } from "../converters/REWToFabFilterProQ2";
import { REWToFabFilterProQ3 } from "../converters/REWToFabFilterProQ3";
import { SteinbergFrequencyToGenericEQ } from "../converters/SteinbergFrequencyToGenericEQ";

export const allConverters = [
  AbletonToFabFilterProQ3,
  AbletonToSteinbergFrequency,
  FabFilterToGenericEQ,
  FabFilterToSteinbergFrequency,
  GenericEQToSteinbergFrequency,
  SteinbergFrequencyToGenericEQ,
  REWToFabFilterProQ,
  REWToFabFilterProQ2,
  REWToFabFilterProQ3,
];
