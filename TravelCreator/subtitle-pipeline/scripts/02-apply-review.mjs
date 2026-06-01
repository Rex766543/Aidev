#!/usr/bin/env node
/**
 * Step 2b: Apply human-reviewed corrections from review.json.
 *
 * Usage:
 *   node scripts/02-apply-review.mjs <corrected-words.json> <review.json> [--out <final-words.json>]
 *
 * In review.json, set each item's "approved" field:
 *   true  → apply the action (delete or replace)
 *   false → keep the original word
 *   null  → not yet reviewed (will abort with an error)
 */

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

async function main() {
  const argv = process.argv.slice(2);
  let correctedPath, reviewPath, outputPath;

  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--out') outputPath = argv[++i];
    else if (!correctedPath) correctedPath = argv[i];
    else if (!reviewPath) reviewPath = argv[i];
  }

  if (!correctedPath || !reviewPath) {
    console.error(
      'Usage: node scripts/02-apply-review.mjs <corrected-words.json> <review.json> [--out final-words.json]',
    );
    process.exit(1);
  }

  correctedPath = path.resolve(process.cwd(), correctedPath);
  reviewPath = path.resolve(process.cwd(), reviewPath);
  outputPath = outputPath
    ? path.resolve(process.cwd(), outputPath)
    : path.join(path.dirname(correctedPath), 'final-words.json');

  await mkdir(path.dirname(outputPath), { recursive: true });

  const corrected = JSON.parse(await readFile(correctedPath, 'utf8'));
  const reviewItems = JSON.parse(await readFile(reviewPath, 'utf8'));

  // Check for unreviewed items
  const pending = reviewItems.filter((item) => item.approved === null);
  if (pending.length > 0) {
    console.error(
      `Error: ${pending.length} item(s) in review.json still have "approved": null.`,
    );
    console.error('Set each to true (apply) or false (skip), then run again.');
    pending.forEach((item) => {
      console.error(`  idx ${item.idx}: "${item.original_word}" — ${item.reason}`);
    });
    process.exit(1);
  }

  // The corrected-words.json was produced from the original words.json by applying
  // high-confidence corrections. The indices in review.json refer to the ORIGINAL
  // words array. We need to reconcile by tracking which original words were kept.
  //
  // Simplest approach: re-read original words.json to get original indices.
  // We derive the original words path from the corrected path's directory.
  const workDir = path.dirname(correctedPath);
  const originalPath = path.join(workDir, 'words.json');

  let original;
  try {
    original = JSON.parse(await readFile(originalPath, 'utf8'));
  } catch {
    // If original not found, treat corrected words as original (no index remapping)
    original = corrected;
  }

  const originalWords = original.words ?? [];

  // Build approved corrections map: original_idx → action
  const approvedDeleteSet = new Set(
    reviewItems
      .filter((item) => item.approved === true && item.action === 'delete')
      .map((item) => item.idx),
  );
  const approvedReplaceMap = new Map(
    reviewItems
      .filter((item) => item.approved === true && item.action === 'replace' && item.replacement)
      .map((item) => [item.idx, item.replacement]),
  );

  // Re-apply all corrections (high-conf from corrected-words.json + approved review items)
  // by walking the original and corrected word lists together. corrected.words is the
  // original list minus high-conf deletions (replacements preserve start/end), so it is
  // an in-order subsequence of the original. We align with a two-pointer scan keyed on
  // (start, end) — NOT a Map keyed on start alone, because zero-width words can share a
  // start timestamp with the next word, which would collide and drop/duplicate words.
  const correctedWords = corrected.words ?? [];
  let ci = 0;

  const finalWords = [];
  for (let i = 0; i < originalWords.length; i++) {
    const orig = originalWords[i];
    const cw = correctedWords[ci];

    // A word survived the high-conf step iff the next unconsumed corrected word lines up
    // with this original word by (start, end). Otherwise it was deleted there.
    const survived = cw && cw.start === orig.start && cw.end === orig.end;
    if (!survived) continue;

    // Consume the matched corrected word.
    ci++;

    // Skip if approved for deletion in review.
    if (approvedDeleteSet.has(i)) continue;

    // Apply approved replacement.
    if (approvedReplaceMap.has(i)) {
      finalWords.push({ ...orig, word: approvedReplaceMap.get(i) });
      continue;
    }

    // Use the (possibly already replaced) word from corrected output.
    finalWords.push(cw);
  }

  const output = { ...corrected, words: finalWords };
  await writeFile(outputPath, JSON.stringify(output, null, 2), 'utf8');

  const applied = approvedDeleteSet.size + approvedReplaceMap.size;
  const skipped = reviewItems.filter((i) => i.approved === false).length;
  console.error(`Applied ${applied} review correction(s), skipped ${skipped}.`);
  console.error(`Final words: ${finalWords.length}`);
  console.log(outputPath);
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : String(e));
  process.exit(1);
});
