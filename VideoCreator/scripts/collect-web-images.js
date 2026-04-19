import fs from 'node:fs';
import path from 'node:path';
import {
  ensureDir,
  getMeaningBlockDirs,
  parseBrief,
  readJsonFile,
  resolveSessionDir,
  slugify,
  writeJsonFile,
} from './lib/session-utils.js';

const sessionDir = resolveSessionDir(process.cwd(), process.argv[2]);
const briefPath = path.join(sessionDir, 'input', 'brief.md');
const assignmentsPath = path.join(sessionDir, 'input', 'video-assignments.json');
const meaningBlocksPath = path.join(sessionDir, 'work', 'meaning-blocks.json');
const webImageDir = path.join(sessionDir, 'input', 'web-images');
const manifestPath = path.join(sessionDir, 'work', 'assets-manifest.json');

ensureDir(webImageDir);

const brief = parseBrief(briefPath);
const assetMode = (brief.asset_mode ?? 'mixed').trim().toLowerCase();
const imageResearch =
  assetMode === 'videos-only'
    ? 'skip'
    : (brief.image_research ?? 'auto').trim().toLowerCase();
const theme = brief.theme ?? 'travel short';
const meaningBlocks = readJsonFile(meaningBlocksPath, {blocks: []}).blocks ?? [];
const assignmentData = readJsonFile(assignmentsPath, {assignments: []});

const assignedBlockIds = new Set(
  (assignmentData.assignments ?? []).flatMap((assignment) => assignment.blocks ?? []),
);

const keywordMap = [
  [/シーシャ/g, 'shisha'],
  [/イラン/g, 'iran'],
  [/ペルシャ/g, 'persia'],
  [/古代/g, 'ancient'],
  [/歴史/g, 'history'],
  [/文明/g, 'civilization'],
  [/宗教/g, 'religion'],
  [/ゾロアスター教/g, 'zoroastrianism'],
  [/キュロス2世|キュロス大王/g, 'cyrus the great'],
  [/市場/g, 'market'],
  [/路地/g, 'alley'],
  [/文化/g, 'culture'],
  [/喫茶店/g, 'tea house'],
  [/炭/g, 'charcoal'],
  [/香り/g, 'aroma'],
];

const toEnglishHint = (value) => {
  let converted = value;
  for (const [pattern, replacement] of keywordMap) {
    converted = converted.replace(pattern, ` ${replacement} `);
  }

  return converted
    .replace(/[^\p{Letter}\p{Number}\s-]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

const buildCompactQueries = ({themeValue, blockText}) => {
  const base = toEnglishHint([themeValue, blockText].filter(Boolean).join(' ')).toLowerCase();
  const prioritized = [];

  const pushIfPresent = (term) => {
    if (base.includes(term) && !prioritized.includes(term)) {
      prioritized.push(term);
    }
  };

  [
    'iran',
    'persia',
    'ancient',
    'history',
    'civilization',
    'zoroastrianism',
    'cyrus the great',
    'religion',
    'people',
    'culture',
  ].forEach(pushIfPresent);

  const genericTerms = base
    .split(/\s+/)
    .filter((word) => word.length >= 4)
    .filter((word) => !prioritized.includes(word));

  const terms = [...prioritized, ...genericTerms].slice(0, 5);
  const joined = terms.join(' ').trim();

  return [...new Set([
    joined,
    terms.slice(0, 3).join(' ').trim(),
    themeValue ? toEnglishHint(themeValue).split(/\s+/).slice(0, 3).join(' ').trim() : '',
    'iran persia history',
  ].filter(Boolean))];
};

const detectExtension = (contentType) => {
  if (contentType.includes('png')) return '.png';
  if (contentType.includes('webp')) return '.webp';
  return '.jpg';
};

const fetchOpenverseResults = async (query) => {
  const url = new URL('https://api.openverse.org/v1/images/');
  url.searchParams.set('q', query);
  url.searchParams.set('page_size', '6');
  url.searchParams.set('license_type', 'all');
  url.searchParams.set('aspect_ratio', 'tall');
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Openverse search failed: ${response.status}`);
  }

  const payload = await response.json();
  return payload.results ?? [];
};

const downloadImage = async (imageUrl) => {
  const response = await fetch(imageUrl);
  if (!response.ok) {
    throw new Error(`image download failed: ${response.status}`);
  }

  return {
    buffer: Buffer.from(await response.arrayBuffer()),
    contentType: response.headers.get('content-type') ?? 'image/jpeg',
  };
};

const downloadUnsplashFallback = async (query) => {
  const fallbackUrl = `https://source.unsplash.com/featured/1080x1920/?${encodeURIComponent(query)}`;
  const response = await fetch(fallbackUrl, {
    redirect: 'follow',
    headers: {
      'User-Agent': 'video-creator/1.0',
      Accept: 'image/*',
    },
  });

  if (!response.ok) {
    throw new Error(`Unsplash fallback failed: ${response.status}`);
  }

  const contentType = response.headers.get('content-type') ?? '';
  if (!contentType.startsWith('image/')) {
    throw new Error(`Unsplash fallback returned non-image content-type: ${contentType}`);
  }

  return {
    buffer: Buffer.from(await response.arrayBuffer()),
    contentType,
    sourceUrl: response.url,
  };
};

if (imageResearch === 'skip') {
  writeJsonFile(manifestPath, {
    assetMode,
    skipped: true,
    blocks: [],
  });
  console.log(manifestPath);
  process.exit(0);
}

const outputBlocks = [];
const seenUrls = new Set();

for (const block of meaningBlocks) {
  const blockDirs = getMeaningBlockDirs(sessionDir, block.id);
  const localImages = fs.existsSync(blockDirs.imagesDir)
    ? fs
        .readdirSync(blockDirs.imagesDir)
        .map((fileName) => path.join(blockDirs.imagesDir, fileName))
        .filter((filePath) => fs.statSync(filePath).isFile())
    : [];

  if (assetMode === 'mixed' && assignedBlockIds.has(block.id)) {
    outputBlocks.push({
      id: block.id,
      images: [],
      skipped: true,
      reason: 'video assigned',
    });
    continue;
  }

  if (localImages.length > 0) {
    outputBlocks.push({
      id: block.id,
      images: localImages.map((filePath) => ({
        filePath,
        fileName: path.basename(filePath),
      })),
    });
    continue;
  }

  const queries = buildCompactQueries({
    themeValue: theme,
    blockText: block.text,
  });
  const images = [];

  for (const query of queries) {
    const results = await fetchOpenverseResults(query);
    for (const result of results) {
      const sourceUrl = result.url ?? result.thumbnail;
      if (!sourceUrl || seenUrls.has(sourceUrl)) {
        continue;
      }

      try {
        const {buffer, contentType} = await downloadImage(sourceUrl);
        const fileName = `${block.id}-${slugify(query)}-01${detectExtension(contentType)}`;
        const filePath = path.join(webImageDir, fileName);
        fs.writeFileSync(filePath, buffer);
        images.push({
          filePath,
          fileName,
          sourceUrl,
          title: result.title ?? query,
        });
        seenUrls.add(sourceUrl);
      } catch (error) {
        console.error(error instanceof Error ? error.message : String(error));
      }

      if (images.length > 0) {
        break;
      }
    }

    if (images.length > 0) {
      break;
    }
  }

  if (images.length === 0) {
    for (const query of queries) {
      try {
        const {buffer, contentType, sourceUrl} = await downloadUnsplashFallback(query);
        const fileName = `${block.id}-${slugify(query)}-fallback${detectExtension(contentType)}`;
        const filePath = path.join(webImageDir, fileName);
        fs.writeFileSync(filePath, buffer);
        images.push({
          filePath,
          fileName,
          sourceUrl,
          title: query,
        });
        break;
      } catch (error) {
        console.error(error instanceof Error ? error.message : String(error));
      }
    }
  }

  outputBlocks.push({
    id: block.id,
    images,
  });
}

writeJsonFile(manifestPath, {
  assetMode,
  blocks: outputBlocks,
});
console.log(manifestPath);
