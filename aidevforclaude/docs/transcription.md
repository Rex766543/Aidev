# Audio Transcription Setup

This project includes a small CLI wrapper around OpenAI's transcription API.

## 1. Add your API key

Create or update `.env.local` in the project root:

```bash
OPENAI_API_KEY=your_api_key_here
```

The script loads `.env.local` automatically, so you do not need to export the variable manually.

## 2. Run a transcription

Supported input formats: `.mp3`, `.mp4`, `.mpeg`, `.mpga`, `.m4a`, `.wav`, `.webm`

```bash
npm run transcribe -- ./audio/sample.m4a
```

By default the script:

- sends the file to OpenAI's transcription API using `gpt-4o-mini-transcribe`
- writes the transcript to `transcripts/<original-name>.txt`
- prints the transcript to stdout

## 3. Useful options

Specify language explicitly:

```bash
npm run transcribe -- ./audio/sample.m4a --language ja
```

Write to a custom output path:

```bash
npm run transcribe -- ./audio/sample.m4a --out ./transcripts/sample-ja.txt
```

Save the full JSON response:

```bash
npm run transcribe -- ./audio/sample.m4a --json
```

Use a different transcription model:

```bash
npm run transcribe -- ./audio/sample.m4a --model whisper-1
```

## 4. How to use this with Codex

1. Put the audio file somewhere inside this workspace, for example `aidevforclaude/audio/meeting.m4a`.
2. Tell Codex which file to transcribe.
3. Codex can run the `npm run transcribe -- <path>` command and return the text result.

If the network is sandboxed, Codex may need your approval when it actually calls the OpenAI API.
