import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {
  audioExtensions,
  copyIntoPublic,
  ensureDir,
  getMeaningBlockDirs,
  getMeaningBlockId,
  groupTextIntoMeaningBlocks,
  listFiles,
  loadEnvFile,
  parseBrief,
  readJsonFile,
  resolveSessionDir,
  sentenceSplit,
  videoExtensions,
  writeJsonFile,
} from './lib/session-utils.js';

const rootDir = process.cwd();
loadEnvFile(rootDir);
const publicDir = path.join(rootDir, 'public');
const sessionDir = resolveSessionDir(rootDir, process.argv[2]);
const sessionName = path.basename(sessionDir);
const briefPath = path.join(sessionDir, 'input', 'brief.md');
const inputVideoDir = path.join(sessionDir, 'input', 'user-videos');
const inputAudioDir = path.join(sessionDir, 'input', 'source-audio');
const inputAssignmentsPath = path.join(sessionDir, 'input', 'video-assignments.json');
const workDir = path.join(sessionDir, 'work');
const subtitleSourcePath = path.join(workDir, 'subtitle-source.txt');
const captionsPath = path.join(workDir, 'captions.json');
const meaningBlocksPath = path.join(workDir, 'meaning-blocks.json');
const manifestPath = path.join(workDir, 'assets-manifest.json');
const projectPath = path.join(workDir, 'project.json');
const transcribeProjectDir =
  process.env.AIDEVFORCLAUDE_PATH ?? path.resolve(rootDir, '..', 'aidevforclaude');

ensureDir(publicDir);
ensureDir(workDir);

const runScript = (scriptName) => {
  const result = spawnSync('node', [path.join(rootDir, 'scripts', scriptName), sessionDir], {
    cwd: rootDir,
    stdio: 'inherit',
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
};

const getMediaDurationMs = (inputPath) => {
  const ffprobe = spawnSync(
    'ffprobe',
    [
      '-v',
      'error',
      '-show_entries',
      'format=duration',
      '-of',
      'default=noprint_wrappers=1:nokey=1',
      inputPath,
    ],
    {encoding: 'utf8'},
  );

  if (ffprobe.status !== 0) {
    throw new Error(ffprobe.stderr || `ffprobe failed for ${inputPath}`);
  }

  const seconds = Number.parseFloat(ffprobe.stdout.trim());
  if (!Number.isFinite(seconds) || seconds <= 0) {
    throw new Error(`failed to read media duration for ${inputPath}`);
  }

  return Math.round(seconds * 1000);
};

const createDefaultAssignments = ({videos, blocks}) => ({
  assignments: videos.map((video, index) => ({
    file: path.basename(video.filePath),
    blocks: blocks[index] ? [blocks[index].id] : [],
  })),
});

const normalizeAssignments = ({rawAssignments, blocks, videos}) => {
  const knownBlocks = new Set(blocks.map((block) => block.id));
  const videoByName = new Map(videos.map((video) => [video.fileName, video]));
  const blockToVideos = new Map(blocks.map((block) => [block.id, []]));

  for (const assignment of rawAssignments.assignments ?? []) {
    const video = videoByName.get(assignment.file);
    if (!video) {
      continue;
    }

    const uniqueBlocks = [...new Set(assignment.blocks ?? [])].filter((blockId) =>
      knownBlocks.has(blockId),
    );

    for (const blockId of uniqueBlocks) {
      blockToVideos.get(blockId).push(video);
    }
  }

  return blockToVideos;
};

const allocateSegmentsForBlock = ({
  assignedVideos,
  durationInFrames,
}) => {
  if (assignedVideos.length === 0) {
    return [];
  }

  const segments = [];
  let remainingFrames = durationInFrames;

  for (const video of assignedVideos) {
    if (remainingFrames <= 0) {
      break;
    }

    const videoRemaining = video.totalFrames - video.cursorFrame;
    if (videoRemaining <= 0) {
      const tailFrames = Math.max(1, Math.floor(video.totalFrames * 0.35));
      const playbackRate = tailFrames / remainingFrames;
      segments.push({
        src: video.publicSrc,
        startFrom: Math.max(0, video.totalFrames - tailFrames),
        endAt: video.totalFrames,
        playbackRate,
        durationInFrames: remainingFrames,
      });
      remainingFrames = 0;
      continue;
    }

    if (videoRemaining >= remainingFrames) {
      segments.push({
        src: video.publicSrc,
        startFrom: video.cursorFrame,
        endAt: video.cursorFrame + remainingFrames,
        playbackRate: 1,
        durationInFrames: remainingFrames,
      });
      video.cursorFrame += remainingFrames;
      remainingFrames = 0;
      continue;
    }

    const normalFrames = Math.floor(videoRemaining * 0.5);
    const slowSourceFrames = videoRemaining - normalFrames;

    if (normalFrames > 0) {
      segments.push({
        src: video.publicSrc,
        startFrom: video.cursorFrame,
        endAt: video.cursorFrame + normalFrames,
        playbackRate: 1,
        durationInFrames: normalFrames,
      });
    }

    const slowOutputFrames = remainingFrames - normalFrames;
    const slowPlaybackRate = slowSourceFrames / slowOutputFrames;
    segments.push({
      src: video.publicSrc,
      startFrom: video.cursorFrame + normalFrames,
      endAt: video.totalFrames,
      playbackRate: slowPlaybackRate,
      durationInFrames: slowOutputFrames,
    });
    video.cursorFrame = video.totalFrames;
    remainingFrames = 0;
  }

  if (remainingFrames > 0) {
    const fallbackVideo = assignedVideos[assignedVideos.length - 1];
    const tailFrames = Math.max(1, Math.floor(fallbackVideo.totalFrames * 0.35));
    const playbackRate = tailFrames / remainingFrames;
    segments.push({
      src: fallbackVideo.publicSrc,
      startFrom: Math.max(0, fallbackVideo.totalFrames - tailFrames),
      endAt: fallbackVideo.totalFrames,
      playbackRate,
      durationInFrames: remainingFrames,
    });
  }

  return segments;
};

const groupCaptionsByBlocks = ({blocks, captions, subtitleText}) => {
  if (blocks.length === 0) {
    return captions.map((caption) => [caption]);
  }

  if (captions.length === 0) {
    return blocks.map(() => []);
  }

  const totalEndMs = captions[captions.length - 1]?.endMs ?? 0;
  if (totalEndMs <= 0) {
    return blocks.map(() => []);
  }

  const sentences = sentenceSplit(subtitleText);
  const blockLengths = blocks.map((block) =>
    Math.max(
      1,
      block.sentences.length > 0
        ? block.sentences.reduce((sum, sentence) => sum + sentence.length, 0)
        : block.text.length,
    ),
  );
  const totalLength = blockLengths.reduce((sum, length) => sum + length, 0);

  const boundaries = [];
  let cursor = 0;
  for (let index = 0; index < blocks.length; index += 1) {
    const share = totalLength > 0 ? blockLengths[index] / totalLength : 1 / blocks.length;
    const end =
      index === blocks.length - 1 ? totalEndMs : Math.round(cursor + totalEndMs * share);
    boundaries.push({startMs: cursor, endMs: end});
    cursor = end;
  }

  const grouped = blocks.map(() => []);
  for (const caption of captions) {
    const midpoint = (caption.startMs + caption.endMs) / 2;
    const blockIndex = boundaries.findIndex(
      (boundary, index) =>
        midpoint >= boundary.startMs &&
        (midpoint < boundary.endMs || index === boundaries.length - 1),
    );
    grouped[Math.max(0, blockIndex)].push(caption);
  }

  return grouped;
};

const brief = parseBrief(briefPath);
const inputMode = (brief.input_mode ?? '').trim().toLowerCase();
const assetMode = (brief.asset_mode ?? 'mixed').trim().toLowerCase();
const imageResearch =
  assetMode === 'videos-only'
    ? 'skip'
    : (brief.image_research ?? 'auto').trim().toLowerCase();
const fps = 30;

runScript('extract-subtitles.js');

// Text mode: generate TTS audio if none exists, then rerun subtitle extraction
// so timings are recalculated from the real audio duration in one pass.
if (inputMode === 'text') {
  const existingAudios = listFiles(inputAudioDir, audioExtensions);
  if (existingAudios.length === 0 && fs.existsSync(subtitleSourcePath)) {
    const ttsOutput = path.join(inputAudioDir, 'narration.mp3');
    const voiceArg = brief.tts_voice ?? 'rachel';
    const tts = spawnSync(
      'node',
      [
        path.join(rootDir, 'scripts', 'generate-elevenlabs-audio.js'),
        subtitleSourcePath,
        ttsOutput,
        voiceArg,
      ],
      {cwd: rootDir, stdio: 'inherit'},
    );

    if (tts.status !== 0) {
      console.error('TTS generation failed — continuing with estimated timing');
    } else {
      const rerun = spawnSync('node', [path.join(rootDir, 'scripts', 'extract-subtitles.js'), sessionDir], {
        cwd: rootDir,
        stdio: 'inherit',
        env: {
          ...process.env,
          AIDEVFORCLAUDE_PATH: transcribeProjectDir,
        },
      });

      if (rerun.status !== 0) {
        console.error('Subtitle recalculation after TTS failed — keeping estimated timing');
      }
    }
  }
}

const captions = readJsonFile(captionsPath, []);
const sourceAudios = listFiles(inputAudioDir, audioExtensions);
const userVideos = listFiles(inputVideoDir, videoExtensions);

const narrationSrc =
  sourceAudios.length > 0
    ? copyIntoPublic({
        publicDir,
        sessionName,
        kind: 'audio',
        sourcePath: sourceAudios[0],
      })
    : '';

const subtitleText = fs.existsSync(subtitleSourcePath)
  ? fs.readFileSync(subtitleSourcePath, 'utf8').trim()
  : '';

const meaningBlockSentences = groupTextIntoMeaningBlocks(subtitleText);
const meaningBlocks =
  meaningBlockSentences.length === 0
    ? [
        {
          id: getMeaningBlockId(0),
          order: 1,
          text: subtitleText || brief.theme || 'Travel Story',
          sentences: subtitleText ? [subtitleText] : [],
        },
      ]
    : meaningBlockSentences.map((sentences, index) => ({
        id: getMeaningBlockId(index),
        order: index + 1,
        text: sentences.join(' '),
        sentences,
      }));

for (const block of meaningBlocks) {
  const dirs = getMeaningBlockDirs(sessionDir, block.id);
  ensureDir(dirs.rootDir);
  ensureDir(dirs.videosDir);
  ensureDir(dirs.imagesDir);
}

const groupedCaptions = groupCaptionsByBlocks({
  blocks: meaningBlocks,
  captions,
  subtitleText,
});

const blocksWithTiming = meaningBlocks.map((block, index) => {
  const captionGroup = groupedCaptions[index] ?? [];
  const firstCaption = captionGroup[0];
  const lastCaption = captionGroup[captionGroup.length - 1];
  const durationInFrames =
    firstCaption && lastCaption
      ? Math.max(45, Math.round(((lastCaption.endMs - firstCaption.startMs) / 1000) * fps))
      : Math.max(45, block.sentences.length * 45);

  return {
    ...block,
    captions: captionGroup,
    durationInFrames,
    durationInSeconds: Number((durationInFrames / fps).toFixed(2)),
  };
});

const availableVideos = userVideos.map((filePath) => ({
  filePath,
  fileName: path.basename(filePath),
}));

if (!fs.existsSync(inputAssignmentsPath)) {
  writeJsonFile(
    inputAssignmentsPath,
    createDefaultAssignments({videos: availableVideos, blocks: blocksWithTiming}),
  );
}

const rawAssignments = readJsonFile(
  inputAssignmentsPath,
  createDefaultAssignments({videos: availableVideos, blocks: blocksWithTiming}),
);

const preparedVideos = availableVideos.map((video, index) => {
  const publicSrc = copyIntoPublic({
    publicDir,
    sessionName,
    kind: 'videos',
    sourcePath: video.filePath,
    targetName: `${String(index + 1).padStart(2, '0')}${path.extname(video.filePath).toLowerCase()}`,
  });
  const totalFrames = Math.max(1, Math.round((getMediaDurationMs(video.filePath) / 1000) * fps));

  return {
    ...video,
    publicSrc,
    totalFrames,
    cursorFrame: 0,
  };
});

const blockToVideos = normalizeAssignments({
  rawAssignments,
  blocks: blocksWithTiming,
  videos: preparedVideos,
});

writeJsonFile(meaningBlocksPath, {
  assetMode,
  imageResearch,
  narrationSeconds: sourceAudios[0]
    ? Number((getMediaDurationMs(sourceAudios[0]) / 1000).toFixed(2))
    : null,
  blocks: blocksWithTiming.map((block) => ({
    id: block.id,
    order: block.order,
    text: block.text,
    sentences: block.sentences,
    durationInFrames: block.durationInFrames,
    durationInSeconds: block.durationInSeconds,
    assignedVideos: (blockToVideos.get(block.id) ?? []).map((video) => video.fileName),
    imageFolder: path.relative(sessionDir, getMeaningBlockDirs(sessionDir, block.id).imagesDir),
  })),
  availableVideos: preparedVideos.map((video) => ({
    file: video.fileName,
    durationInFrames: video.totalFrames,
    durationInSeconds: Number((video.totalFrames / fps).toFixed(2)),
  })),
});

if (imageResearch !== 'skip') {
  runScript('collect-web-images.js');
}

const imageManifest = readJsonFile(manifestPath, {blocks: []});
const imageMap = new Map((imageManifest.blocks ?? []).map((block) => [block.id, block]));

const resolveImageAsset = (block, index) => {
  const blockImages = imageMap.get(block.id)?.images ?? [];
  const firstImage = blockImages[0];

  if (!firstImage) {
    return null;
  }

  if (firstImage.filePath) {
    return {
      kind: 'image',
      src: copyIntoPublic({
        publicDir,
        sessionName,
        kind: 'images',
        sourcePath: firstImage.filePath,
        targetName: `${String(index + 1).padStart(2, '0')}${path.extname(firstImage.fileName).toLowerCase()}`,
      }),
      motion: ['zoom-in', 'pan-right', 'zoom-out', 'pan-left'][index % 4],
    };
  }

  if (firstImage.remoteSrc) {
    return {
      kind: 'image',
      src: firstImage.remoteSrc,
      motion: ['zoom-in', 'pan-right', 'zoom-out', 'pan-left'][index % 4],
    };
  }

  return null;
};

const scenes = blocksWithTiming.map((block, index) => {
  const assignedVideosForBlock = blockToVideos.get(block.id) ?? [];
  const videoSegments = allocateSegmentsForBlock({
    assignedVideos: assignedVideosForBlock,
    durationInFrames: block.durationInFrames,
  });
  const imageAsset =
    assetMode === 'videos-only' ? null : resolveImageAsset(block, index);
  const asset =
    videoSegments.length > 0
      ? {
          kind: 'video',
          src: videoSegments[0].src,
          segments: videoSegments,
        }
      : imageAsset;

  if (!asset) {
    if (assetMode === 'videos-only') {
      throw new Error(
        `missing assigned video for ${block.id}. Update ${inputAssignmentsPath} and rerun prepare:session`,
      );
    }

    throw new Error(
      `missing visual asset for ${block.id}. Add image research or assign a video.`,
    );
  }

  return {
    id: `scene-${index + 1}`,
    durationInFrames: block.durationInFrames,
    asset,
    captions: block.captions,
  };
});

writeJsonFile(projectPath, {
  theme: brief.theme ?? 'travel short',
  fps,
  width: 1080,
  height: 1920,
  audioMode:
    (brief.input_mode ?? '').trim().toLowerCase() === 'audio'
      ? 'original-audio'
      : 'generated-audio',
  narrationSrc,
  bgmSrc: '',
  bgmVolume: 0.18,
  sourceText: subtitleText,
  scenes,
});
console.log(projectPath);
