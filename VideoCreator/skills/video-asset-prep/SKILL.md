---
name: video-asset-prep
description: Prepare subtitle text, required web-sourced images, user-provided videos, and planning data for the VideoCreator Remotion workflow.
---

# Video Asset Prep

Use this skill after the session input has been placed under `projects/.../input/`.

## Workflow

1. Read `input/brief.md`, source text, and any source audio.
2. If the input is audio, use `npm run audio:trim-silence -- <input>` when silence removal is needed, then derive only subtitle-ready text. Do not produce a separate transcript artifact unless the user asks.
3. Run `npm run extract:subtitles -- projects/YYYY-MM-DD_slug` to create `work/subtitle-source.txt` and `work/captions.json`.
4. If the input is text, keep the text as the subtitle source and prepare it for TTS with `npm run audio:tts -- <input-text> [output-mp3] [rachel|adam]`.
5. Run `npm run collect:web-images -- projects/YYYY-MM-DD_slug` to gather mandatory supplemental images into `input/web-images/` and `work/assets-manifest.json`.
6. Keep user-provided videos as primary or secondary assets based on fit, but do not skip the web image step.
7. Write the selected assets, subtitle text, and scene plan into `work/project.json`.

## Output Rules

- Every scene should have either a user video or a relevant sourced image.
- Images should be chosen with motion treatment in mind: zoom, pan, transition, or overlay text.
- Keep credits or source notes in comments or adjacent metadata only if needed for reuse.
