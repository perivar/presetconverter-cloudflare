import puppeteer from "puppeteer";
import type { Browser, Page } from "puppeteer";

let sharedBrowser: Browser | null = null;

export async function getSharedBrowser(): Promise<Browser> {
  if (!sharedBrowser) {
    sharedBrowser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
  }
  return sharedBrowser;
}

export async function closeSharedBrowser(): Promise<void> {
  if (sharedBrowser) {
    await sharedBrowser.close();
    sharedBrowser = null;
  }
}

export async function newPage(): Promise<Page> {
  const browser = await getSharedBrowser();
  return browser.newPage();
}

export async function puppeteerPlotlyToSVG(
  fig: { data: any[]; layout: any },
  page?: Page
): Promise<string> {
  // Use width and height from layout, fallback to some default if missing
  const width = fig.layout.width ?? 800;
  const height = fig.layout.height ?? 400;

  // Determine if we should manage browser lifecycle locally
  const useLocalBrowser = !page;
  let localBrowser: Browser | undefined;
  let localPage: Page | undefined = page;

  if (!localPage) {
    // Create a new browser instance for this call to avoid concurrency issues
    // when running tests in parallel
    localBrowser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    localPage = await localBrowser.newPage();
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

  // Clean up: close the page (and browser if we created one locally)
  if (localPage) {
    await localPage.close();
  }
  if (useLocalBrowser && localBrowser) {
    await localBrowser.close();
  }

  return svg;
}
