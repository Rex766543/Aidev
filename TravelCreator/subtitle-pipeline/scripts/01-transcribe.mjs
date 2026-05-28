#!/usr/bin/env node
/**
 * Step 1: Transcribe audio using OpenAI Whisper API (word-level timestamps).
 *
 * Usage:
 *   node scripts/01-transcribe.mjs <audio-file> [--out <output.json>] [--language ja]
 *
 * Output JSON:
 *   { words: [{word, start, end}], text, language, duration }
 *
 * Requires: OPENAI_API_KEY in .env.local or environment.
 * Note: Multiple mp3 files should be concatenated with FFmpeg before running:
 *   ffmpeg -i "concat:take1.mp3|take2.mp3" -acodec copy combined.mp3
 */

import { mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { loadEnv } from './lib/env.mjs';

const SUPPORTED = new Set(['.mp3', '.mp4', '.m4a', '.wav', '.webm', '.mpeg', '.mpga']);

async function main() {
  const argv = process.argv.slice(2);
  let inputPath, outputPath, language;

  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--out') outputPath = argv[++i];
    else if (argv[i] === '--language') language = argv[++i];
    else if (!inputPath) inputPath = argv[i];
  }

  if (!inputPath) {
    console.error(
      'Usage: node scripts/01-transcribe.mjs <audio-file> [--out <output.json>] [--language ja]',
    );
    process.exit(1);
  }

  inputPath = path.resolve(process.cwd(), inputPath);
  const ext = path.extname(inputPath).toLowerCase();
  if (!SUPPORTED.has(ext)) {
    throw new Error(`Unsupported file type: ${ext}. Supported: ${[...SUPPORTED].join(', ')}`);
  }
  await stat(inputPath);

  await loadEnv();
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OPENAI_API_KEY not set. Add it to .env.local or export it.');

  if (!outputPath) {
    const base = path.basename(inputPath, path.extname(inputPath));
    const workDir = path.join(path.dirname(inputPath), `${base}-work`);
    await mkdir(workDir, { recursive: true });
    outputPath = path.join(workDir, 'words.json');
  } else {
    await mkdir(path.dirname(path.resolve(outputPath)), { recursive: true });
  }

  console.error(`Transcribing ${path.basename(inputPath)} with whisper-1 (word-level)...`);

  const formData = new FormData();
  const buffer = await readFile(inputPath);
  formData.append(
    'file',
    new File([buffer], path.basename(inputPath), { type: 'application/octet-stream' }),
  );
  formData.append('model', 'whisper-1');
  formData.append('response_format', 'verbose_json');
  formData.append('timestamp_granularities[]', 'word');
  if (language) formData.append('language', language);

  const resp = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}` },
    body: formData,
  });

  if (!resp.ok) {
    throw new Error(`OpenAI API error (${resp.status}): ${await resp.text()}`);
  }

  const data = await resp.json();

  // whisper-1 verbose_json with word granularity returns data.words
  const words = (data.words ?? []).map((w) => ({
    word: w.word,
    start: Number(w.start.toFixed(3)),
    end: Number(w.end.toFixed(3)),
  }));

  if (words.length === 0) {
    console.error(
      'Warning: no word-level timestamps returned. The audio may be too short or silent.',
    );
  }

  const output = {
    words,
    text: (data.text ?? '').trim(),
    language: data.language ?? language ?? 'ja',
    duration: data.duration ?? null,
  };

  await writeFile(outputPath, JSON.stringify(output, null, 2), 'utf8');
  console.error(`Saved ${words.length} words → ${outputPath}`);
  console.log(outputPath);
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : String(e));
  process.exit(1);
});
