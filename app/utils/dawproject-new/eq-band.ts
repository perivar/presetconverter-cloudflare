// dawproject/eq-band.ts
import type { BoolParameter } from "./bool-parameter";
import type {
  EqBandType,
  EqBand as EqBandTypescript,
  XsInt,
} from "./project-schema";
import type { RealParameter } from "./real-parameter";

/**
 * Represents a single band within an equalizer.
 * Corresponds to the 'eqBand' complex type in Project.xsd.
 */
export class EqBand implements EqBandTypescript {
  /**
   * Type of the EQ band.
   * (Required attribute - eqBandType enum)
   */
  public "@_type": EqBandType;

  /**
   * Order of the band in the EQ chain.
   * (Optional attribute - xs:int)
   */
  public "@_order"?: XsInt;

  // Properties corresponding to child elements

  /**
   * The frequency parameter for the EQ band.
   * (Required child element)
   */
  public Freq: RealParameter;

  /**
   * The gain parameter for the EQ band.
   * (Optional child element)
   */
  public Gain?: RealParameter;

  /**
   * The Q (bandwidth) parameter for the EQ band.
   * (Optional child element)
   */
  public Q?: RealParameter;

  /**
   * Indicates if the EQ band is enabled.
   * (Optional child element)
   */
  public Enabled?: BoolParameter;

  /**
   * @param type - Type of the EQ band. (Required attribute - eqBandType enum)
   * @param freq - The frequency parameter for the EQ band. (Required child element)
   * @param order - Order of the band in the EQ chain. (Optional attribute - xs:int)
   * @param gain - The gain parameter for the EQ band. (Optional child element)
   * @param q - The Q (bandwidth) parameter for the EQ band. (Optional child element)
   * @param enabled - Indicates if the EQ band is enabled. (Optional child element)
   */
  constructor(
    type: EqBandType,
    freq: RealParameter,
    order?: XsInt,
    gain?: RealParameter,
    q?: RealParameter,
    enabled?: BoolParameter
  ) {
    this["@_type"] = type;
    this["@_order"] = order;
    this.Freq = freq;
    this.Gain = gain;
    this.Q = q;
    this.Enabled = enabled;
  }
}
