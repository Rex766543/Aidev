#!/usr/bin/env node
/**
 * End-to-end subtitle pipeline orchestrator.
 *
 * Usage:
 *   node scripts/pipeline.mjs --audio <audio-file> [--language ja] [--work-dir ./work]
 *   node scripts/pipeline.mjs --audio <audio-file> --continue   # resume after review
 *
 * Steps:
 *   1. Transcribe audio → work/words.json        (requires OPENAI_API_KEY)
 *   2. Auto-correct     → work/corrected-words.json + work/review.json  (requires ANTHROPIC_API_KEY)
 *   2b. Apply review    → work/final-words.json  (runs only when review.json is fully approved)
 *   3. Layout           → work/subtitles.json
 *   4. ASS generation   → work/subtitle.ass
 *
 * To re-run a step, delete its output file and run the pipeline again.
 *
 * After step 4, open work/subtitle.ass in Aegisub for timing tweaks, then burn:
 *   ffmpeg -i <audio-file> -vf "ass=work/subtitle.ass" -c:a copy output.mp4
 */

import { access, mkdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function script(name) {
  return path.join(__dirname, name);
}

function run(scriptPath, args = []) {
  const result = spawnSync(process.execPath, [scriptPath, ...args], {
    stdio: 'inherit',
    env: process.env,
  });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(`Script ${path.basename(scriptPath)} exited with code ${result.status}`);
  }
}

async function exists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function hasPendingReview(reviewPath) {
  if (!(await exists(reviewPath))) return false;
  const items = JSON.parse(await readFile(reviewPath, 'utf8'));
  return Array.isArray(items) && items.some((item) => item.approved === null);
}

async function main() {
  const argv = process.argv.slice(2);
  let audioPath, workDir, language, continueMode, font, fontSize;

  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--audio') audioPath = argv[++i];
    else if (argv[i] === '--work-dir') workDir = argv[++i];
    else if (argv[i] === '--language') language = argv[++i];
    else if (argv[i] === '--continue') continueMode = true;
    else if (argv[i] === '--font') font = argv[++i];
    else if (argv[i] === '--font-size') fontSize = argv[++i];
  }

  if (!audioPath) {
    console.error(
      [
        'Usage:',
        '  node scripts/pipeline.mjs --audio <audio-file> [--language ja] [--work-dir ./work]',
        '  node scripts/pipeline.mjs --audio <audio-file> --continue   # resume after review',
        '',
        'Environment variables required:',
        '  OPENAI_API_KEY     — for Whisper transcription',
        '  ANTHROPIC_API_KEY  — for Claude correction',
      ].join('\n'),
    );
    process.exit(1);
  }

  audioPath = path.resolve(process.cwd(), audioPath);
  if (!workDir) {
    const base = path.basename(audioPath, path.extname(audioPath));
    workDir = path.join(path.dirname(audioPath), `${base}-work`);
  } else {
    workDir = path.resolve(process.cwd(), workDir);
  }

  await mkdir(workDir, { recursive: true });

  const wordsJson = path.join(workDir, 'words.json');
  const correctedJson = path.join(workDir, 'corrected-words.json');
  const reviewJson = path.join(workDir, 'review.json');
  const finalWordsJson = path.join(workDir, 'final-words.json');
  const subtitlesJson = path.join(workDir, 'subtitles.json');
  const assFile = path.join(workDir, 'subtitle.ass');

  // Step 1: Transcribe
  if (!(await exists(wordsJson))) {
    console.error('\n── Step 1: Transcribing audio ──');
    const args = [audioPath, '--out', wordsJson];
    if (language) args.push('--language', language);
    run(script('01-transcribe.mjs'), args);
  } else {
    console.error('Step 1 already done (words.json exists). Skipping.');
  }

  // Step 2: Correct
  if (!(await exists(correctedJson))) {
    console.error('\n── Step 2: Auto-correcting transcription ──');
    run(script('02-correct.mjs'), [wordsJson, '--out', correctedJson, '--review', reviewJson]);
  } else {
    console.error('Step 2 already done (corrected-words.json exists). Skipping.');
  }

  // Check for pending review
  if (await hasPendingReview(reviewJson)) {
    console.error('\n── Review required ──');
    console.error(`Open ${reviewJson} and set "approved": true or false for each item.`);
    console.error('Then resume with:');
    console.error(`  node scripts/pipeline.mjs --audio ${audioPath} --continue`);
    console.error('');
    console.error('Or skip the review step and run manually:');
    console.error(`  node scripts/02-apply-review.mjs ${correctedJson} ${reviewJson}`);
    process.exit(0);
  }

  // Step 2b: Apply review (or copy corrected → final if no review)
  if (!(await exists(finalWordsJson))) {
    if (await exists(reviewJson)) {
      const items = JSON.parse(await readFile(reviewJson, 'utf8'));
      if (Array.isArray(items) && items.length > 0) {
        console.error('\n── Step 2b: Applying review corrections ──');
        run(script('02-apply-review.mjs'), [correctedJson, reviewJson, '--out', finalWordsJson]);
      } else {
        // No review items — use corrected directly
        console.error('No review items. Using corrected-words.json as final.');
        run(script('02-apply-review.mjs'), [correctedJson, reviewJson, '--out', finalWordsJson]);
      }
    } else {
      // No review.json at all — use corrected directly
      console.error('No review file. Using corrected-words.json as final.');
      const { copyFile } = await import('node:fs/promises');
      await copyFile(correctedJson, finalWordsJson);
    }
  } else {
    console.error('Step 2b already done (final-words.json exists). Skipping.');
  }

  // Step 3: Layout
  if (!(await exists(subtitlesJson))) {
    console.error('\n── Step 3: Laying out subtitle chunks ──');
    run(script('03-layout.mjs'), [finalWordsJson, '--out', subtitlesJson]);
  } else {
    console.error('Step 3 already done (subtitles.json exists). Skipping.');
  }

  // Step 4: ASS generation
  if (!(await exists(assFile))) {
    console.error('\n── Step 4: Generating ASS subtitle file ──');
    const args = [subtitlesJson, '--out', assFile];
    if (font) args.push('--font', font);
    if (fontSize) args.push('--font-size', fontSize);
    run(script('04-ass-gen.mjs'), args);
  } else {
    console.error('Step 4 already done (subtitle.ass exists). Skipping.');
  }

  console.error('\n── Pipeline complete ──');
  console.error(`ASS file: ${assFile}`);
  console.error('');
  console.error('Next:');
  console.error(`  1. Adjust timing in Aegisub:  aegisub ${assFile}`);
  console.error(
    `  2. Burn into video:  ffmpeg -i <video.mp4> -vf "ass=${assFile}" -c:a copy output.mp4`,
  );
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : String(e));
  process.exit(1);
});
