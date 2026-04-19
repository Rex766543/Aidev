import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const sessionArg = process.argv[2];

if (!sessionArg) {
  console.error('Usage: npm run build:project -- projects/YYYY-MM-DD_slug');
  process.exit(1);
}

const sessionDir = path.isAbsolute(sessionArg)
  ? sessionArg
  : path.join(root, sessionArg);
const inputBrief = path.join(sessionDir, 'input', 'brief.md');
const outputProject = path.join(sessionDir, 'work', 'project.json');

if (!fs.existsSync(inputBrief)) {
  console.error(`brief not found: ${inputBrief}`);
  process.exit(1);
}

const brief = fs.readFileSync(inputBrief, 'utf8');
const titleMatch = brief.match(/^theme:\s*(.+)$/m);
const theme = titleMatch?.[1]?.trim() ?? 'travel short';

const skeleton = {
  theme,
  fps: 30,
  width: 1080,
  height: 1920,
  audioMode: 'generated-audio',
  narrationSrc: '',
  bgmSrc: '',
  bgmVolume: 0.18,
  scenes: [
    {
      id: 'scene-1',
      title: 'Intro',
      overlayText: 'ここに演出テキストを入れる',
      durationInFrames: 120,
      asset: {
        kind: 'image',
        src: 'https://example.com/image.jpg',
        motion: 'zoom-in',
      },
      captions: [
        {
          startMs: 0,
          endMs: 1600,
          text: 'ここに字幕テキストを入れる',
        },
      ],
    },
  ],
};

fs.writeFileSync(outputProject, `${JSON.stringify(skeleton, null, 2)}\n`);
console.log(outputProject);
