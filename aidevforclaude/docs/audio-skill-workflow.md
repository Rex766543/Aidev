# Audio Skill Workflow

This workspace supports a fixed two-step flow:

1. Transcribe the audio file with the shared CLI.
2. Apply a named Codex skill to decide how the transcript should be returned.

## Installed Skills

- `audio-transcription`: return the transcript as text
- `audio-meeting-summary`: return the transcript as meeting minutes
- `audio-issue-outline`: return the transcript as an issue-oriented outline

## Recommended Request Pattern

Mention both the skill name and the audio path in the same request.

Examples:

```text
audio-transcription で ./audio/test.m4a を文字起こしして
```

```text
audio-meeting-summary で ./audio/test.m4a を文字起こしして議事録にして
```

```text
audio-issue-outline で ./audio/test.m4a を文字起こしして論点整理して
```

## Operational Notes

- Put the input audio file under `aidevforclaude/audio/`.
- The transcript is saved under `aidevforclaude/transcripts/`.
- If the OpenAI API call requires network approval, Codex may request permission at execution time.
- Add new formatting skills later without changing the shared transcription command.
