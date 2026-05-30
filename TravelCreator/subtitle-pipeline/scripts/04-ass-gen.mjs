#!/usr/bin/env node
/**
 * Step 4: Generate an ASS subtitle file from subtitle chunks.
 *
 * Usage:
 *   node scripts/04-ass-gen.mjs <subtitles.json> [--out <subtitle.ass>]
 *   node scripts/04-ass-gen.mjs <subtitles.json> [--font "Noto Sans JP"] [--font-size 72]
 *
 * Output: subtitle.ass — open in Aegisub for timing tweaks, then burn with FFmpeg:
 *   ffmpeg -i input.mp4 -vf "ass=work/subtitle.ass" -c:a copy output.mp4
 *
 * Canvas: 1920×1080 (landscape / long-form YouTube)
 * Default font: Hiragino Maru Gothic ProN (macOS-bundled; enable via Font Book if missing).
 *   The font name is referenced as a string in the ASS Style line; the renderer
 *   (Aegisub / libass via FFmpeg) must locate it on the system at render time.
 *   Cross-platform fallback: "Hiragino Sans", "Noto Sans CJK JP".
 */

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const CANVAS_W = 1920;
const CANVAS_H = 1080;
const DEFAULT_FONT = 'Hiragino Maru Gothic ProN';
const DEFAULT_FONT_SIZE = 80;

// ASS color format: &HAABBGGRR (alpha, blue, green, red in hex)
const COLOR_WHITE = '&H00FFFFFF';
const COLOR_BLACK = '&H00000000';
const COLOR_SHADOW = '&H80000000'; // 50% transparent black

function secToAss(sec) {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  const cs = Math.round((sec % 1) * 100);
  return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(cs).padStart(2, '0')}`;
}

function buildAssHeader(font, fontSize) {
  return `[Script Info]
ScriptType: v4.00+
PlayResX: ${CANVAS_W}
PlayResY: ${CANVAS_H}
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,${font},${fontSize},${COLOR_WHITE},${COLOR_BLACK},${COLOR_WHITE},${COLOR_SHADOW},-1,0,0,0,100,100,0,0,1,2,2,2,60,60,40,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text`;
}

// MarginV=40 → 40px from bottom of 1080px canvas
// Alignment=2 → bottom-center (standard subtitle position)
// Outline=2 (white, thin) + Shadow=2 → soft look, readable on any background
// Bold=-1 (true)

async function main() {
  const argv = process.argv.slice(2);
  let inputPath, outputPath;
  let font = DEFAULT_FONT;
  let fontSize = DEFAULT_FONT_SIZE;

  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--out') outputPath = argv[++i];
    else if (argv[i] === '--font') font = argv[++i];
    else if (argv[i] === '--font-size') fontSize = Number(argv[++i]);
    else if (!inputPath) inputPath = argv[i];
  }

  if (!inputPath) {
    console.error(
      'Usage: node scripts/04-ass-gen.mjs <subtitles.json> [--out subtitle.ass] [--font "Noto Sans JP"] [--font-size 72]',
    );
    process.exit(1);
  }

  inputPath = path.resolve(process.cwd(), inputPath);
  const workDir = path.dirname(inputPath);
  outputPath = outputPath
    ? path.resolve(process.cwd(), outputPath)
    : path.join(workDir, 'subtitle.ass');

  await mkdir(path.dirname(outputPath), { recursive: true });

  const chunks = JSON.parse(await readFile(inputPath, 'utf8'));

  if (!Array.isArray(chunks) || chunks.length === 0) {
    console.error('Warning: no subtitle chunks found. Writing empty ASS file.');
    await writeFile(outputPath, buildAssHeader(font, fontSize) + '\n', 'utf8');
    console.log(outputPath);
    return;
  }

  const lines = [buildAssHeader(font, fontSize)];

  for (const chunk of chunks) {
    const start = secToAss(chunk.start ?? 0);
    const end = secToAss(chunk.end ?? (chunk.start ?? 0) + 2);
    // Join multiple lines with \N (hard line break in ASS)
    const text = (chunk.lines ?? []).join('\\N');
    lines.push(`Dialogue: 0,${start},${end},Default,,0,0,0,,${text}`);
  }

  const ass = lines.join('\n') + '\n';
  await writeFile(outputPath, ass, 'utf8');

  console.error(`Generated ${chunks.length} subtitle events → ${outputPath}`);
  console.error('');
  console.error('Next steps:');
  console.error('  1. Open in Aegisub to adjust timing: aegisub ' + outputPath);
  console.error('  2. Burn into video with FFmpeg:');
  console.error(`     ffmpeg -i input.mp4 -vf "ass=${outputPath}" -c:a copy output.mp4`);
  console.log(outputPath);
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : String(e));
  process.exit(1);
});
