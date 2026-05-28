#!/usr/bin/env node
/**
 * Step 2: Auto-correct transcription using Claude API.
 *
 * Usage:
 *   node scripts/02-correct.mjs <words.json> [--out <corrected-words.json>] [--review <review.json>]
 *
 * Reads:  { words: [{word, start, end}], ... }
 * Writes:
 *   corrected-words.json — words with high-confidence corrections applied
 *   review.json          — low-confidence items for human review (approved: null)
 *
 * After running, check review.json and set "approved": true or false for each item,
 * then run 02-apply-review.mjs to produce final-words.json.
 * If review.json is empty (no uncertain items), final-words.json = corrected-words.json.
 *
 * Requires: ANTHROPIC_API_KEY in .env.local or environment.
 */

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { loadEnv } from './lib/env.mjs';

const CLAUDE_MODEL = 'claude-haiku-4-5-20251001';
const MAX_TOKENS = 4096;

async function callClaude(apiKey, prompt) {
  const resp = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: CLAUDE_MODEL,
      max_tokens: MAX_TOKENS,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!resp.ok) {
    throw new Error(`Claude API error (${resp.status}): ${await resp.text()}`);
  }

  const data = await resp.json();
  return data.content[0].text;
}

function extractJson(text) {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error('No JSON object found in Claude response');
  return JSON.parse(match[0]);
}

function getContext(words, idx, window = 3) {
  const start = Math.max(0, idx - window);
  const end = Math.min(words.length - 1, idx + window);
  return words
    .slice(start, end + 1)
    .map((w, i) => (start + i === idx ? `[${w.word}]` : w.word))
    .join(' ');
}

async function main() {
  const argv = process.argv.slice(2);
  let wordsPath, correctedPath, reviewPath;

  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--out') correctedPath = argv[++i];
    else if (argv[i] === '--review') reviewPath = argv[++i];
    else if (!wordsPath) wordsPath = argv[i];
  }

  if (!wordsPath) {
    console.error(
      'Usage: node scripts/02-correct.mjs <words.json> [--out corrected-words.json] [--review review.json]',
    );
    process.exit(1);
  }

  wordsPath = path.resolve(process.cwd(), wordsPath);
  const workDir = path.dirname(wordsPath);

  correctedPath = correctedPath
    ? path.resolve(process.cwd(), correctedPath)
    : path.join(workDir, 'corrected-words.json');

  reviewPath = reviewPath
    ? path.resolve(process.cwd(), reviewPath)
    : path.join(workDir, 'review.json');

  await mkdir(workDir, { recursive: true });

  await loadEnv();
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY not set. Add it to .env.local or export it.');

  const input = JSON.parse(await readFile(wordsPath, 'utf8'));
  const words = input.words ?? [];

  if (words.length === 0) {
    console.error('No words found in input. Skipping correction.');
    await writeFile(correctedPath, JSON.stringify(input, null, 2), 'utf8');
    await writeFile(reviewPath, JSON.stringify([], null, 2), 'utf8');
    console.log(`corrected: ${correctedPath}`);
    console.log(`review: ${reviewPath}`);
    return;
  }

  // Build compact word list for Claude (index: "word")
  const wordList = words.map((w, i) => `${i}: "${w.word}"`).join('\n');

  const prompt = `You are a transcription editor for Japanese audio.
Review the following word-indexed transcription and identify:
1. Filler words/sounds to DELETE (high confidence): えーと, えー, あのー, あの, そのー, まあ, うん, ん, ねー, ねえ, etc.
2. Obvious recognition errors to REPLACE (high confidence): clear misheard words, wrong kanji
3. UNCERTAIN cases (low confidence): possibly intentional speech, dialect, or ambiguous fillers

Return ONLY a JSON object. Do not include any explanation or markdown.
Only list words that need changes. Words not listed are kept as-is.

Format:
{
  "corrections": [
    {"idx": 0, "action": "delete", "confidence": "high", "reason": "filler"},
    {"idx": 5, "action": "replace", "replacement": "正しい語", "confidence": "high", "reason": "misrecognition"},
    {"idx": 9, "action": "delete", "confidence": "low", "reason": "possibly intentional pause filler"}
  ]
}

Words:
${wordList}`;

  console.error(`Sending ${words.length} words to Claude for correction...`);
  const rawResponse = await callClaude(apiKey, prompt);

  let corrections;
  try {
    ({ corrections } = extractJson(rawResponse));
  } catch (e) {
    console.error('Failed to parse Claude response as JSON:');
    console.error(rawResponse);
    throw e;
  }

  corrections = Array.isArray(corrections) ? corrections : [];

  // Separate high vs low confidence
  const highConf = corrections.filter((c) => c.confidence === 'high');
  const lowConf = corrections.filter((c) => c.confidence !== 'high');

  // Apply high-confidence corrections to words array
  const correctedWords = [];
  const deleteSet = new Set(highConf.filter((c) => c.action === 'delete').map((c) => c.idx));
  const replaceMap = new Map(
    highConf
      .filter((c) => c.action === 'replace' && c.replacement)
      .map((c) => [c.idx, c.replacement]),
  );

  for (let i = 0; i < words.length; i++) {
    if (deleteSet.has(i)) continue;
    if (replaceMap.has(i)) {
      correctedWords.push({ ...words[i], word: replaceMap.get(i) });
    } else {
      correctedWords.push(words[i]);
    }
  }

  // Build review items for low-confidence corrections
  const reviewItems = lowConf.map((c) => ({
    idx: c.idx,
    original_word: words[c.idx]?.word ?? '?',
    action: c.action,
    replacement: c.replacement ?? null,
    reason: c.reason ?? '',
    context: getContext(words, c.idx),
    approved: null,
  }));

  const correctedOutput = { ...input, words: correctedWords };
  await writeFile(correctedPath, JSON.stringify(correctedOutput, null, 2), 'utf8');
  await writeFile(reviewPath, JSON.stringify(reviewItems, null, 2), 'utf8');

  console.error(
    `Applied ${deleteSet.size} deletions, ${replaceMap.size} replacements (high confidence).`,
  );

  if (reviewItems.length > 0) {
    console.error(
      `\n${reviewItems.length} item(s) need review → ${reviewPath}`,
    );
    console.error(
      'Edit review.json: set "approved": true (apply) or "approved": false (skip),',
    );
    console.error('then run: node scripts/02-apply-review.mjs');
  } else {
    console.error('No uncertain items. No review needed.');
  }

  console.log(`corrected: ${correctedPath}`);
  console.log(`review: ${reviewPath}`);
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : String(e));
  process.exit(1);
});
