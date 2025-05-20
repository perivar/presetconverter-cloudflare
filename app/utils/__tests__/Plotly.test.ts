import fs from "fs";
import path from "path";
import { type Layout } from "plotly.js-basic-dist";

import { puppeteerPlotlyToSVG } from "../../../jest.setup";
import { plotAutomationEvents } from "../ableton/AutomationPlot";
import { AutomationEvent, interpolateEvents } from "../ableton/Midi";

const targetDir = path.join(__dirname, "ableton-tests");

beforeAll(() => {
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }
});

afterAll(() => {
  // if (fs.existsSync(targetDir)) {
  //   fs.rmSync(targetDir, { recursive: true, force: true });
  // }
});

test("figure JSON contains meta and correct ranges", () => {
  const fig = plotAutomationEvents([{ position: 0, value: 64 }], {
    suggestedFilename: "take-42.png",
    sourceFile: "foo.mid",
  });

  const layout = fig.layout as Partial<Layout> & { meta?: any };
  expect(layout.meta?.suggestedFilename).toBe("take-42.png");
  expect(layout.meta?.sourceFile).toBe("foo.mid");
  expect(layout.xaxis?.range).toEqual([0, 0]);
});

test("should plot interpolated automation events to SVG", async () => {
  const events: AutomationEvent[] = [
    { position: 0, value: 0 },
    { position: 100, value: 127 },
    { position: 200, value: 0 },
  ];
  const interpolatedEvents = interpolateEvents(events);

  const fig = plotAutomationEvents(
    interpolatedEvents,
    {},
    "Interpolated Automation Plot"
  );

  // Use Puppeteer helper to get pure SVG string
  const svg = await puppeteerPlotlyToSVG(fig);

  const outputPath = path.join(
    targetDir,
    "ableton_temp_interpolated_automation_plot.svg"
  );

  fs.writeFileSync(outputPath, svg, "utf-8");

  expect(fs.existsSync(outputPath)).toBe(true);
}, 30000); // extend timeout for Puppeteer
