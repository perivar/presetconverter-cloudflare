import AbletonToFabfilterProQ3 from "../converters/AbletonToFabFilterProQ3";
import { AbletonToSteinbergFrequency } from "../converters/AbletonToSteinbergFrequency";
import { FabFilterToGenericEQ } from "../converters/FabFilterToGenericEQ";
import { FabfilterToSteinbergFrequency } from "../converters/FabfilterToSteinbergFrequency";
import { GenericEQToSteinbergFrequency } from "../converters/GenericEQToSteinbergFrequency";
import REWToFabfilterProQ from "../converters/REWToFabfilterProQ";
import REWToFabfilterProQ2 from "../converters/REWToFabfilterProQ2";
import REWToFabfilterProQ3 from "../converters/REWToFabfilterProQ3";
import { SteinbergFrequencyToGenericEQ } from "../converters/SteinbergFrequencyToGenericEQ";

export const allConverters = [
  AbletonToFabfilterProQ3,
  AbletonToSteinbergFrequency,
  FabFilterToGenericEQ,
  FabfilterToSteinbergFrequency,
  GenericEQToSteinbergFrequency,
  SteinbergFrequencyToGenericEQ,
  REWToFabfilterProQ,
  REWToFabfilterProQ2,
  REWToFabfilterProQ3,
];
