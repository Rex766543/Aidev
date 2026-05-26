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
  // We rebuild from the original words so indices are consistent.
  // High-confidence corrections are already in corrected.words; we detect them by
  // comparing corrected.words vs original.words using start timestamps as stable keys.
  const correctedByStart = new Map((corrected.words ?? []).map((w) => [w.start, w]));

  const finalWords = [];
  for (let i = 0; i < originalWords.length; i++) {
    const orig = originalWords[i];

    // Skip if approved for deletion in review
    if (approvedDeleteSet.has(i)) continue;

    // Check if high-conf step already deleted this word (not present by start time)
    if (!correctedByStart.has(orig.start)) continue;

    // Apply approved replacement
    if (approvedReplaceMap.has(i)) {
      finalWords.push({ ...orig, word: approvedReplaceMap.get(i) });
      continue;
    }

    // Use the (possibly already replaced) word from corrected output
    finalWords.push(correctedByStart.get(orig.start));
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
