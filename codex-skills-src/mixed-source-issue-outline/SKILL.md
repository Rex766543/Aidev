---
name: mixed-source-issue-outline
description: Transcribe an audio file and combine it with one or more local text files to produce an issue-oriented outline. Use when the user wants discussion points organized across mixed sources such as audio, notes, agendas, specs, or prior summaries.
---

# Mixed Source Issue Outline

Use this skill when the final outline should reflect both spoken audio and supplemental text files.

## Workflow

1. Identify the target audio file and the supplemental text files in the workspace.
2. Transcribe the audio in `/Users/ishikawaryuusuke/Desktop/aidev/aidevforclaude` with the shared CLI.
3. Read the transcript and all referenced text files before structuring the output.
4. Merge overlapping points, keep source distinctions clear, and organize the result by issue or theme instead of chronology.
5. When sources disagree, surface the conflict explicitly instead of smoothing it over.

## Default Output Shape

- Overall purpose or scope, if inferable.
- Main issues or themes.
- Supporting details for each issue.
- Source-backed tensions, conflicts, or gaps.
- Open questions or items needing confirmation.

## Guardrails

- Distinguish direct source content from inference.
- If a point appears only in the text files or only in the audio, preserve that distinction when it matters.
- Do not fabricate consensus when the sources differ.
- If the supporting documents materially change the interpretation of the audio, mention that explicitly.

## Request Pattern

Ask for the skill name, the audio path, and the extra files in one request.

```text
mixed-source-issue-outline で ./audio/test.m4a を文字起こしして、さらに ./notes/agenda.md と ./docs/spec.txt も踏まえて論点整理して
```

## Command

```bash
cd /Users/ishikawaryuusuke/Desktop/aidev/aidevforclaude
npm run transcribe -- ./audio/example.m4a --language ja
```
