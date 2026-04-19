import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {resolveSessionDir} from './lib/session-utils.js';

const rootDir = process.cwd();
const sessionArg = process.argv[2];
const outputArg = process.argv[3];

if (!sessionArg) {
  console.error(
    'Usage: npm run render:session -- projects/YYYY-MM-DD_slug [output-file.mp4]',
  );
  process.exit(1);
}

const sessionDir = resolveSessionDir(rootDir, sessionArg);
const sessionName = path.basename(sessionDir);
const projectPath = path.join(sessionDir, 'work', 'project.json');

if (!fs.existsSync(projectPath)) {
  console.error(`project.json not found: ${projectPath}`);
  process.exit(1);
}

const outputPath =
  outputArg ?? path.join(sessionDir, 'output', `${sessionName}.mp4`);

fs.mkdirSync(path.dirname(outputPath), {recursive: true});

const result = spawnSync(
  path.join(rootDir, 'node_modules', '.bin', 'remotion'),
  [
    'render',
    'src/index.ts',
    'TravelShort',
    outputPath,
    `--props=${projectPath}`,
  ],
  {
    cwd: rootDir,
    stdio: 'inherit',
  },
);

if (result.error) {
  console.error(result.error.message);
  process.exit(1);
}

if (result.status !== 0) {
  process.exit(result.status ?? 1);
}

console.log(outputPath);
