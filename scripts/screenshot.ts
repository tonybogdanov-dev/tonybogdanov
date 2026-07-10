import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { Builder, WebDriver } from 'selenium-webdriver';
import { Local } from 'browserstack-local';
import sharp from 'sharp';
import { config } from '../config.node';

const USERNAME = process.env.BROWSERSTACK_USERNAME;
const ACCESS_KEY = process.env.BROWSERSTACK_ACCESS_KEY;
const URL = process.env.SCREENSHOT_URL ?? 'http://localhost:5173';

if (!USERNAME || !ACCESS_KEY) {
  console.error('Missing BROWSERSTACK_USERNAME / BROWSERSTACK_ACCESS_KEY (see .env.example).');
  process.exit(1);
}

// Widths up to a phone's, then a tablet's, then anything wider is treated as desktop
// so the initial window height reflects a plausible device, not an arbitrary square.
// Capped at 900: Tailwind breakpoints are width-only, so height just picks a slice
// size for the scroll-and-stitch capture — anything taller risks exceeding what a
// desktop browser can actually show at BrowserStack's max shared resolution (1920x1080)
// once OS/browser chrome is subtracted.
const DEVICE_HEIGHT = { smartphone: 667, tablet: 900, desktop: 900 } as const;

function deviceHeight(width: number): number {
  if (width <= 576) return DEVICE_HEIGHT.smartphone;
  if (width <= 992) return DEVICE_HEIGHT.tablet;
  return DEVICE_HEIGHT.desktop;
}

const allWidths: { label: string; width: number; height: number }[] = [
  { label: 'xs', width: 320, height: deviceHeight(320) },
  ...Object.entries(config.breakpoints).map(([label, value]) => {
    const width = parseFloat(value) * 16;
    return { label, width: width + 32, height: deviceHeight(width) };
  }),
];

const OUTPUT_DIR = path.resolve('.screenshots');
const STEP_TIMEOUT_MS = 10000;
// Navigation goes through the BrowserStack Local tunnel and has to load the real
// page inside the iframe, which can take longer than other WebDriver commands.
const NAVIGATE_TIMEOUT_MS = 30000;
const POLL_INTERVAL_MS = 100;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms)),
  ]);
}

// Bounds a single remote WebDriver command so a hung command fails fast
// instead of stalling the whole (potentially multi-step) capture.
function step<T>(promise: Promise<T>, label: string): Promise<T> {
  return withTimeout(promise, STEP_TIMEOUT_MS, label);
}

function startLocal(identifier: string): Promise<Local> {
  const local = new Local();
  return new Promise((resolve, reject) => {
    local.start({ key: ACCESS_KEY as string, localIdentifier: identifier }, (err) =>
      err ? reject(err) : resolve(local)
    );
  });
}

function stopLocal(local: Local): Promise<void> {
  return new Promise((resolve) => local.stop(() => resolve()));
}

// Waits until the document has finished loading and all <img> elements are complete.
async function waitForResourcesToSettle(driver: WebDriver): Promise<void> {
  for (;;) {
    const ready = await step(
      driver.executeScript(
        `return document.readyState === 'complete' && Array.from(document.images).every((img) => img.complete);`
      ),
      'executeScript(settle-check)'
    );
    if (ready) return;
    await sleep(POLL_INTERVAL_MS);
  }
}

// Setting iframe.src starts navigation asynchronously, so right after appendChild the
// frame can still briefly hold about:blank — which already reports readyState
// 'complete', letting waitForResourcesToSettle pass instantly against an empty
// placeholder instead of the real page. Wait for the navigation to actually commit first.
async function waitForFrameNavigation(driver: WebDriver): Promise<void> {
  for (;;) {
    const navigated = (await step(driver.executeScript('return document.URL'), 'executeScript(frame-url-check)')) as string;
    if (navigated && navigated !== 'about:blank') return;
    await sleep(POLL_INTERVAL_MS);
  }
}

async function documentHeight(driver: WebDriver): Promise<number> {
  return (await step(
    driver.executeScript('return Math.max(document.body.scrollHeight, document.documentElement.scrollHeight)'),
    'executeScript(documentHeight)'
  )) as number;
}

// Extra room around the requested size so the outer browser window (whose chrome/
// OS-minimums vary per browser and can't be shrunk below a few hundred px) never
// has to squeeze the iframe — the iframe's CSS width/height is what actually pins
// the tested viewport, not the outer window.
const OUTER_PADDING_W = 100;
const OUTER_PADDING_H = 200;

// Blanks the already-loaded page and embeds the same URL in a fixed-size iframe.
// Runs as a single executeScript call so no intermediate render (e.g. a flash of
// the original page before it's cleared) is ever screenshotted.
const INJECT_FRAME_SCRIPT = `
  document.documentElement.style.cssText = 'margin:0;padding:0;overflow:hidden;';
  document.body.innerHTML = '';
  document.body.style.cssText = 'margin:0;padding:0;overflow:hidden;';
  const iframe = document.createElement('iframe');
  iframe.id = 'target';
  iframe.style.cssText = 'display:block;border:0;';
  iframe.width = String(arguments[1]);
  iframe.height = String(arguments[2]);
  iframe.src = arguments[0];
  document.body.appendChild(iframe);
`;

// Screenshots the current viewport, scrolls down by one viewport height, and
// repeats until the whole page is covered, then stitches the slices into one image.
//
// Renders the target page inside a fixed-size iframe instead of resizing the browser
// window directly: every engine honors an explicit CSS iframe width/height, whereas
// resizing the real window is capped by each browser's own minimum (Chromium enforces
// ~400-500px regardless of what's requested), which made the same "target width"
// render at very different actual sizes per browser. The host page is navigated to
// the real URL first and the iframe points at that same URL, so host and iframe are
// same-origin everywhere — a data: URL host was tried first but its opaque origin
// made Safari render the cross-origin iframe as a blank white screen, and made
// Firefox's Fission isolation block WebDriver's own frame/screenshot handling.
//
// Not used for Safari: safaridriver's switchTo().frame() support for a dynamically
// injected iframe is unreliable (it hung executeScript entirely) — see
// captureFullPageDirect, which Safari uses instead.
async function captureFullPageViaIframe(
  driver: WebDriver,
  url: string,
  targetWidth: number,
  targetHeight: number
): Promise<Buffer> {
  await step(
    driver.manage().window().setRect({ width: targetWidth + OUTER_PADDING_W, height: targetHeight + OUTER_PADDING_H }),
    'setRect'
  );
  await withTimeout(driver.get(url), NAVIGATE_TIMEOUT_MS, 'get');

  // Host is flush (no margin, no scroll), so the iframe always sits at (0, 0) in the
  // outer page — only the scale between CSS px and screenshot px varies
  // (devicePixelRatio on high-DPI remote VMs).
  const outerWidthCss = (await step(driver.executeScript('return window.innerWidth'), 'executeScript(outerInnerWidth)')) as number;
  const outerHeightCss = (await step(driver.executeScript('return window.innerHeight'), 'executeScript(outerInnerHeight)')) as number;
  if (outerWidthCss < targetWidth || outerHeightCss < targetHeight) {
    throw new Error(
      `Browser viewport (${outerWidthCss}x${outerHeightCss}) is smaller than the requested size ` +
        `(${targetWidth}x${targetHeight}) — increase the BrowserStack "resolution" capability.`
    );
  }

  await step(driver.executeScript(INJECT_FRAME_SCRIPT, url, targetWidth, targetHeight), 'executeScript(injectFrame)');

  // Switch by index, not by passing the iframe WebElement: geckodriver computes the
  // element's bounding rect to do that itself, which is unnecessary risk for no benefit
  // now that host and iframe share an origin — index-based switching sidesteps it.
  await step(driver.switchTo().frame(0), 'switchTo.frame');
  await waitForFrameNavigation(driver);
  await waitForResourcesToSettle(driver);

  const slices: { buffer: Buffer; top: number; height: number }[] = [];
  let capturedCss = 0;
  let capturedPx = 0;
  let pageHeightCss = await documentHeight(driver);
  let scale = 0;
  let cropWidthPx = 0;

  for (;;) {
    // Screenshot from the top-level context, not the iframe: WebDriver's "Take
    // Screenshot" is defined against the whole window regardless of which frame
    // script execution is currently switched into, so this keeps that separate.
    await step(driver.switchTo().defaultContent(), 'switchTo.defaultContent');
    const shot = Buffer.from(await step(driver.takeScreenshot(), 'takeScreenshot'), 'base64');
    await step(driver.switchTo().frame(0), 'switchTo.frame(loop)');
    if (!scale) {
      const meta = await sharp(shot).metadata();
      scale = (meta.width ?? outerWidthCss) / outerWidthCss;
      cropWidthPx = Math.round(targetWidth * scale);
    }

    const scrollY = (await step(driver.executeScript('return window.scrollY'), 'executeScript(scrollY)')) as number;
    const cropTopCss = Math.max(0, capturedCss - scrollY);
    const sliceHeightCss = Math.min(targetHeight - cropTopCss, pageHeightCss - capturedCss);
    if (sliceHeightCss <= 0) break;
    const sliceHeightPx = Math.round(sliceHeightCss * scale);

    const slice = await sharp(shot)
      .extract({ left: 0, top: Math.round(cropTopCss * scale), width: cropWidthPx, height: sliceHeightPx })
      .toBuffer();
    slices.push({ buffer: slice, top: capturedPx, height: sliceHeightPx });
    capturedCss += sliceHeightCss;
    capturedPx += sliceHeightPx;

    if (capturedCss >= pageHeightCss) break;

    await step(driver.executeScript('window.scrollTo(0, arguments[0])', capturedCss), 'executeScript(scrollTo)');
    await sleep(POLL_INTERVAL_MS);
    pageHeightCss = await documentHeight(driver);
  }

  return sharp({
    create: { width: cropWidthPx, height: capturedPx, channels: 4, background: { r: 255, g: 255, b: 255, alpha: 1 } },
  })
    .composite(slices.map((slice) => ({ input: slice.buffer, top: slice.top, left: 0 })))
    .png()
    .toBuffer();
}

// Safari path: resize the real window and navigate directly, no iframe. Per the
// original bug report Safari's window resize already lands on an accurate width
// (only Chromium clamps below the requested size), so it never needed the iframe
// workaround in the first place — and safaridriver can't reliably drive one anyway.
async function captureFullPageDirect(
  driver: WebDriver,
  url: string,
  targetWidth: number,
  targetHeight: number
): Promise<Buffer> {
  await step(driver.manage().window().setRect({ width: targetWidth, height: targetHeight }), 'setRect');
  await withTimeout(driver.get(url), NAVIGATE_TIMEOUT_MS, 'get');
  await waitForResourcesToSettle(driver);

  // setRect sizes Safari's outer window, chrome (toolbar/tab bar) included, so the
  // actual viewport lands short of what was requested. Measure the shortfall once
  // and pad the outer rect so window.inner{Width,Height} end up matching target.
  const rect = await step(driver.manage().window().getRect(), 'getRect');
  const innerWidth = (await step(driver.executeScript('return window.innerWidth'), 'executeScript(innerWidth)')) as number;
  const innerHeight = (await step(driver.executeScript('return window.innerHeight'), 'executeScript(innerHeight)')) as number;
  if (innerWidth !== targetWidth || innerHeight !== targetHeight) {
    const chromeWidth = rect.width - innerWidth;
    const chromeHeight = rect.height - innerHeight;
    await step(
      driver.manage().window().setRect({ width: targetWidth + chromeWidth, height: targetHeight + chromeHeight }),
      'setRect(chrome-adjusted)'
    );
  }

  const slices: { buffer: Buffer; top: number; height: number }[] = [];
  let captured = 0;
  let pageHeight = await documentHeight(driver);
  let shotWidth = 0;
  let shotHeight = 0;

  for (;;) {
    const shot = Buffer.from(await step(driver.takeScreenshot(), 'takeScreenshot'), 'base64');
    // Crop against the screenshot's own pixel size (not window.innerWidth/innerHeight),
    // so whatever the browser actually rendered — scrollbar included — survives the crop.
    const meta = await sharp(shot).metadata();
    shotWidth = meta.width ?? shotWidth;
    shotHeight = meta.height ?? shotHeight;

    const scrollY = (await step(driver.executeScript('return window.scrollY'), 'executeScript(scrollY)')) as number;
    const cropTop = Math.max(0, captured - scrollY);
    const sliceHeight = Math.min(shotHeight - cropTop, pageHeight - captured);
    if (sliceHeight <= 0) break;

    const slice = await sharp(shot)
      .extract({ left: 0, top: cropTop, width: shotWidth, height: sliceHeight })
      .toBuffer();
    slices.push({ buffer: slice, top: captured, height: sliceHeight });
    captured += sliceHeight;

    if (captured >= pageHeight) break;

    await step(driver.executeScript('window.scrollTo(0, arguments[0])', captured), 'executeScript(scrollTo)');
    await sleep(POLL_INTERVAL_MS);
    pageHeight = await documentHeight(driver);
  }

  return sharp({
    create: { width: shotWidth, height: captured, channels: 4, background: { r: 255, g: 255, b: 255, alpha: 1 } },
  })
    .composite(slices.map((slice) => ({ input: slice.buffer, top: slice.top, left: 0 })))
    .png()
    .toBuffer();
}

// BrowserStack allows up to 5 concurrent Automate sessions on this account's plan.
const MAX_PARALLEL = 5;

type Combo = {
  browser: (typeof config.browsers)[number];
  width: number;
  height: number;
  sessionName: string;
};

// One combo per browser for a single size, so a batch captures that size across
// every browser in parallel without touching any other size.
function buildCombosForSize(size: { label: string; width: number; height: number }): Combo[] {
  return config.browsers.map((browser) => {
    const [browserSlug, osSlug] = browser.label.split('-');
    return {
      browser,
      width: size.width,
      height: size.height,
      sessionName: `${size.label}-${size.width}w-${osSlug}-${browserSlug}`,
    };
  });
}

async function captureComboOnce(localIdentifier: string, combo: Combo): Promise<Buffer> {
  const driver = await new Builder()
    .usingServer('https://hub-cloud.browserstack.com/wd/hub')
    .withCapabilities({
      browserName: combo.browser.browserName,
      browserVersion: combo.browser.browserVersion,
      'bstack:options': {
        os: combo.browser.os,
        osVersion: combo.browser.osVersion,
        // 1920x1080 is the largest resolution BrowserStack supports on both Windows
        // and macOS — anything bigger (e.g. 2048x1536) is Windows-only and errors on
        // the Safari/macOS session. Widest/tallest target (1400x900) + OUTER_PADDING
        // still fits comfortably under this with slack for OS/browser chrome.
        resolution: '1920x1080',
        local: true,
        localIdentifier,
        userName: USERNAME,
        accessKey: ACCESS_KEY,
        sessionName: combo.sessionName,
        buildName: 'responsive-screenshots',
      },
    })
    .build();

  try {
    const capture = combo.browser.browserName.toLowerCase() === 'safari' ? captureFullPageDirect : captureFullPageViaIframe;
    return await capture(driver, URL, combo.width, combo.height);
  } finally {
    await driver.quit();
  }
}

// Real cloud-browser sessions occasionally blip (a dropped frame reference, a stalled
// command) independent of anything our code controls, so a transient failure gets one
// retry on a fresh session before being reported as a real failure.
const MAX_ATTEMPTS = 2;

async function captureCombo(localIdentifier: string, combo: Combo): Promise<Buffer | null> {
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    console.log(`Capturing ${combo.sessionName}${attempt > 1 ? ` (attempt ${attempt}/${MAX_ATTEMPTS})` : ''}...`);
    try {
      return await captureComboOnce(localIdentifier, combo);
    } catch (err) {
      const isLastAttempt = attempt === MAX_ATTEMPTS;
      console.error(`${isLastAttempt ? 'Failed' : 'Retrying'} ${combo.sessionName}:`, err);
      if (isLastAttempt) return null;
    }
  }
  return null;
}

// Worker-pool: each worker pulls the next combo off the shared queue until it's empty,
// so at most MAX_PARALLEL BrowserStack sessions run at once.
async function runPool(combos: Combo[], localIdentifier: string): Promise<(Buffer | null)[]> {
  const results: (Buffer | null)[] = new Array(combos.length).fill(null);
  let next = 0;
  async function worker() {
    while (next < combos.length) {
      const index = next++;
      results[index] = await captureCombo(localIdentifier, combos[index]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(MAX_PARALLEL, combos.length) }, worker));
  return results;
}

// Lays browser tiles side by side into one canvas, padding shorter tiles
// with white so uneven page heights across browsers don't misalign.
async function stitchHorizontally(tiles: Buffer[]): Promise<Buffer> {
  const metas = await Promise.all(tiles.map((tile) => sharp(tile).metadata()));
  const totalWidth = metas.reduce((sum, meta) => sum + (meta.width ?? 0), 0);
  const maxHeight = Math.max(...metas.map((meta) => meta.height ?? 0));

  let left = 0;
  const composites = tiles.map((tile, i) => {
    const input = { input: tile, top: 0, left };
    left += metas[i].width ?? 0;
    return input;
  });

  return sharp({
    create: { width: totalWidth, height: maxHeight, channels: 4, background: { r: 255, g: 255, b: 255, alpha: 1 } },
  })
    .composite(composites)
    .png()
    .toBuffer();
}

async function run() {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const localIdentifier = `local-${Date.now()}`;
  const local = await startLocal(localIdentifier);

  try {
    for (const [order, size] of allWidths.entries()) {
      const combos = buildCombosForSize(size);
      const pngs = await runPool(combos, localIdentifier);
      const tiles = pngs.filter((png): png is Buffer => png !== null);
      if (tiles.length === 0) continue;

      const stitched = await stitchHorizontally(tiles);
      const fileName = `${order + 1}-${size.label}-${size.width}w.png`;
      fs.writeFileSync(path.join(OUTPUT_DIR, fileName), stitched);
      console.log(`Wrote ${fileName}`);
    }
  } finally {
    await stopLocal(local);
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
