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
    } else if (x > kneeEnd) {
      y = threshold + (x - threshold) / ratio;
    } else {
      // Soft knee interpolation (quadratic blend)
      const t = (x - kneeStart) / knee;
      const compressed = threshold + (x - threshold) / ratio;
      y =
        (1 - t) ** 2 * x +
        2 * (1 - t) * t * ((x + compressed) / 2) +
        t ** 2 * compressed;
    }

    y += makeupGain;
    data.push({ input: x, output: y });
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
          }}
        />
        <YAxis
          label={{
            value: "Output Level (dB)",
            angle: -90,
            position: "insideLeft",
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
      </LineChart>
    </ResponsiveContainer>
  );
}
