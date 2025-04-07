import { useMemo, useState } from "react";
import type { EQBand } from "~/routes/frontpage";
import { FabfilterProQShape } from "~/utils/FabfilterProQBase";
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
const MIN_GAIN_DB = -30; // Min dB for display range
const MAX_GAIN_DB = 30; // Max dB for display range

// Helper to get shape name
const getShapeName = (shape: FabfilterProQShape | number): string => {
  // Handle potential number values if type union isn't fully resolved at runtime
  const shapeValue =
    typeof shape === "number"
      ? shape
      : FabfilterProQShape[shape as keyof typeof FabfilterProQShape];
  switch (shapeValue) {
    case FabfilterProQShape.Bell:
      return "Bell";
    case FabfilterProQShape.LowShelf:
      return "Low Shelf";
    case FabfilterProQShape.LowCut:
      return "Low Cut";
    case FabfilterProQShape.HighShelf:
      return "High Shelf";
    case FabfilterProQShape.HighCut:
      return "High Cut";
    case FabfilterProQShape.Notch:
      return "Notch";
    // Add cases for ProQ specific shapes if needed and known
    default:
      return `Unknown (${shapeValue})`;
  }
};

// Accurate Frequency Response Calculation using Audio EQ Cookbook formulas
// Calculates the combined dB gain of all enabled bands at various frequencies.
const calculateFrequencyResponse = (bands: EQBand[]) => {
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
        case FabfilterProQShape.Bell: // Peaking EQ
          b0 = 1 + alpha * A;
          b1 = -2 * cos_w0;
          b2 = 1 - alpha * A;
          a0 = 1 + alpha / A;
          a1 = -2 * cos_w0;
          a2 = 1 - alpha / A;
          break;
        case FabfilterProQShape.LowShelf:
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
        case FabfilterProQShape.HighShelf:
          const shelfAlphaHS =
            (sin_w0 / 2) * Math.sqrt((A + 1 / A) * (1 / Q - 1) + 2); // Q definition for shelf slope
          b0 = A * (A + 1 + (A - 1) * cos_w0 + 2 * Math.sqrt(A) * shelfAlphaHS);
          b1 = -2 * A * (A - 1 + (A + 1) * cos_w0);
          b2 = A * (A + 1 + (A - 1) * cos_w0 - 2 * Math.sqrt(A) * shelfAlphaHS);
          a0 = A + 1 - (A - 1) * cos_w0 + 2 * Math.sqrt(A) * shelfAlphaHS;
          a1 = 2 * (A - 1 - (A + 1) * cos_w0);
          a2 = A + 1 - (A - 1) * cos_w0 - 2 * Math.sqrt(A) * shelfAlphaHS;
          break;
        case FabfilterProQShape.LowCut: // High-pass (Gain/A are not used)
          b0 = (1 + cos_w0) / 2;
          b1 = -(1 + cos_w0);
          b2 = (1 + cos_w0) / 2;
          a0 = 1 + alpha;
          a1 = -2 * cos_w0;
          a2 = 1 - alpha;
          break;
        case FabfilterProQShape.HighCut: // Low-pass (Gain/A are not used)
          b0 = (1 - cos_w0) / 2;
          b1 = 1 - cos_w0;
          b2 = (1 - cos_w0) / 2;
          a0 = 1 + alpha;
          a1 = -2 * cos_w0;
          a2 = 1 - alpha;
          break;
        case FabfilterProQShape.Notch: // Gain/A are not used
          b0 = 1;
          b1 = -2 * cos_w0;
          b2 = 1;
          a0 = 1 + alpha;
          a1 = -2 * cos_w0;
          a2 = 1 - alpha;
          break;
          // Removed duplicate default case
          continue; // Skip this band's contribution
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
        const magnitudeSquared = numeratorMagSq / denominatorMagSq;
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
    totalGainDb = Math.max(
      MIN_GAIN_DB - 5,
      Math.min(MAX_GAIN_DB + 5, totalGainDb)
    );

    return {
      frequency: freq,
      gain: totalGainDb,
    };
  }); // End frequencies.map

  return responseData; // Return the calculated data
}; // End calculateFrequencyResponse

interface EqualizerChartProps {
  bands: EQBand[];
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
    return (
      <div className="rounded-lg border border-border bg-background p-2 text-sm text-foreground shadow-lg">
        <p className="font-medium">
          Freq:{" "}
          {band.Frequency >= 1000
            ? `${(band.Frequency / 1000).toFixed(1)}k`
            : band.Frequency.toFixed(1)}{" "}
          Hz
        </p>
        <p>Gain: {band.Gain.toFixed(1)} dB</p>
        <p>Q: {band.Q.toFixed(2)}</p>
        <p>Shape: {shapeName}</p>
      </div>
    );
  }
  return null;
};

export function EqualizerChart({
  bands,
  onFrequencyHover,
}: EqualizerChartProps) {
  // State to track the currently hovered band for highlighting and tooltip
  const [hoveredBandFrequency, setHoveredBandFrequency] = useState<
    number | null
  >(null);

  // Memoize the calculation of the overall frequency response curve
  const frequencyResponseData = useMemo(
    () => calculateFrequencyResponse(bands || []),
    [bands]
  );

  // Memoize the data prepared for the Scatter plot (only enabled bands)
  const enabledBandsData = useMemo(() => {
    return (
      (bands || [])
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
  }, [bands]);

  // Define a type for the Scatter hover payload
  type ScatterHoverPayload = {
    payload?: {
      frequency: number;
      gain: number;
      bandInfo: EQBand;
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
