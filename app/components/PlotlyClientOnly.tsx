// app/components/PlotlyClientOnly.tsx
import { useEffect, useState } from "react";

export default function PlotlyClientOnly({
  data,
  layout,
}: {
  data: any;
  layout: any;
}) {
  const [Plot, setPlot] = useState<React.ComponentType<any> | null>(null);

  useEffect(() => {
    // Only run on the client
    import("react-plotly.js/factory").then(factory => {
      import("plotly.js-basic-dist").then(Plotly => {
        const PlotComponent = factory.default(Plotly);
        setPlot(() => PlotComponent);
      });
    });
  }, []);

  if (!Plot) return <div>Loading plot...</div>;

  return (
    <div className="mx-auto w-full">
      <Plot
        data={data}
        layout={{
          ...layout,
          autosize: true,
          width: undefined,
          height: 400,
          dragmode: "pan",
        }}
        style={{ width: "100%", height: "400px" }}
        config={{ responsive: true }}
      />
    </div>
  );
}
