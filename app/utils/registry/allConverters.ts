import AbletonToFabfilterProQ3 from "../converters/AbletonToFabFilterProQ3";
import { AbletonToSteinbergFrequency } from "../converters/AbletonToSteinbergFrequency";
import { FabFilterToGenericEQ } from "../converters/FabFilterToGenericEQ";
import { FabfilterToSteinbergFrequency } from "../converters/FabfilterToSteinbergFrequency";
import { GenericEQToSteinbergFrequency } from "../converters/GenericEQToSteinbergFrequency";
import { SteinbergFrequencyToGenericEQ } from "../converters/SteinbergFrequencyToGenericEQ";

export const allConverters = [
  AbletonToFabfilterProQ3,
  AbletonToSteinbergFrequency,
  FabFilterToGenericEQ,
  FabfilterToSteinbergFrequency,
  GenericEQToSteinbergFrequency,
  SteinbergFrequencyToGenericEQ,
];
