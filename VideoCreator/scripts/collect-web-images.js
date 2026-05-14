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

// Japanese→English keyword map for common travel/culture concepts.
// Add entries here as new destinations are covered.
const keywordMap = [
  [/シーシャ/g, 'shisha'],
  [/イラン/g, 'iran'],
  [/ペルシャ/g, 'persia'],
  [/カザフスタン/g, 'kazakhstan'],
  [/日本/g, 'japan'],
  [/韓国/g, 'south korea'],
  [/タイ/g, 'thailand'],
  [/インド/g, 'india'],
  [/イタリア/g, 'italy'],
  [/フランス/g, 'france'],
  [/スペイン/g, 'spain'],
  [/トルコ/g, 'turkey'],
  [/モロッコ/g, 'morocco'],
  [/エジプト/g, 'egypt'],
  [/古代/g, 'ancient'],
  [/歴史/g, 'history'],
  [/文明/g, 'civilization'],
  [/宗教/g, 'religion'],
  [/ゾロアスター教/g, 'zoroastrianism'],
  [/キュロス2世|キュロス大王/g, 'cyrus the great'],
  [/遊牧/g, 'nomadic'],
  [/草原/g, 'steppe'],
  [/砂漠/g, 'desert'],
  [/山岳/g, 'mountain'],
  [/海岸/g, 'coast'],
  [/市場/g, 'market'],
  [/路地/g, 'alley'],
  [/文化/g, 'culture'],
  [/喫茶店/g, 'tea house'],
  [/カフェ/g, 'cafe'],
  [/炭/g, 'charcoal'],
  [/香り/g, 'aroma'],
  [/食事/g, 'food'],
  [/料理/g, 'cuisine'],
  [/建築/g, 'architecture'],
  [/寺院/g, 'temple'],
  [/モスク/g, 'mosque'],
  [/伝統/g, 'tradition'],
  [/工芸/g, 'craft'],
  [/祭り/g, 'festival'],
  [/旅行/g, 'travel'],
  [/風景/g, 'landscape'],
  [/街/g, 'city'],
  [/村/g, 'village'],
  [/人々/g, 'people'],
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

  const allWords = base
    .split(/\s+/)
    .filter((word) => word.length >= 3)
    .filter((value, index, array) => array.indexOf(value) === index);

  const terms = allWords.slice(0, 5);
  const joined = terms.join(' ').trim();
  const themeWords = themeValue
    ? toEnglishHint(themeValue).split(/\s+/).slice(0, 3).join(' ').trim()
    : '';

  return [...new Set([joined, terms.slice(0, 3).join(' ').trim(), themeWords].filter(Boolean))];
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

const downloadPicsumFallback = async (seed) => {
  // picsum.photos provides deterministic free-to-use placeholder images.
  // seed keeps results consistent across retries for the same block.
  const safeWord = seed.replace(/[^a-z0-9]/gi, '').slice(0, 24) || 'travel';
  const fallbackUrl = `https://picsum.photos/seed/${safeWord}/1080/1920`;
  const response = await fetch(fallbackUrl, {
    redirect: 'follow',
    headers: {'User-Agent': 'video-creator/1.0', Accept: 'image/*'},
  });

  if (!response.ok) {
    throw new Error(`Picsum fallback failed: ${response.status}`);
  }

  const contentType = response.headers.get('content-type') ?? 'image/jpeg';
  if (!contentType.startsWith('image/')) {
    throw new Error(`Picsum fallback returned non-image content-type: ${contentType}`);
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
    const fallbackSeed = `${block.id}-${slugify(queries[0] ?? block.id)}`;
    try {
      const {buffer, contentType, sourceUrl} = await downloadPicsumFallback(fallbackSeed);
      const fileName = `${block.id}-fallback${detectExtension(contentType)}`;
      const filePath = path.join(webImageDir, fileName);
      fs.writeFileSync(filePath, buffer);
      images.push({filePath, fileName, sourceUrl, title: fallbackSeed});
    } catch (error) {
      console.error(error instanceof Error ? error.message : String(error));
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
