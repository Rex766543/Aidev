#!/usr/bin/env node

import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";

const projectRoot = process.cwd();
const defaultOutputDir = path.join(projectRoot, "transcripts");
const supportedExtensions = new Set([
  ".mp3",
  ".mp4",
  ".mpeg",
  ".mpga",
  ".m4a",
  ".wav",
  ".webm",
]);

function printUsage() {
  console.log(`Usage:
  npm run transcribe -- <audio-file> [--out <output-file>] [--model <model>] [--language <code>] [--json] [--segments]

Examples:
  npm run transcribe -- ./audio/interview.m4a
  npm run transcribe -- ./audio/interview.m4a --language ja
  npm run transcribe -- ./audio/interview.m4a --out ./transcripts/interview.txt
  npm run transcribe -- ./audio/interview.m4a --json
  npm run transcribe -- ./audio/interview.m4a --segments   # outputs [{startMs, endMs, text}, ...]`);
}

function parseArgs(argv) {
  const args = [...argv];
  const options = {
    model: "gpt-4o-mini-transcribe",
    json: false,
  };

  while (args.length > 0) {
    const token = args.shift();
    if (!token) {
      continue;
    }

    if (!token.startsWith("--") && !options.inputPath) {
      options.inputPath = token;
      continue;
    }

    if (token === "--out") {
      options.outputPath = args.shift();
      continue;
    }

    if (token === "--model") {
      options.model = args.shift();
      continue;
    }

    if (token === "--language") {
      options.language = args.shift();
      continue;
    }

    if (token === "--json") {
      options.json = true;
      continue;
    }

    if (token === "--segments") {
      options.segments = true;
      continue;
    }

    if (token === "--help" || token === "-h") {
      options.help = true;
      continue;
    }

    throw new Error(`Unknown argument: ${token}`);
  }

  return options;
}

async function loadEnvFile(filePath) {
  try {
    const content = await readFile(filePath, "utf8");
    for (const rawLine of content.split(/\r?\n/)) {
      const line = rawLine.trim();
      if (!line || line.startsWith("#")) {
        continue;
      }

      const match = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
      if (!match) {
        continue;
      }

      const [, key, rawValue] = match;
      if (process.env[key]) {
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
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") {
      return;
    }
    throw error;
  }
}

async function resolveApiKey() {
  await loadEnvFile(path.join(projectRoot, ".env.local"));
  await loadEnvFile(path.join(projectRoot, ".env"));
  return process.env.OPENAI_API_KEY;
}

function getDefaultOutputPath(inputPath, { json = false, segments = false } = {}) {
  const extension = json || segments ? ".json" : ".txt";
  const fileName = `${path.basename(inputPath, path.extname(inputPath))}${extension}`;
  return path.join(defaultOutputDir, fileName);
}

async function ensureAudioFile(inputPath) {
  const fileStats = await stat(inputPath);
  if (!fileStats.isFile()) {
    throw new Error(`Not a file: ${inputPath}`);
  }

  const extension = path.extname(inputPath).toLowerCase();
  if (!supportedExtensions.has(extension)) {
    throw new Error(
      `Unsupported file type: ${extension || "(none)"}. Supported: ${[...supportedExtensions].join(", ")}`
    );
  }
}

async function transcribe({ apiKey, inputPath, model, language, segments }) {
  const formData = new FormData();
  const audioBuffer = await readFile(inputPath);
  const audioFile = new File([audioBuffer], path.basename(inputPath), {
    type: "application/octet-stream",
  });

  formData.append("file", audioFile);
  formData.append("model", model);
  if (language) {
    formData.append("language", language);
  }
  if (segments) {
    formData.append("response_format", "verbose_json");
    formData.append("timestamp_granularities[]", "segment");
  }

  const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI API error (${response.status}): ${errorText}`);
  }

  return response.json();
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help || !options.inputPath) {
    printUsage();
    process.exit(options.help ? 0 : 1);
  }

  const inputPath = path.resolve(projectRoot, options.inputPath);
  await ensureAudioFile(inputPath);

  const apiKey = await resolveApiKey();
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not set. Add it to .env.local or export it in your shell.");
  }

  const outputPath = path.resolve(
    projectRoot,
    options.outputPath || getDefaultOutputPath(inputPath, { json: options.json, segments: options.segments })
  );

  await mkdir(path.dirname(outputPath), { recursive: true });
  if (!options.outputPath) {
    await mkdir(defaultOutputDir, { recursive: true });
  }

  console.error(`Transcribing ${path.relative(projectRoot, inputPath)} with ${options.model}...`);
  const result = await transcribe({
    apiKey,
    inputPath,
    model: options.model,
    language: options.language,
    segments: options.segments,
  });

  let serialized;
  if (options.segments) {
    // Output segment-level timestamps as a JSON array of {startMs, endMs, text}
    const segments = (result.segments ?? []).map((seg) => ({
      startMs: Math.round(seg.start * 1000),
      endMs: Math.round(seg.end * 1000),
      text: seg.text?.trim() || "",
    }));
    serialized = JSON.stringify(segments, null, 2);
  } else if (options.json) {
    serialized = JSON.stringify(result, null, 2);
  } else {
    serialized = `${result.text?.trim() || ""}\n`;
  }

  await writeFile(outputPath, serialized, "utf8");

  console.error(`Saved transcript to ${path.relative(projectRoot, outputPath)}`);
  if (!options.json && !options.segments && result.text) {
    console.log(result.text.trim());
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
