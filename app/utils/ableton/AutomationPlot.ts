import { Layout, PlotData } from "plotly.js-basic-dist";

import { AutomationEvent } from "./Midi";

export interface AutomationMeta {
  suggestedFilename?: string;
  sourceFile?: string;
  [key: string]: unknown;
}

/**
 * Build a **pure** Plotly figure (no DOM, no I/O).
 * Returns the JSON you can pass straight to Plotly.newPlot(),
 * Plotly.toImage(), or snapshot in Jest.
 */
export function plotAutomationEvents(
  events: AutomationEvent[],
  meta: AutomationMeta = {},
  title = "Automation Events"
): { data: PlotData[]; layout: Partial<Layout> } {
  const xs = events.map(e => e.position);
  const ys = events.map(e => e.value);

  /* ── data (one scatter trace) ─────────────────────────────── */
  const trace = {
    type: "scatter",
    mode: "markers",
    x: xs,
    y: ys,
    marker: { size: 4 },
  } as PlotData;

  /* ── layout ───────────────────────────────────────────────── */
  const layout = {
    title,
    xaxis: { range: [0, Math.max(...xs)] },
    yaxis: { range: [0, 127] },
    // width: Math.max(xs.length * 30, 3840), // disable guessing width, using autosize instead
    height: 480,
    autosize: true,
    meta, // figure‑level meta
  } as Partial<Layout> & { meta?: any }; // <- inline cast fixes TS

  return { data: [trace], layout };
}
