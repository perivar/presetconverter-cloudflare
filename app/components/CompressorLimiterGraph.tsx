import { GenericCompressorLimiter } from "~/utils/preset/GenericCompressorLimiter";
import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type CompressorLimiterGraphProps = {
  comp: GenericCompressorLimiter;
};

export function CompressorLimiterGraph({ comp }: CompressorLimiterGraphProps) {
  const {
    Threshold: threshold,
    Ratio: ratio,
    MakeupGain: makeupGain,
    Knee: knee,
  } = comp;

  const data = [];
  const kneeStart = threshold - knee / 2;
  const kneeEnd = threshold + knee / 2;

  for (let x = -60; x <= 0; x += 0.5) {
    let y;

    if (x < kneeStart) {
      y = x;
    } else if (knee === 0) {
      // Hard knee
      y = threshold + (x - threshold) / ratio;
    } else if (x > kneeEnd) {
      y = threshold + (x - threshold) / ratio;
    } else {
      // Soft knee interpolation (quadratic blend)
      const t = (x - kneeStart) / knee; // t goes from 0 to 1
      const gainReductionAtKneeEnd = (knee / 2) * (1 - 1 / ratio);
      const currentGainReduction = gainReductionAtKneeEnd * t * t; // Quadratic increase in gain reduction
      y = x - currentGainReduction;
    }

    y += makeupGain;
    data.push({ input: x, output: y, threshold: threshold });
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <XAxis
          dataKey="input"
          domain={[-60, 0]}
          label={{
            value: "Input Level (dB)",
            position: "insideBottom",
            dy: 10,
            fontSize: 12,
          }}
        />
        <YAxis
          label={{
            value: "Output Level (dB)",
            angle: -90,
            position: "insideLeft",
            fontSize: 12,
          }}
        />
        <Tooltip formatter={(value: number) => `${value.toFixed(2)} dB`} />
        <Line
          type="monotone"
          dataKey="output"
          stroke="#00d2ff"
          strokeWidth={2}
          dot={false}
        />
        <Line
          dataKey="threshold"
          stroke="#ff0000" // Red color for threshold line
          strokeDasharray="3 3" // Dotted line
          dot={false}
          isAnimationActive={false} // No animation for static line
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
