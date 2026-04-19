import {spawnSync} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const input = process.argv[2];
const outputArg = process.argv[3];

if (!input) {
  console.error(
    'Usage: npm run audio:trim-silence -- <input-audio> [output-audio]',
  );
  process.exit(1);
}

if (!fs.existsSync(input)) {
  console.error(`input not found: ${input}`);
  process.exit(1);
}

const parsed = path.parse(input);
const output =
  outputArg ??
  path.join(parsed.dir, `${parsed.name}.trimmed${parsed.ext || '.mp3'}`);

const result = spawnSync(
  'ffmpeg',
  [
    '-y',
    '-i',
    input,
    '-af',
    'silenceremove=start_periods=1:start_silence=0.25:start_threshold=-42dB:stop_periods=-1:stop_silence=0.35:stop_threshold=-42dB',
    output,
  ],
  {stdio: 'inherit'},
);

if (result.error) {
  console.error(result.error.message);
  process.exit(1);
}

if (result.status !== 0) {
  process.exit(result.status ?? 1);
}

console.log(output);
