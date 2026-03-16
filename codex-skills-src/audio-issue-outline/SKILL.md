---
name: audio-issue-outline
description: Transcribe an audio file and organize the content by issues and discussion points. Use when the user wants spoken audio converted into a 논点/issue-oriented outline rather than a chronological transcript or meeting-minutes format.
---

# Audio Issue Outline

First transcribe the audio, then reorganize the content around issues, themes, or points of discussion.

## Workflow

1. Use the shared transcription flow in `/Users/ishikawaryuusuke/Desktop/aidev/aidevforclaude` to generate the full transcript.
2. Read the transcript and identify the main topics, tensions, questions, and supporting arguments.
3. Group the content by issue rather than by time order.
4. Keep the grouping practical and lightweight. Avoid over-structuring when the source audio is short or messy.

## Default Output Shape

- Overall topic or purpose, if inferable.
- Main issues or points of discussion.
- Supporting details under each issue.
- Conflicts, tradeoffs, or unanswered questions, if present.

## Guardrails

- Do not fabricate issue categories that are not grounded in the transcript.
- If the source is mostly monologue or narration, adapt the output into a topic outline rather than pretending there was a debate.
- Mark uncertain interpretations as inferences.

## Command

```bash
cd /Users/ishikawaryuusuke/Desktop/aidev/aidevforclaude
npm run transcribe -- ./audio/example.m4a --language ja
```
