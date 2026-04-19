import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {
  audioExtensions,
  ensureDir,
  groupTextIntoMeaningBlocks,
  listFiles,
  loadEnvFile,
  parseBrief,
  resolveSessionDir,
  sentenceSplit,
  textExtensions,
  writeJsonFile,
} from './lib/session-utils.js';

const rootDir = process.cwd();
loadEnvFile(rootDir);
const sessionDir = resolveSessionDir(rootDir, process.argv[2]);
const briefPath = path.join(sessionDir, 'input', 'brief.md');
const workDir = path.join(sessionDir, 'work');
const subtitleTextPath = path.join(workDir, 'subtitle-source.txt');
const captionsPath = path.join(workDir, 'captions.json');
const brief = parseBrief(briefPath);
const inputMode = (brief.input_mode ?? '').trim().toLowerCase();
const inputAudioDir = path.join(sessionDir, 'input', 'source-audio');
const transcribeProjectDir =
  process.env.AIDEVFORCLAUDE_PATH ?? path.resolve(rootDir, '..', 'aidevforclaude');
const language = brief.language ?? 'ja';

ensureDir(workDir);

const getAudioDurationMs = (audioPath) => {
  const ffprobe = spawnSync(
    'ffprobe',
    [
      '-v',
      'error',
      '-show_entries',
      'format=duration',
      '-of',
      'default=noprint_wrappers=1:nokey=1',
      audioPath,
    ],
    {encoding: 'utf8'},
  );

  if (ffprobe.status !== 0) {
    throw new Error(ffprobe.stderr || 'ffprobe failed');
  }

  const seconds = Number.parseFloat(ffprobe.stdout.trim());
  if (!Number.isFinite(seconds) || seconds <= 0) {
    throw new Error('failed to read audio duration');
  }

  return Math.round(seconds * 1000);
};

const buildCaptions = (text, totalDurationMs) => {
  const chunks = splitTextForCaptions(text);
  const totalWeight = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  let cursor = 0;

  return chunks.map((chunk, index) => {
    const weight = totalWeight > 0 ? chunk.length / totalWeight : 1 / chunks.length;
    const remaining = totalDurationMs - cursor;
    const segmentDuration =
      index === chunks.length - 1
        ? remaining
        : Math.max(800, Math.round(totalDurationMs * weight));
    const startMs = cursor;
    const endMs = Math.min(totalDurationMs, startMs + segmentDuration);
    cursor = endMs;

    return {
      startMs,
      endMs,
      text: chunk,
    };
  });
};

const splitLongCaptionChunk = (text, maxLength = 18) => {
  const trimmed = text.trim();
  if (!trimmed) {
    return [];
  }

  if (trimmed.length <= maxLength) {
    return [trimmed];
  }

  const chunks = [];
  let rest = trimmed;
  while (rest.length > maxLength) {
    let cut = maxLength;
    const preferredBreaks = ['、', '，', ',', ' ', '・'];
    for (const separator of preferredBreaks) {
      const index = rest.lastIndexOf(separator, maxLength);
      if (index >= Math.floor(maxLength * 0.55)) {
        cut = index + 1;
        break;
      }
    }

    chunks.push(rest.slice(0, cut).trim());
    rest = rest.slice(cut).trim();
  }

  if (rest) {
    chunks.push(rest);
  }

  return chunks.filter(Boolean);
};

const splitTextForCaptions = (text) => {
  const parts = text
    .split(/(?<=[。！？!?])|(?<=[、，,])/u)
    .map((part) => part.trim())
    .filter(Boolean);

  return parts.flatMap((part) => splitLongCaptionChunk(part));
};

const splitCaptionSegments = (segments) => {
  const refined = [];

  for (const segment of segments) {
    const chunks = splitTextForCaptions(segment.text);
    if (chunks.length <= 1) {
      refined.push(segment);
      continue;
    }

    const totalWeight = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
    let cursor = segment.startMs;

    chunks.forEach((chunk, index) => {
      const remaining = segment.endMs - cursor;
      const duration =
        index === chunks.length - 1
          ? remaining
          : Math.max(
              450,
              Math.round(((segment.endMs - segment.startMs) * chunk.length) / totalWeight),
            );

      refined.push({
        startMs: cursor,
        endMs: Math.min(segment.endMs, cursor + duration),
        text: chunk,
      });
      cursor = Math.min(segment.endMs, cursor + duration);
    });
  }

  return refined.filter((segment) => segment.endMs > segment.startMs);
};

const normalizeForAlignment = (value) =>
  value
    .normalize('NFKC')
    .replace(/\s+/gu, '')
    .replace(/[“”"'"'`‘’(),:;[\]{}]/gu, '')
    .trim();

const alignSegmentsToSentences = ({segments, language: targetLanguage}) => {
  const combinedText = segments.map((segment) => segment.text.trim()).join(' ');
  const sentences = sentenceSplit(combinedText, targetLanguage);
  if (sentences.length === 0) {
    return segments;
  }

  const normalizedSentences = sentences.map((sentence) => normalizeForAlignment(sentence));
  const aligned = [];
  let segmentIndex = 0;

  for (let sentenceCursor = 0; sentenceCursor < sentences.length; sentenceCursor += 1) {
    const sentence = sentences[sentenceCursor];
    const target = normalizedSentences[sentenceCursor];
    let startMs = null;
    let endMs = null;
    let buffer = '';

    while (segmentIndex < segments.length) {
      const segment = segments[segmentIndex];
      const normalizedSegment = normalizeForAlignment(segment.text);
      if (normalizedSegment.length === 0) {
        segmentIndex += 1;
        continue;
      }

      if (startMs === null) {
        startMs = segment.startMs;
      }

      buffer += normalizedSegment;
      endMs = segment.endMs;
      segmentIndex += 1;

      if (
        buffer === target ||
        buffer.startsWith(target) ||
        target.startsWith(buffer) ||
        buffer.length >= Math.max(1, Math.floor(target.length * 0.9))
      ) {
        break;
      }
    }

    if (startMs !== null && endMs !== null) {
      aligned.push({
        startMs,
        endMs,
        text: sentence,
      });
    }
  }

  if (aligned.length === sentences.length) {
    return splitCaptionSegments(aligned);
  }

  return buildCaptions(combinedText, segments[segments.length - 1].endMs);
};

if (inputMode === 'audio') {
  const audioDir = path.join(sessionDir, 'input', 'source-audio');
  const audioFiles = listFiles(audioDir, audioExtensions);
  if (audioFiles.length === 0) {
    throw new Error(`no audio file found in ${audioDir}`);
  }

  const inputAudio = audioFiles[0];
  const segmentsPath = path.join(workDir, 'whisper-segments.json');

  // Try segment-level timestamps first for accurate caption timing
  const segmentTranscribe = spawnSync(
    'npm',
    [
      'run',
      'transcribe',
      '--',
      inputAudio,
      '--segments',
      '--out',
      segmentsPath,
      '--language',
      language,
    ],
    {
      cwd: transcribeProjectDir,
      stdio: 'inherit',
    },
  );

  if (segmentTranscribe.status === 0 && fs.existsSync(segmentsPath)) {
    // Use Whisper segment timestamps directly as captions
    const segments = JSON.parse(fs.readFileSync(segmentsPath, 'utf8')).filter(
      (seg) => typeof seg?.text === 'string' && seg.text.trim().length > 0,
    );
    if (Array.isArray(segments) && segments.length > 0) {
      const alignedSegments = alignSegmentsToSentences({
        segments,
        language,
      });
      const text = alignedSegments.map((seg) => seg.text.trim()).join(' ');
      fs.writeFileSync(subtitleTextPath, `${text}\n`);
      writeJsonFile(captionsPath, alignedSegments);
      console.log(captionsPath);
      process.exit(0);
    }
  }

  // Fallback: plain text transcription with proportional timing
  const transcribe = spawnSync(
    'npm',
    [
      'run',
      'transcribe',
      '--',
      inputAudio,
      '--out',
      subtitleTextPath,
      '--language',
      language,
    ],
    {
      cwd: transcribeProjectDir,
      stdio: 'inherit',
    },
  );

  if (transcribe.status !== 0) {
    process.exit(transcribe.status ?? 1);
  }

  const text = fs.readFileSync(subtitleTextPath, 'utf8').trim();
  const durationMs = getAudioDurationMs(inputAudio);
  const captions = buildCaptions(text, durationMs);
  writeJsonFile(captionsPath, captions);
  console.log(captionsPath);
  process.exit(0);
}

if (inputMode === 'text') {
  const textDir = path.join(sessionDir, 'input', 'source-text');
  const textFiles = listFiles(textDir, textExtensions);
  if (textFiles.length === 0) {
    throw new Error(`no text file found in ${textDir}`);
  }

  const text = fs.readFileSync(textFiles[0], 'utf8').trim();
  fs.writeFileSync(subtitleTextPath, `${text}\n`);
  const sentences = sentenceSplit(text, language);
  const estimatedScenes = Math.max(groupTextIntoMeaningBlocks(text).length, 1);
  const existingAudioFiles = listFiles(inputAudioDir, audioExtensions);
  const totalDurationMs =
    existingAudioFiles.length > 0
      ? getAudioDurationMs(existingAudioFiles[0])
      : Math.max(6000, Math.max(sentences.length, estimatedScenes) * 2600);
  const captions = buildCaptions(text, totalDurationMs);
  writeJsonFile(captionsPath, captions);
  console.log(captionsPath);
  process.exit(0);
}

throw new Error(`unsupported input_mode: ${brief.input_mode ?? '(missing)'}`);
