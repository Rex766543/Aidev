import fs from 'node:fs';
import path from 'node:path';
import {slugify} from './lib/session-utils.js';

const title = process.argv[2] ?? 'new-travel-short';
const directoryTitle = process.argv[3] ?? title;
const today = new Date().toISOString().slice(0, 10);
const root = process.cwd();
const sessionName = `${today}_${slugify(directoryTitle)}`;
const sessionDir = path.join(root, 'projects', sessionName);

const dirs = [
  'input/source-audio',
  'input/source-text',
  'input/user-videos',
  'input/meaning-blocks',
  'work',
  'output',
  'remotion',
];

fs.mkdirSync(sessionDir, {recursive: true});
for (const dir of dirs) {
  fs.mkdirSync(path.join(sessionDir, dir), {recursive: true});
}

const briefTemplate = fs.readFileSync(
  path.join(root, 'templates', 'brief.md'),
  'utf8',
);
const projectTemplate = fs.readFileSync(
  path.join(root, 'templates', 'project.json'),
  'utf8',
);
const videoAssignmentsTemplate = fs.readFileSync(
  path.join(root, 'templates', 'video-assignments.json'),
  'utf8',
);

fs.writeFileSync(path.join(sessionDir, 'input', 'brief.md'), briefTemplate);
fs.writeFileSync(path.join(sessionDir, 'work', 'project.json'), projectTemplate);
fs.writeFileSync(
  path.join(sessionDir, 'input', 'video-assignments.json'),
  videoAssignmentsTemplate,
);

console.log(sessionDir);
