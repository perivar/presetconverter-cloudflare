import { useMemo, useState } from "react";
import { formatWithMetric } from "~/utils/formatWithMetric";
import {
  GenericEQShape,
  GenericEQSlope,
  GenericEQStereoPlacement,
} from "~/utils/preset/GenericEQPreset";
import type {
  GenericEQBand,
  GenericEQPreset,
} from "~/utils/preset/GenericEQPreset";
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Label,
  ResponsiveContainer,
  Scatter,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipProps, // Import TooltipProps
} from "recharts";

// Constants
const SAMPLE_RATE = 48000; // Assume a sample rate for calculations
const MIN_FREQ = 20;
const MAX_FREQ = 20000;
const FREQ_POINTS = 100; // Number of points for the curve
const MIN_GAIN_DB = -36; // Min dB for display range
const MAX_GAIN_DB = 36; // Max dB for display range

// Helper to get shape name
const getShapeName = (shape: GenericEQShape | number): string => {
  // Handle potential number values if type union isn't fully resolved at runtime
  const shapeValue = typeof shape === "number" ? shape : shape;
  switch (shapeValue) {
    case GenericEQShape.Bell:
      return "Bell";
    case GenericEQShape.LowShelf:
      return "Low Shelf";
    case GenericEQShape.LowCut:
      return "Low Cut";
    case GenericEQShape.HighShelf:
      return "High Shelf";
    case GenericEQShape.HighCut:
      return "High Cut";
    case GenericEQShape.Notch:
      return "Notch";
    case GenericEQShape.BandPass:
      return "Band Pass";
    case GenericEQShape.TiltShelf:
      return "Tilt Shelf";
    case GenericEQShape.FlatTilt:
      return "Flat Tilt";

    default:
      return `Unknown (${shapeValue})`;
  }
};

// Helper to get slope name
const getSlopeName = (slope: GenericEQSlope | number): string => {
  const slopeValue = typeof slope === "number" ? slope : slope;
  switch (slopeValue) {
    case GenericEQSlope.Slope6dB_oct:
      return "6 dB/oct";
    case GenericEQSlope.Slope12dB_oct:
      return "12 dB/oct";
    case GenericEQSlope.Slope18dB_oct:
      return "18 dB/oct";
    case GenericEQSlope.Slope24dB_oct:
      return "24 dB/oct";
    case GenericEQSlope.Slope30dB_oct:
      return "30 dB/oct";
    case GenericEQSlope.Slope36dB_oct:
      return "36 dB/oct";
    case GenericEQSlope.Slope48dB_oct:
      return "48 dB/oct";
    case GenericEQSlope.Slope72dB_oct:
      return "72 dB/oct";
    case GenericEQSlope.Slope96dB_oct:
      return "96 dB/oct";
    case GenericEQSlope.SlopeBrickwall:
      return "Brickwall";
    default:
      return `Unknown (${slopeValue})`;
  }
};

// Helper to get stereo placement name
const getStereoPlacementName = (
  placement: GenericEQStereoPlacement | number
): string => {
  const placementValue = typeof placement === "number" ? placement : placement;
  switch (placementValue) {
    case GenericEQStereoPlacement.Left:
      return "Left";
    case GenericEQStereoPlacement.Right:
      return "Right";
    case GenericEQStereoPlacement.Stereo:
      return "Stereo";
    case GenericEQStereoPlacement.Mid:
      return "Mid";
    case GenericEQStereoPlacement.Side:
      return "Side";
    default:
      return `Unknown (${placementValue})`;
  }
};

// Accurate Frequency Response Calculation using Audio EQ Cookbook formulas
// Calculates the combined dB gain of all enabled bands at various frequencies.
const calculateFrequencyResponse = (bands: GenericEQBand[]) => {
  const frequencies = Array.from({ length: FREQ_POINTS }, (_, i) => {
    // Generate frequencies on a logarithmic scale
    return (
      MIN_FREQ *
      Math.pow(10, (i / (FREQ_POINTS - 1)) * Math.log10(MAX_FREQ / MIN_FREQ))
    );
  });

  const responseData = frequencies.map(freq => {
    let totalGainDb = 0;

    // Use for...of loop to allow 'continue' inside switch
    for (const band of bands) {
      // Skip disabled bands or bands with invalid frequency
      if (!band.Enabled || !band.Frequency || band.Frequency <= 0) continue; // Use continue, not return

      const f0 = band.Frequency;
      const gainDb = band.Gain;
      // Ensure Q is positive and reasonably small for stability if needed
      const Q = Math.max(0.025, band.Q);
      const shape = band.Shape;

      // Optimization: A Bell filter with 0dB gain should have no effect.
      // Skip calculations to avoid potential numerical issues with A=1 and low Q.
      if (shape === GenericEQShape.Bell && gainDb === 0) {
        continue; // Skip to the next band for this frequency point
      }

      // Precompute common values for biquad calculations
      const A = Math.pow(10, gainDb / 40); // Amplitude factor for peaking/shelf
      const w0 = (2 * Math.PI * f0) / SAMPLE_RATE;
      const cos_w0 = Math.cos(w0);
      const sin_w0 = Math.sin(w0);
      // Alpha derived from Q - using the cookbook definition
      const alpha = sin_w0 / (2 * Q);

      let b0 = 0,
        b1 = 0,
        b2 = 0,
        a0 = 0,
        a1 = 0,
        a2 = 0;

      // Determine biquad coefficients based on filter shape
      switch (shape) {
        case GenericEQShape.Bell: // Peaking EQ
          b0 = 1 + alpha * A;
          b1 = -2 * cos_w0;
          b2 = 1 - alpha * A;
          a0 = 1 + alpha / A;
          a1 = -2 * cos_w0;
          a2 = 1 - alpha / A;
          break;
        case GenericEQShape.LowShelf:
          // Using cookbook shelf filter formula with Q affecting the transition slope/shape
          const shelfAlphaLS =
            (sin_w0 / 2) * Math.sqrt((A + 1 / A) * (1 / Q - 1) + 2); // Q definition for shelf slope
          b0 = A * (A + 1 - (A - 1) * cos_w0 + 2 * Math.sqrt(A) * shelfAlphaLS);
          b1 = 2 * A * (A - 1 - (A + 1) * cos_w0);
          b2 = A * (A + 1 - (A - 1) * cos_w0 - 2 * Math.sqrt(A) * shelfAlphaLS);
          a0 = A + 1 + (A - 1) * cos_w0 + 2 * Math.sqrt(A) * shelfAlphaLS;
          a1 = -2 * (A - 1 + (A + 1) * cos_w0);
          a2 = A + 1 + (A - 1) * cos_w0 - 2 * Math.sqrt(A) * shelfAlphaLS;
          break;
        case GenericEQShape.HighShelf:
          const shelfAlphaHS =
            (sin_w0 / 2) * Math.sqrt((A + 1 / A) * (1 / Q - 1) + 2); // Q definition for shelf slope
          b0 = A * (A + 1 + (A - 1) * cos_w0 + 2 * Math.sqrt(A) * shelfAlphaHS);
          b1 = -2 * A * (A - 1 + (A + 1) * cos_w0);
          b2 = A * (A + 1 + (A - 1) * cos_w0 - 2 * Math.sqrt(A) * shelfAlphaHS);
          a0 = A + 1 - (A - 1) * cos_w0 + 2 * Math.sqrt(A) * shelfAlphaHS;
          a1 = 2 * (A - 1 - (A + 1) * cos_w0);
          a2 = A + 1 - (A - 1) * cos_w0 - 2 * Math.sqrt(A) * shelfAlphaHS;
          break;
        case GenericEQShape.LowCut: // High-pass (Gain/A are not used)
          // Use standard biquad coefficients for a 12 dB/octave high-pass filter
          b0 = (1 + cos_w0) / 2;
          b1 = -(1 + cos_w0);
          b2 = (1 + cos_w0) / 2;
          a0 = 1 + alpha;
          a1 = -2 * cos_w0;
          a2 = 1 - alpha;
          break;
        case GenericEQShape.HighCut: // Low-pass (Gain/A are not used)
          // Use standard biquad coefficients for a 12 dB/octave low-pass filter
          b0 = (1 - cos_w0) / 2;
          b1 = 1 - cos_w0;
          b2 = (1 - cos_w0) / 2;
          a0 = 1 + alpha;
          a1 = -2 * cos_w0;
          a2 = 1 - alpha;
          break;
        case GenericEQShape.Notch: // Gain/A are not used
          b0 = 1;
          b1 = -2 * cos_w0;
          b2 = 1;
          a0 = 1 + alpha;
          a1 = -2 * cos_w0;
          a2 = 1 - alpha;
          break;
        case GenericEQShape.BandPass:
          b0 = alpha;
          b1 = 0;
          b2 = -alpha;
          a0 = 1 + alpha;
          a1 = -2 * cos_w0;
          a2 = 1 - alpha;
          break;
        case GenericEQShape.TiltShelf:
          // Tilt shelf filter implementation
          const tiltGain = Math.pow(10, gainDb / 20);
          const tiltAlpha = (tiltGain - 1) / (tiltGain + 1);
          b0 = tiltGain * (1 + tiltAlpha * cos_w0);
          b1 = tiltGain * (-2 * cos_w0);
          b2 = tiltGain * (1 - tiltAlpha * cos_w0);
          a0 = 1 + tiltAlpha * cos_w0;
          a1 = -2 * cos_w0;
          a2 = 1 - tiltAlpha * cos_w0;
          break;
        case GenericEQShape.FlatTilt:
          // Flat tilt filter implementation
          const flatTiltGain = Math.pow(10, gainDb / 20);
          b0 = flatTiltGain;
          b1 = 0;
          b2 = 0;
          a0 = 1;
          a1 = 0;
          a2 = 0;
          break;
        default:
          // Skip this band's contribution if shape is not recognized
          continue;
      }

      // Calculate magnitude response |H(z)| at the current frequency 'freq'
      // using the biquad coefficients. z = e^(j*omega)
      const omega = (2 * Math.PI * freq) / SAMPLE_RATE;
      const cw = Math.cos(omega);
      const sw = Math.sin(omega);
      const cw2 = Math.cos(2 * omega); // cos(2w) = 2cos^2(w)-1
      const sw2 = Math.sin(2 * omega); // sin(2w) = 2cos(w)sin(w)

      // Numerator: N(z) = b0 + b1*z^-1 + b2*z^-2
      const realNumerator = b0 + b1 * cw + b2 * cw2;
      const imagNumerator = -(b1 * sw + b2 * sw2); // z^-1 = cos(w) - j*sin(w)

      // Denominator: D(z) = a0 + a1*z^-1 + a2*z^-2
      const realDenominator = a0 + a1 * cw + a2 * cw2;
      const imagDenominator = -(a1 * sw + a2 * sw2);

      const numeratorMagSq =
        Math.pow(realNumerator, 2) + Math.pow(imagNumerator, 2);
      const denominatorMagSq =
        Math.pow(realDenominator, 2) + Math.pow(imagDenominator, 2);

      let bandGainDb = 0;
      if (denominatorMagSq > 1e-10) {
        // Avoid division by zero or near-zero
        let magnitudeSquared = numeratorMagSq / denominatorMagSq;

        // Apply slope based on EQSlope parameter
        if (
          shape === GenericEQShape.LowCut ||
          shape === GenericEQShape.HighCut
        ) {
          // Calculate number of cascades needed based on slope
          let cascades = 1;
          switch (band.Slope) {
            case GenericEQSlope.Slope6dB_oct:
              cascades = 0.5; // Half cascade for 6dB/oct
              break;
            case GenericEQSlope.Slope12dB_oct:
              cascades = 1;
              break;
            case GenericEQSlope.Slope18dB_oct:
              cascades = 1.5;
              break;
            case GenericEQSlope.Slope24dB_oct:
              cascades = 2;
              break;
            case GenericEQSlope.Slope30dB_oct:
              cascades = 2.5;
              break;
            case GenericEQSlope.Slope36dB_oct:
              cascades = 3;
              break;
            case GenericEQSlope.Slope48dB_oct:
              cascades = 4;
              break;
            case GenericEQSlope.Slope72dB_oct:
              cascades = 6;
              break;
            case GenericEQSlope.Slope96dB_oct:
              cascades = 8;
              break;
            case GenericEQSlope.SlopeBrickwall:
              // Approximate brickwall with very steep slope
              cascades = 16;
              break;
            default:
              cascades = 1;
          }

          // Apply cascaded filter effect with proper slope modeling
          if (cascades > 0) {
            // Calculate the actual cascaded response (not just power)
            const normalizedFreq = freq / f0;

            // For high slopes, use a more accurate model
            if (cascades >= 4) {
              // Steeper slopes use logarithmic scaling
              const slopeFactor = cascades * 6; // 6dB per octave per cascade
              const octaves = Math.log2(normalizedFreq);
              // Apply slope in correct direction based on filter type
              if (shape === GenericEQShape.LowCut) {
                // Only attenuate below cutoff (high-pass)
                magnitudeSquared =
                  octaves < 0
                    ? Math.pow(10, -Math.abs(octaves * slopeFactor) / 10)
                    : 1;
              } else {
                // Only attenuate above cutoff (low-pass)
                magnitudeSquared =
                  octaves > 0
                    ? Math.pow(10, -Math.abs(octaves * slopeFactor) / 10)
                    : 1;
              }
            } else {
              // Smoother transition for lower slopes
              magnitudeSquared = Math.pow(magnitudeSquared, cascades);
            }
          }
        }

        // Ensure magnitudeSquared is non-negative before log
        bandGainDb = 10 * Math.log10(Math.max(1e-10, magnitudeSquared)); // 10*log10 for power/magnitude squared
      } else {
        bandGainDb = -100; // Treat as very high attenuation
      }

      // Clamp and add contribution, ensuring it's a valid number
      bandGainDb = Math.max(-100, Math.min(100, bandGainDb));
      if (!isNaN(bandGainDb) && isFinite(bandGainDb)) {
        totalGainDb += bandGainDb;
      }
    } // End for...of loop

    // Clamp the total gain for the final display range
    // Use stricter clamping for LowCut/HighCut to prevent excessive attenuation
    totalGainDb = Math.max(MIN_GAIN_DB, Math.min(MAX_GAIN_DB, totalGainDb));

    return {
      frequency: freq,
      gain: totalGainDb,
    };
  }); // End frequencies.map

  return responseData; // Return the calculated data
}; // End calculateFrequencyResponse

interface EqualizerChartProps {
  preset: GenericEQPreset;
  onFrequencyHover?: (frequency: number | null) => void;
}

// Custom Tooltip for Scatter points (EQ Bands)
interface CustomScatterTooltipProps extends TooltipProps<number, string> {}

const CustomScatterTooltip = ({
  active,
  payload,
}: CustomScatterTooltipProps) => {
  if (active && payload && payload.length) {
    const band = payload[1].payload.bandInfo;
    if (!band || typeof band.Frequency !== "number") return null;

    const shapeName = getShapeName(band.Shape);
    const stereoPlacementName = getStereoPlacementName(band.StereoPlacement);
    return (
      <div className="rounded-lg border border-border bg-background p-2 text-sm text-foreground shadow-lg">
        <p className="font-medium">
          Freq: {formatWithMetric(band.Frequency, "Hz", 1)}
        </p>
        <p>Gain: {band.Gain.toFixed(1)} dB</p>
        <p>Q: {band.Q.toFixed(2)}</p>
        <p>Shape: {shapeName}</p>
        {band.Shape === GenericEQShape.LowCut ||
        band.Shape === GenericEQShape.HighCut ? (
          <p>Slope: {getSlopeName(band.Slope)}</p>
        ) : null}
        <p>Placement: {stereoPlacementName}</p>
      </div>
    );
  }
  return null;
};

export function EqualizerChart({
  preset,
  onFrequencyHover,
}: EqualizerChartProps) {
  // State to track the currently hovered band for highlighting and tooltip
  const [hoveredBandFrequency, setHoveredBandFrequency] = useState<
    number | null
  >(null);

  // Memoize the calculation of the overall frequency response curve
  const frequencyResponseData = useMemo(
    () => calculateFrequencyResponse(preset.Bands || []),
    [preset.Bands]
  );

  // Memoize the data prepared for the Scatter plot (only enabled bands)
  const enabledBandsData = useMemo(() => {
    return (
      (preset.Bands || [])
        .filter(
          band =>
            band.Enabled && band.Frequency > 0 && band.Frequency <= MAX_FREQ
        )
        // Clamp gain for plotting within the visible Y-axis range
        .map(band => ({
          frequency: band.Frequency,
          gain: Math.max(MIN_GAIN_DB, Math.min(MAX_GAIN_DB, band.Gain)),
          bandInfo: band,
        }))
    );
  }, [preset.Bands]);

  // Define a type for the Scatter hover payload
  type ScatterHoverPayload = {
    payload?: {
      frequency: number;
      gain: number;
      bandInfo: GenericEQBand;
    };
  } | null;

  // Handler for mouse entering/leaving a scatter point (band dot)
  const handleBandHover = (data: ScatterHoverPayload) => {
    const bandFrequency = data?.payload?.frequency ?? null;
    setHoveredBandFrequency(bandFrequency);
    onFrequencyHover?.(bandFrequency);
  };

  return (
    // Container using theme variables for colors and styling
    <div className="rounded-lg border border-border bg-card p-4 text-card-foreground">
      <div className="h-[350px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={frequencyResponseData}
            margin={{ top: 10, right: 15, left: 10, bottom: 25 }} // Adjusted margins for labels
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="hsl(var(--muted-foreground) / 0.5)"
            />
            {/* X Axis (Frequency - Logarithmic Scale) */}
            <XAxis
              xAxisId="0" // Add ID
              dataKey="frequency"
              type="number"
              scale="log"
              domain={[MIN_FREQ, MAX_FREQ]}
              ticks={[20, 50, 100, 200, 500, 1000, 2000, 5000, 10000, 20000]}
              tickFormatter={
                (val: number) => (val >= 1000 ? `${val / 1000}k` : `${val}`) // Format as 'k' for kHz
              }
              stroke="hsl(var(--foreground))"
              tick={{ fontSize: 10 }}
              height={35} // Allocate space for label
            >
              <Label
                value="Frequency (Hz)"
                offset={0}
                position="insideBottom"
                fill="hsl(var(--foreground))"
                fontSize={12}
              />
            </XAxis>
            {/* Y Axis (Gain - Linear Scale) */}
            <YAxis
              yAxisId="0" // Add ID
              width={45} // Allocate space for label
              dataKey="gain"
              domain={[MIN_GAIN_DB, MAX_GAIN_DB]}
              ticks={[-24, -18, -12, -6, 0, 6, 12, 18, 24]}
              tickFormatter={(val: number) => `${val}`} // Show dB value
              stroke="hsl(var(--foreground))"
              tick={{ fontSize: 10 }}
              label={{
                value: "Gain (dB)",
                angle: -90,
                position: "insideLeft",
                style: { textAnchor: "middle", fill: "hsl(var(--foreground))" },
                fontSize: 12,
              }}
            />

            {/* Tooltip - Configured to show info for the hovered band */}
            <Tooltip
              content={<CustomScatterTooltip />}
              cursor={false}
              wrapperStyle={{ zIndex: 100 }}
              allowEscapeViewBox={{ x: true, y: true }}
              position={{ y: -60 }}
              isAnimationActive={false}
            />

            {/* Area representing the combined frequency response */}
            <Area
              type="monotone"
              dataKey="gain"
              stroke="hsl(var(--primary))"
              fill="hsl(var(--primary) / 0.2)" // Use HSL with alpha for fill
              strokeWidth={2}
              dot={false} // No dots on the area curve itself
              activeDot={false} // Disable default active dot behavior
              isAnimationActive={false}
            />

            {/* Scatter plot for individual EQ band points */}
            <Scatter
              key="eq-bands-scatter"
              name="EQ Bands"
              data={enabledBandsData}
              xAxisId="0"
              yAxisId="0"
              dataKey="gain"
              fill="hsl(var(--primary) / 0.5)"
              r={4}
              stroke="hsl(var(--primary))"
              strokeWidth={1}
              isAnimationActive={false}
              onMouseOver={handleBandHover}
              onMouseOut={() => handleBandHover(null)}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
