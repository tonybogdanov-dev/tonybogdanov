import 'dotenv/config';
import fs, { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { writeFile } from 'node:fs/promises';
import path, { extname } from 'node:path';
import { chromium } from 'playwright';
import { createServer, type ViteDevServer } from 'vite';
import sharp from 'sharp';
import { optimize } from 'svgo';
import jsBeautify from 'js-beautify';

const { html: beautifyHtml } = jsBeautify;

const HOST = 'localhost';
const PORT = 5173;
const SVG_MAX_LINE_LENGTH = 120;

let server: ViteDevServer | undefined;

// On this project's dev WSL distro (Alpine/musl), Playwright's own downloaded Chromium build won't
// run (glibc-only), so PLAYWRIGHT_CHROMIUM_PATH lets it fall back to the system-installed `chromium`
// package instead. Unset in environments where Playwright's bundled browser works fine (e.g. Docker).
const CHROMIUM_LAUNCH_OPTIONS = process.env.PLAYWRIGHT_CHROMIUM_PATH ?
  { executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH, args: ['--no-sandbox'] }
: {};

export async function convertSVGToPNG(pathToSVG: string, pathToPNG: string): Promise<void> {
  console.log(`Converting (SVG -> PNG): ${pathToSVG} -> ${pathToPNG}.`);

  const png = await sharp(pathToSVG).png().toBuffer();
  await writeFile(pathToPNG, png);
}

function findSvgFiles(dirPath: string): string[] {
  const found: string[] = [];

  for (const entry of readdirSync(dirPath, { withFileTypes: true })) {
    const entryPath = path.join(dirPath, entry.name);

    if (entry.isDirectory()) {
      found.push(...findSvgFiles(entryPath));
    } else if (entry.isFile() && extname(entry.name).toLowerCase() === '.svg') {
      found.push(entryPath);
    }
  }

  return found;
}

function wrapLongAttributeValues(text: string, maxLen: number): string {
  const attrLinePattern = /^(\s*)([\w:.-]+)="([^"]*)"(\s*\/?>)?\s*$/;

  return text
    .split('\n')
    .flatMap((line) => {
      if (line.length <= maxLen) {
        return [line];
      }

      const match = line.match(attrLinePattern);
      if (!match) {
        return [line];
      }

      const [, indent, name, value, trailing = ''] = match;
      const tokens = value.split(/\s+/).filter(Boolean);
      if (tokens.length < 2) {
        return [line];
      }

      const continuationIndent = `${indent}  `;
      const wrapped: string[] = [];
      let current = `${indent}${name}="`;
      let isFirst = true;

      for (const token of tokens) {
        const candidate = isFirst ? current + token : `${current} ${token}`;
        if (!isFirst && candidate.length > maxLen) {
          wrapped.push(current);
          current = `${continuationIndent}${token}`;
        } else {
          current = candidate;
        }
        isFirst = false;
      }

      wrapped.push(`${current}"${trailing}`);
      return wrapped;
    })
    .join('\n');
}

function optimizeSVGFile(filePath: string): void {
  const source = readFileSync(filePath, 'utf8');

  const { data: minified } = optimize(source, {
    path: filePath,
    multipass: true,
    plugins: ['preset-default', 'prefixIds'],
  });

  const beautified = beautifyHtml(minified, {
    indent_size: 2,
    indent_char: ' ',
    wrap_line_length: SVG_MAX_LINE_LENGTH,
    preserve_newlines: false,
    unformatted: [],
    content_unformatted: [],
    extra_liners: [],
    end_with_newline: true,
  });

  const wrapped = wrapLongAttributeValues(beautified, SVG_MAX_LINE_LENGTH);

  writeFileSync(filePath, wrapped, 'utf8');
}

export async function optimizeSVGs(pathToFileOrFolder: string): Promise<void> {
  console.log(`Optimizing SVGs: ${pathToFileOrFolder}.`);

  const targetPath = path.resolve(process.cwd(), pathToFileOrFolder);
  const targetStat = statSync(targetPath);

  if (targetStat.isDirectory()) {
    const svgFiles = findSvgFiles(targetPath);

    for (const filePath of svgFiles) {
      optimizeSVGFile(filePath);
    }
  } else {
    optimizeSVGFile(targetPath);
  }
}

function toPascalCase(value: string): string {
  return value
    .split(/[^a-zA-Z0-9]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
}

export async function generateIconDefinitions(pathToFolder: string): Promise<void> {
  console.log(`Generating icon definitions: ${pathToFolder}.`);

  const targetPath = path.resolve(process.cwd(), pathToFolder);
  const svgFiles = findSvgFiles(targetPath);

  const definitions = svgFiles.map((filePath) => {
    const iconName = path.basename(filePath, '.svg');
    const source = readFileSync(filePath, 'utf8');

    const viewBoxMatch = source.match(/viewBox="([^"]+)"/);
    const [, , width, height] = (viewBoxMatch?.[1] ?? '0 0 0 0').split(/\s+/).map(Number);

    const svgPath = Array.from(source.matchAll(/<path[^>]*\sd="([^"]+)"/g))
      .map((match) => match[1].replace(/\s+/g, ' ').trim())
      .join(' ');

    return { variableName: `fa${toPascalCase(iconName)}`, iconName, width, height, svgPath };
  });

  const output = [
    "import type { IconDefinition, IconName, IconPrefix } from '@fortawesome/fontawesome-common-types';",
    '',
    ...definitions.map(
      ({ variableName, iconName, width, height, svgPath }) =>
        `export const ${variableName}: IconDefinition = {\n  prefix: 'fak' as IconPrefix,\n  iconName: '${iconName}' as IconName,\n  icon: [${width}, ${height}, [], '', '${svgPath}'],\n};`,
    ),
  ].join('\n\n');

  writeFileSync(path.resolve(process.cwd(), 'src/icons.tsx'), `${output}\n`, 'utf8');
}

function buildIco(images: { size: number; png: Buffer }[]): Buffer {
  const HEADER_SIZE = 6;
  const ENTRY_SIZE = 16;
  const dataOffset = HEADER_SIZE + ENTRY_SIZE * images.length;

  const header = Buffer.alloc(HEADER_SIZE);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(images.length, 4);

  let offset = dataOffset;
  const entries: Buffer[] = [];
  for (const { size, png } of images) {
    const entry = Buffer.alloc(ENTRY_SIZE);
    entry.writeUInt8(size >= 256 ? 0 : size, 0);
    entry.writeUInt8(size >= 256 ? 0 : size, 1);
    entry.writeUInt8(0, 2);
    entry.writeUInt8(0, 3);
    entry.writeUInt16LE(1, 4);
    entry.writeUInt16LE(32, 6);
    entry.writeUInt32LE(png.length, 8);
    entry.writeUInt32LE(offset, 12);
    entries.push(entry);
    offset += png.length;
  }

  return Buffer.concat([header, ...entries, ...images.map((image) => image.png)]);
}

export async function generateFavicons(pathToSVG: string, outputDir: string): Promise<void> {
  console.log(`Generating favicons: ${outputDir}.`);

  const sizes = [16, 32];
  const icoImages: { size: number; png: Buffer }[] = [];

  for (const size of sizes) {
    const target = path.join(outputDir, `favicon-${size}x${size}.png`);
    const png = await sharp(pathToSVG, { density: 384 }).resize(size, size).png().toBuffer();
    await writeFile(target, png);
    icoImages.push({ size, png });
  }

  await writeFile(path.join(outputDir, 'favicon.ico'), buildIco(icoImages));
}

async function isServerRunning(): Promise<boolean> {
  try {
    await fetch(`http://${HOST}:${PORT}/`);
    return true;
  } catch {
    return false;
  }
}

export async function generateOGImage(pathToPNG: string): Promise<void> {
  console.log(`Generating OG image: ${pathToPNG}.`);

  const source = `http://${HOST}:${PORT}/og`;
  const width = 1200;
  const height = 630;

  fs.mkdirSync(path.dirname(pathToPNG), { recursive: true });

  const browser = await chromium.launch(CHROMIUM_LAUNCH_OPTIONS);
  const page = await browser.newPage({ viewport: { width, height } });
  await page.goto(source, { waitUntil: 'networkidle' });

  await page.screenshot({ path: pathToPNG });
  await browser.close();
}

export async function generateCV(pathToPDF: string): Promise<void> {
  console.log(`Generating CV: ${pathToPDF}.`);

  const source = `http://${HOST}:${PORT}/cv`;

  fs.mkdirSync(path.dirname(pathToPDF), { recursive: true });

  const browser = await chromium.launch(CHROMIUM_LAUNCH_OPTIONS);
  const page = await browser.newPage();
  await page.goto(source, { waitUntil: 'networkidle' });

  await page.pdf({
    path: pathToPDF,
    format: 'A4',
    printBackground: true,
  });
  await browser.close();
}

if (await isServerRunning()) {
  console.log(`Reusing dev server already running at http://${HOST}:${PORT}`);
} else {
  server = await createServer({ server: { host: HOST, port: PORT, strictPort: true } });
  await server.listen();
}

try {
  await optimizeSVGs('src/assets');
  await generateIconDefinitions('src/assets/icons');
  await generateFavicons('src/assets/favicon.svg', 'public');
  await convertSVGToPNG('assets/linkedin-cover.svg', 'assets/linkedin-cover.png');
  await generateOGImage('public/og-image.png');
  await generateCV('public/tony-bogdanov-cv.pdf');
} finally {
  if (server) {
    await server.close();
    console.log('-- DONE --');
  }
}
