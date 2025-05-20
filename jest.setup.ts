import puppeteer from "puppeteer";
import type { Browser, Page } from "puppeteer";

let browser: Browser;

beforeAll(async () => {
  browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  (global as any).browser = browser;
});

afterAll(async () => {
  if (browser) {
    await browser.close();
  }
});

export async function newPage() {
  if (!browser) throw new Error("Browser is not initialized");
  return browser.newPage();
}

export async function puppeteerPlotlyToSVG(
  fig: { data: any[]; layout: any },
  page?: Page
): Promise<string> {
  // Use width and height from layout, fallback to some default if missing
  const width = fig.layout.width ?? 800;
  const height = fig.layout.height ?? 400;

  let localPage: Page | undefined = page;

  if (!localPage) {
    if (!(global as any).browser) {
      throw new Error("Global browser not initialized");
    }
    localPage = await (global as any).browser.newPage();
  }

  if (!localPage) {
    throw new Error("Page is not defined");
  }

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <script src="https://cdn.plot.ly/plotly-3.0.1.min.js" charset="utf-8"></script>
        <style>
          body, html { margin: 0; padding: 0; }
          #plot { width: ${width}px; height: ${height}px; }
        </style>
      </head>
      <body>
        <div id="plot"></div>
        <script>
          (function() {
            const fig = ${JSON.stringify(fig)};
            Plotly.newPlot('plot', fig.data, fig.layout).then(() => {
              window.plotReady = true;
            });
          })();
        </script>
      </body>
    </html>
  `;

  await localPage.setContent(html);
  await localPage.waitForFunction("window.plotReady === true");

  const svg = await localPage.$eval("#plot svg.main-svg", el => el.outerHTML);

  return svg;
}
