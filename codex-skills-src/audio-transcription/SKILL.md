---
name: audio-transcription
description: Transcribe audio files in the local aidevforclaude workspace using the existing OpenAI-based CLI. Use when the user wants raw text from an audio file such as .m4a, .mp3, .wav, .mp4, or .webm, without applying a domain-specific summary format.
---

# Audio Transcription

Use the shared transcription CLI in `/Users/ishikawaryuusuke/Desktop/aidev/aidevforclaude`.

## Workflow

1. Confirm the target audio file path inside `/Users/ishikawaryuusuke/Desktop/aidev/aidevforclaude/audio` unless the user specifies another path in the same project.
2. Run `npm run transcribe -- <audio-file> --language ja` from `/Users/ishikawaryuusuke/Desktop/aidev/aidevforclaude` when the language is Japanese. Omit `--language` only if the user requests auto-detection or another language.
3. Read the generated transcript from `transcripts/<input-name>.txt` or from the explicit `--out` path.
4. Return the raw transcript or a very light cleanup only if the user asks for cleanup.

## Output Rules

- Default to preserving the transcript content as-is.
- Do not impose meeting minutes, issue structuring, or editorial formatting in this skill.
- If the transcript appears noisy, mention that it is a direct transcription and ask whether the user wants a formatted pass with another skill.

## Command

```bash
cd /Users/ishikawaryuusuke/Desktop/aidev/aidevforclaude
npm run transcribe -- ./audio/example.m4a --language ja
```

## Preconditions

- `OPENAI_API_KEY` must be set in `/Users/ishikawaryuusuke/Desktop/aidev/aidevforclaude/.env.local`.
- The audio file must exist in the workspace.
- Network approval may be required when calling the OpenAI API.
