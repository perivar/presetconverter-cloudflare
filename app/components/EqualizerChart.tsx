import { useMemo, useState } from "react";
import type { EQBand } from "~/routes/frontpage";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface EqualizerChartProps {
  bands: EQBand[];
  onFrequencyHover?: (frequency: number | null) => void;
}

// Helper function to calculate frequency response
const calculateFrequencyResponse = (bands: EQBand[]) => {
  const frequencies = Array.from({ length: 30 }, (_, i) => {
    // Logarithmic scale from 20Hz to 20kHz
    return 20 * Math.pow(10, (i / 29) * 3);
  });

  return frequencies.map(freq => {
    let gainDb = 0;
    bands.forEach(band => {
      if (!band.Enabled) return;

      // Simple bell filter approximation
      const f0 = band.Frequency;
      const gain = band.Gain;
      const q = band.Q;

      // Frequency ratio
      const f_ratio = freq / f0;

      // Basic filter response calculation
      const response = Math.pow(
        1 + Math.pow(q * (f_ratio - 1 / f_ratio), 2),
        -1
      );

      gainDb += gain * response;
    });

    return {
      frequency: freq,
      gain: gainDb,
    };
  });
};

export function EqualizerChart({
  bands,
  onFrequencyHover,
}: EqualizerChartProps) {
  const [hoveredFrequency, setHoveredFrequency] = useState<number | null>(null);

  // Memoize frequency response calculation
  const frequencyResponseData = useMemo(
    () => calculateFrequencyResponse(bands || []),
    [bands]
  );

  // Handle hover state changes
  const handleFrequencyHover = (frequency: number | null) => {
    setHoveredFrequency(frequency);
    onFrequencyHover?.(frequency);
  };

  return (
    <div className="rounded-lg border border-border p-4">
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={frequencyResponseData}
            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
            onMouseMove={state => {
              if (state?.activePayload?.[0]?.payload?.frequency) {
                handleFrequencyHover(state.activePayload[0].payload.frequency);
              }
            }}
            onMouseLeave={() => handleFrequencyHover(null)}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="hsl(var(--muted-foreground))"
            />
            <XAxis
              dataKey="frequency"
              type="number"
              scale="log"
              domain={[20, 20000]}
              ticks={[20, 50, 100, 200, 500, 1000, 2000, 5000, 10000, 20000]}
              tickFormatter={(val: number) =>
                val >= 1000 ? `${val / 1000}k Hz` : `${val} Hz`
              }
              stroke="hsl(var(--foreground))"
            />
            <YAxis
              domain={[-24, 24]}
              tickFormatter={(val: number) => `${val}dB`}
              stroke="hsl(var(--foreground))"
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload?.[0]?.payload) {
                  const { frequency, gain } = payload[0].payload;
                  handleFrequencyHover(frequency);
                  return (
                    <div className="rounded-lg border border-border bg-background p-2 shadow-lg">
                      <p className="font-medium">
                        {frequency >= 1000
                          ? `${(frequency / 1000).toFixed(1)}k`
                          : frequency.toFixed(1)}{" "}
                        Hz
                      </p>
                      <p className="text-muted-foreground">
                        {gain.toFixed(1)} dB
                      </p>
                    </div>
                  );
                }
                handleFrequencyHover(null);
                return null;
              }}
              cursor={false}
            />
            <Area
              type="monotone"
              dataKey="gain"
              stroke="hsl(var(--primary))"
              fill="hsl(var(--primary))"
              fillOpacity={0.2}
              dot={false}
              activeDot={{
                r: 6,
                stroke: "hsl(var(--primary))",
                strokeWidth: 2,
                fill: "hsl(var(--background))",
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
