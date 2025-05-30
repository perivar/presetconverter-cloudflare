import { Layout, PlotData } from "plotly.js-basic-dist";

import { AutomationEvent } from "./AutomationEvent";

/**
 * Build a **pure** Plotly figure (no DOM, no I/O).
 * Returns the JSON you can pass straight to Plotly.newPlot(),
 * Plotly.toImage(), or snapshot in Jest.
 */
export function plotAutomationEvents(
  events: AutomationEvent[],
  title = "Automation Events"
): { data: PlotData[]; layout: Partial<Layout> } {
  const xs = events.map(e => e.position);
  const ys = events.map(e => e.value);

  /* ── data (one scatter trace) ─────────────────────────────── */
  const trace = {
    type: "scatter",
    mode: "lines+markers",
    x: xs,
    y: ys,
    marker: {
      size: 5,
    },
    line: {
      width: 1,
    },
  } as PlotData;

  /* ── layout ───────────────────────────────────────────────── */
  const layout = {
    title,
    // Ensure consistent x-axis range and tick width across multiple graphs
    xaxis: { range: [0, 120000], dtick: 10000 },
    yaxis: { range: [0, 127] },
    width: Math.max(xs.length * 30, 3840),
    height: 480,
    autosize: false,
  } as Partial<Layout>;

  return { data: [trace], layout };
}
