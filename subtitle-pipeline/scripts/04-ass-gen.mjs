#!/usr/bin/env node
/**
 * Step 4: Generate an ASS subtitle file from subtitle chunks.
 *
 * Usage:
 *   node scripts/04-ass-gen.mjs <subtitles.json> [--out <subtitle.ass>]
 *   node scripts/04-ass-gen.mjs <subtitles.json> [--font "Noto Sans JP"] [--font-size 42]
 *
 * Output: subtitle.ass — open in Aegisub for timing tweaks, then burn with FFmpeg:
 *   ffmpeg -i input.mp4 -vf "ass=work/subtitle.ass" -c:a copy output.mp4
 *
 * Canvas: 1080×1920 (portrait / Shorts / TikTok)
 *
 * Style spec:
 *   Font: Noto Sans JP, 42px, Bold
 *   Text: White, Outline: Black 2px, Shadow: none
 *   Bottom margin: 1-line=10% (192px), 2-line=13% (250px)
 *   Safe margin L/R: 8% (86px)
 *   Fade in/out: 100ms
 */

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const CANVAS_W = 1080;
const CANVAS_H = 1920;
const DEFAULT_FONT = 'Noto Sans JP';
const DEFAULT_FONT_SIZE = 42;

// ASS color format: &HAABBGGRR
const COLOR_WHITE = '&H00FFFFFF';
const COLOR_BLACK = '&H00000000';
const COLOR_TRANSPARENT = '&H00000000';

// Margins derived from spec percentages
const MARGIN_H = Math.round(CANVAS_W * 0.08);       // 86px (8% of 1080)
const MARGIN_V_1LINE = Math.round(CANVAS_H * 0.10); // 192px (10% of 1920)
const MARGIN_V_2LINE = Math.round(CANVAS_H * 0.13); // 250px (13% of 1920)

function secToAss(sec) {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  const cs = Math.round((sec % 1) * 100);
  return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(cs).padStart(2, '0')}`;
}

function buildAssHeader(font, fontSize) {
  // Style field order:
  // Name, Fontname, Fontsize,
  // PrimaryColour, SecondaryColour, OutlineColour, BackColour,
  // Bold, Italic, Underline, StrikeOut,
  // ScaleX, ScaleY, Spacing, Angle,
  // BorderStyle, Outline, Shadow,
  // Alignment, MarginL, MarginR, MarginV, Encoding
  //
  // Alignment=2: bottom-center
  // BorderStyle=1: outline (not box)
  // Outline=2: 2px black outline
  // Shadow=0: no shadow
  // MarginV here is the 1-line default; 2-line dialogues override it per-event
  return `[Script Info]
ScriptType: v4.00+
PlayResX: ${CANVAS_W}
PlayResY: ${CANVAS_H}
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,${font},${fontSize},${COLOR_WHITE},${COLOR_BLACK},${COLOR_BLACK},${COLOR_TRANSPARENT},-1,0,0,0,100,100,0,0,1,2,0,2,${MARGIN_H},${MARGIN_H},${MARGIN_V_1LINE},1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text`;
}

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
      'Usage: node scripts/04-ass-gen.mjs <subtitles.json> [--out subtitle.ass] [--font "Noto Sans JP"] [--font-size 42]',
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

  const eventLines = [buildAssHeader(font, fontSize)];

  for (const chunk of chunks) {
    const start = secToAss(chunk.start ?? 0);
    const end = secToAss(chunk.end ?? (chunk.start ?? 0) + 2);

    const chunkLines = chunk.lines ?? [];
    const lineCount = chunkLines.length;

    // \N is a hard line break in ASS
    const text = chunkLines.join('\\N');

    // \fad(fadeInMs, fadeOutMs) — applied to every event
    const fade = '{\\fad(100,100)}';

    // MarginV in Dialogue line: 0 = inherit style default (1-line: 192px)
    // Non-zero overrides for 2-line: 250px
    const marginV = lineCount >= 2 ? MARGIN_V_2LINE : 0;

    eventLines.push(`Dialogue: 0,${start},${end},Default,,0,0,${marginV},,${fade}${text}`);
  }

  const ass = eventLines.join('\n') + '\n';
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
