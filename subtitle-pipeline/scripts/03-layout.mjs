#!/usr/bin/env node
/**
 * Step 3: Split words into subtitle chunks (2 lines max, phrase-boundary aware).
 *
 * Usage:
 *   node scripts/03-layout.mjs <final-words.json> [--out <subtitles.json>]
 *
 * Output: [{start, end, lines: ["line1", "line2?"]}]
 *
 * Layout spec:
 *   Target line length:    19–21 chars (split here when phrase boundary found)
 *   Split threshold:       23 chars    (force split regardless)
 *   Max lines per chunk:   2
 *   Block max:             46 chars total (= 2 lines × 23 — new chunk when exceeded)
 *   Phrase boundaries preferred; width fallback if none found
 *
 * Character width:
 *   CJK / kana = 1.0, half-width ASCII = 0.5
 */

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

// Spec constants
const TARGET_CHARS = 19;    // start looking for phrase boundary from here
const THRESHOLD_CHARS = 23; // force split at this width
const MAX_LINES = 2;

// Japanese particles and punctuation that mark natural phrase ends
const PHRASE_BOUNDARY_CHARS = new Set([
  'は', 'が', 'を', 'に', 'で', 'と', 'も', 'の', 'へ', 'か',
  'し', 'て', 'ね', 'よ', 'な', 'さ', 'わ',
  '、', '。', '！', '？', '…', '―',
]);

function charWidth(str) {
  let w = 0;
  for (const ch of str) {
    const cp = ch.codePointAt(0);
    if (
      (cp >= 0x3000 && cp <= 0x9fff) ||  // CJK + punctuation + kana
      (cp >= 0xac00 && cp <= 0xd7ff) ||  // Hangul
      (cp >= 0xf900 && cp <= 0xfaff) ||  // CJK Compatibility
      (cp >= 0xff01 && cp <= 0xff60) ||  // Fullwidth forms
      (cp >= 0x1b000 && cp <= 0x1b0ff) || // Kana Supplement
      (cp >= 0x20000 && cp <= 0x2ceaf)   // CJK Extension B-F
    ) {
      w += 1.0;
    } else {
      w += 0.5;
    }
  }
  return w;
}

function endsAtPhraseBoundary(text) {
  if (!text) return false;
  return PHRASE_BOUNDARY_CHARS.has(text[text.length - 1]);
}

function splitIntoChunks(words) {
  const chunks = [];
  let lines = [];
  let currentLine = '';
  let chunkStart = null;
  let chunkEnd = null;

  const pushCurrentLine = () => {
    if (currentLine !== '') {
      lines.push(currentLine);
      currentLine = '';
    }
  };

  const flushChunk = () => {
    pushCurrentLine();
    if (lines.length > 0) {
      chunks.push({ start: chunkStart, end: chunkEnd, lines });
    }
    lines = [];
    currentLine = '';
    chunkStart = null;
    chunkEnd = null;
  };

  for (const word of words) {
    const w = word.word;
    if (!w) continue;

    const candidate = currentLine + w;
    const width = charWidth(candidate);

    if (chunkStart === null) chunkStart = word.start;

    if (width <= THRESHOLD_CHARS) {
      // Word fits within the hard threshold
      currentLine = candidate;
      chunkEnd = word.end;

      // Early split: at phrase boundary when we've reached the target range
      // Only applies when there is still room for another line in this chunk
      if (width >= TARGET_CHARS && endsAtPhraseBoundary(currentLine) && lines.length < MAX_LINES - 1) {
        pushCurrentLine();
      }
    } else {
      // Word would exceed threshold — must split
      if (currentLine === '') {
        // Single word longer than threshold: accept it (no alternative)
        currentLine = w;
        chunkEnd = word.end;
      } else if (lines.length < MAX_LINES - 1) {
        // Room for one more line in this chunk
        pushCurrentLine();
        currentLine = w;
        chunkEnd = word.end;
      } else {
        // Lines full — flush chunk, start fresh
        flushChunk();
        chunkStart = word.start;
        currentLine = w;
        chunkEnd = word.end;
      }
    }
  }

  flushChunk();
  return chunks;
}

async function main() {
  const argv = process.argv.slice(2);
  let inputPath, outputPath;

  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--out') outputPath = argv[++i];
    else if (!inputPath) inputPath = argv[i];
  }

  if (!inputPath) {
    console.error('Usage: node scripts/03-layout.mjs <words.json> [--out subtitles.json]');
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

  const chunks = splitIntoChunks(words);

  console.error(
    `Laid out ${words.length} words → ${chunks.length} subtitle chunks (target ${TARGET_CHARS}–${THRESHOLD_CHARS} chars/line, max ${MAX_LINES} lines).`,
  );

  await writeFile(outputPath, JSON.stringify(chunks, null, 2), 'utf8');
  console.log(outputPath);
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : String(e));
  process.exit(1);
});
