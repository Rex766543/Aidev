#!/usr/bin/env node
/**
 * Step 3: Split words into subtitle chunks (2 lines max, character-count based).
 *
 * Usage:
 *   node scripts/03-layout.mjs <final-words.json> [--out <subtitles.json>]
 *   node scripts/03-layout.mjs <final-words.json> [--max-chars 13] [--max-lines 2]
 *
 * Output: [{start, end, lines: ["line1", "line2?"]}]
 *
 * Character width rules (CJK-friendly):
 *   Full-width CJK/kana characters count as 1.0
 *   Half-width ASCII count as 0.5
 * Default max chars per line: 22 (≈ 1760px at 80pt Noto Sans JP on 1920px wide canvas)
 */

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const DEFAULT_MAX_CHARS = 22;
const DEFAULT_MAX_LINES = 2;

function charWidth(str) {
  let w = 0;
  for (const ch of str) {
    const cp = ch.codePointAt(0);
    // Hiragana, Katakana, CJK Unified, CJK Extension, CJK Compatibility,
    // Fullwidth Latin, Halfwidth Katakana, Kangxi, etc.
    if (
      (cp >= 0x3000 && cp <= 0x9fff) || // CJK + punctuation + kana
      (cp >= 0xac00 && cp <= 0xd7ff) || // Hangul
      (cp >= 0xf900 && cp <= 0xfaff) || // CJK Compatibility Ideographs
      (cp >= 0xff01 && cp <= 0xff60) || // Fullwidth forms
      (cp >= 0x1b000 && cp <= 0x1b0ff) || // Kana Supplement
      (cp >= 0x20000 && cp <= 0x2ceaf) // CJK Extension B-F
    ) {
      w += 1.0;
    } else {
      w += 0.5;
    }
  }

  return w;
}

function splitIntoChunks(words, maxCharsPerLine, maxLines) {
  const chunks = [];
  let currentLines = [];
  let currentLine = '';
  let chunkStart = null;
  let chunkEnd = null;

  const flushChunk = () => {
    if (currentLine) currentLines.push(currentLine);
    if (currentLines.length > 0) {
      chunks.push({ start: chunkStart, end: chunkEnd, lines: currentLines });
    }
    currentLines = [];
    currentLine = '';
    chunkStart = null;
    chunkEnd = null;
  };

  for (const word of words) {
    const w = word.word;
    const candidate = currentLine + w;

    if (chunkStart === null) chunkStart = word.start;

    if (charWidth(candidate) <= maxCharsPerLine) {
      // Fits on current line
      currentLine = candidate;
      chunkEnd = word.end;
    } else if (currentLines.length < maxLines - 1) {
      // Doesn't fit, but can start a new line in this chunk
      currentLines.push(currentLine);
      currentLine = w;
      chunkEnd = word.end;
    } else {
      // Chunk is full — flush and start a new one
      flushChunk();
      chunkStart = word.start;
      currentLine = w;
      chunkEnd = word.end;
    }
  }

  flushChunk();
  return chunks;
}

async function main() {
  const argv = process.argv.slice(2);
  let inputPath, outputPath;
  let maxChars = DEFAULT_MAX_CHARS;
  let maxLines = DEFAULT_MAX_LINES;

  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--out') outputPath = argv[++i];
    else if (argv[i] === '--max-chars') maxChars = Number(argv[++i]);
    else if (argv[i] === '--max-lines') maxLines = Number(argv[++i]);
    else if (!inputPath) inputPath = argv[i];
  }

  if (!inputPath) {
    console.error(
      'Usage: node scripts/03-layout.mjs <words.json> [--out subtitles.json] [--max-chars 13] [--max-lines 2]',
    );
    process.exit(1);
  }

  inputPath = path.resolve(process.cwd(), inputPath);
  const workDir = path.dirname(inputPath);
  outputPath = outputPath
    ? path.resolve(process.cwd(), outputPath)
    : path.join(workDir, 'subtitles.json');

  await mkdir(path.dirname(outputPath), { recursive: true });

  const input = JSON.parse(await readFile(inputPath, 'utf8'));
  const words = input.words ?? [];

  if (words.length === 0) {
    console.error('Warning: no words in input. Writing empty subtitle list.');
    await writeFile(outputPath, JSON.stringify([], null, 2), 'utf8');
    console.log(outputPath);
    return;
  }

  const chunks = splitIntoChunks(words, maxChars, maxLines);

  console.error(
    `Laid out ${words.length} words → ${chunks.length} subtitle chunks (max ${maxChars} chars/line, ${maxLines} lines).`,
  );

  await writeFile(outputPath, JSON.stringify(chunks, null, 2), 'utf8');
  console.log(outputPath);
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : String(e));
  process.exit(1);
});
