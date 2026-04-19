import fs from 'node:fs';
import path from 'node:path';
import {loadEnvFile} from './lib/session-utils.js';

loadEnvFile(process.cwd());

const input = process.argv[2];
const outputArg = process.argv[3];
const voiceArg = process.argv[4] ?? 'rachel';

if (!input) {
  console.error(
    'Usage: npm run audio:tts -- <input-text-file> [output-mp3] [rachel|adam]',
  );
  process.exit(1);
}

if (!fs.existsSync(input)) {
  console.error(`input not found: ${input}`);
  process.exit(1);
}

const apiKey = process.env.ELEVENLABS_API_KEY;
if (!apiKey) {
  console.error('ELEVENLABS_API_KEY is not set');
  process.exit(1);
}

const voiceIds = {
  rachel:
    process.env.ELEVENLABS_RACHEL_VOICE_ID ??
    '21m00Tcm4TlvDq8ikWAM',
  adam:
    process.env.ELEVENLABS_ADAM_VOICE_ID ??
    'pNInz6obpgDQGcFmaJgB',
};

const voiceKey = voiceArg.toLowerCase();
if (!(voiceKey in voiceIds)) {
  console.error(`unknown voice: ${voiceArg}`);
  process.exit(1);
}

const text = fs.readFileSync(input, 'utf8').trim();
if (!text) {
  console.error('input text is empty');
  process.exit(1);
}

const parsed = path.parse(input);
const output =
  outputArg ?? path.join(parsed.dir, `${parsed.name}.${voiceKey}.mp3`);

const response = await fetch(
  `https://api.elevenlabs.io/v1/text-to-speech/${voiceIds[voiceKey]}`,
  {
    method: 'POST',
    headers: {
      'xi-api-key': apiKey,
      'Content-Type': 'application/json',
      Accept: 'audio/mpeg',
    },
    body: JSON.stringify({
      text,
      model_id: process.env.ELEVENLABS_MODEL_ID ?? 'eleven_multilingual_v2',
      voice_settings: {
        stability: 0.45,
        similarity_boost: 0.8,
      },
    }),
  },
);

if (!response.ok) {
  console.error(`ElevenLabs request failed: ${response.status}`);
  console.error(await response.text());
  process.exit(1);
}

const bytes = Buffer.from(await response.arrayBuffer());
fs.writeFileSync(output, bytes);
console.log(output);
