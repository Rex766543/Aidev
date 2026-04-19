import fs from 'node:fs';
import path from 'node:path';

export const audioExtensions = new Set([
  '.mp3',
  '.m4a',
  '.wav',
  '.webm',
  '.mp4',
  '.mpeg',
  '.mpga',
]);

export const videoExtensions = new Set([
  '.mp4',
  '.mov',
  '.m4v',
  '.webm',
]);

export const textExtensions = new Set([
  '.txt',
  '.md',
]);

export const resolveSessionDir = (rootDir, sessionArg) => {
  if (!sessionArg) {
    throw new Error('session path is required');
  }

  return path.isAbsolute(sessionArg)
    ? sessionArg
    : path.join(rootDir, sessionArg);
};

export const ensureDir = (target) => {
  fs.mkdirSync(target, {recursive: true});
};

export const loadEnvFile = (rootDir) => {
  const envPath = path.join(rootDir, '.env');
  if (!fs.existsSync(envPath)) {
    return;
  }

  const content = fs.readFileSync(envPath, 'utf8');
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) {
      continue;
    }

    const match = rawLine.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!match) {
      continue;
    }

    const [, key, rawValue] = match;
    if (process.env[key] !== undefined) {
      continue;
    }

    let value = rawValue.trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    process.env[key] = value;
  }
};

export const readJsonFile = (filePath, fallback = null) => {
  if (!fs.existsSync(filePath)) {
    return fallback;
  }

  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
};

export const writeJsonFile = (filePath, value) => {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
};

export const parseBrief = (briefPath) => {
  const content = fs.readFileSync(briefPath, 'utf8');
  const data = {
    notes: [],
  };
  let inNotes = false;

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) {
      continue;
    }

    if (/^notes:\s*$/i.test(line)) {
      inNotes = true;
      continue;
    }

    if (inNotes) {
      if (line.startsWith('-')) {
        data.notes.push(line.slice(1).trim());
      }
      continue;
    }

    const match = rawLine.match(/^([A-Za-z0-9_-]+):\s*(.+)$/);
    if (match) {
      data[match[1]] = match[2].trim();
    }
  }

  return data;
};

export const listFiles = (dirPath, extensions) => {
  if (!fs.existsSync(dirPath)) {
    return [];
  }

  return fs
    .readdirSync(dirPath)
    .map((fileName) => path.join(dirPath, fileName))
    .filter((fullPath) => fs.statSync(fullPath).isFile())
    .filter((fullPath) => extensions.has(path.extname(fullPath).toLowerCase()))
    .sort();
};

export const sentenceSplit = (text, language) => {
  const trimmed = text.trim();
  if (!trimmed) {
    return [];
  }

  if (typeof Intl !== 'undefined' && typeof Intl.Segmenter === 'function') {
    const segmenter = new Intl.Segmenter(language, {granularity: 'sentence'});
    const segments = [...segmenter.segment(trimmed)]
      .map((segment) => segment.segment.trim())
      .filter(Boolean);
    if (segments.length > 0) {
      return segments;
    }
  }

  return trimmed
    .split(/(?<=[.!?。！？؟।])(?:\s+|$)|\n+/u)
    .map((part) => part.trim())
    .filter(Boolean);
};

export const paragraphSplit = (text) => {
  return text
    .split(/\n{2,}/)
    .map((part) => part.trim())
    .filter(Boolean);
};

export const groupTextIntoMeaningBlocks = (text) => {
  const paragraphs = paragraphSplit(text);
  const blocks = [];

  for (const paragraph of paragraphs) {
    const sentences = sentenceSplit(paragraph);
    if (sentences.length === 0) {
      continue;
    }

    for (let index = 0; index < sentences.length; index += 3) {
      const currentBlock = sentences.slice(index, index + 3);
      if (currentBlock.length > 0) {
        blocks.push(currentBlock);
      }
    }
  }

  if (blocks.length === 0) {
    const fallback = sentenceSplit(text);
    return fallback.length > 0 ? fallback.map((sentence) => [sentence]) : [];
  }

  return blocks;
};

export const slugify = (value) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'travel-short';

export const toPublicRelative = (sessionName, kind, fileName) =>
  `sessions/${sessionName}/${kind}/${fileName}`;

export const copyIntoPublic = ({
  publicDir,
  sessionName,
  kind,
  sourcePath,
  targetName,
}) => {
  const kindDir = path.join(publicDir, 'sessions', sessionName, kind);
  ensureDir(kindDir);
  const fileName = targetName ?? path.basename(sourcePath);
  const outputPath = path.join(kindDir, fileName);
  fs.copyFileSync(sourcePath, outputPath);
  return toPublicRelative(sessionName, kind, fileName);
};

export const getMeaningBlockId = (index) => `block-${String(index + 1).padStart(2, '0')}`;

export const getMeaningBlockDirs = (sessionDir, blockId) => {
  const rootDir = path.join(sessionDir, 'input', 'meaning-blocks', blockId);

  return {
    rootDir,
    videosDir: path.join(rootDir, 'videos'),
    imagesDir: path.join(rootDir, 'images'),
  };
};
