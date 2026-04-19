---
name: video-orchestrator
description: Orchestrate travel short video generation or re-editing in /Users/ishikawaryuusuke/Desktop/aidev/VideoCreator using Remotion, local session folders, required web image research, and the project JSON workflow.
---

# Video Orchestrator

Use this skill for end-to-end video work inside `/Users/ishikawaryuusuke/Desktop/aidev/VideoCreator`.

## Workflow

1. Confirm or create a session folder with `npm run init:session -- "<title>" ["directory-title"]`.
2. Read `input/brief.md` and determine `input_mode`:
   - `audio`: use the original audio as narration, remove silence if needed, extract only subtitle-grade text.
   - `text`: confirm whether translation is needed, then generate narration with ElevenLabs Rachel or Adam.
3. Run `npm run prepare:session -- projects/YYYY-MM-DD_slug` to extract subtitle text, compute block durations, create `work/meaning-blocks.json`, and scaffold `input/video-assignments.json`.
4. If `asset_mode` uses videos, inspect `work/meaning-blocks.json`, assign each `input/user-videos/*` file to one or more blocks in `input/video-assignments.json`, and rerun `prepare:session`.
5. If `asset_mode` is `images-only` or `mixed`, gather matching reference images only for blocks that still need images.
6. Use `video-asset-prep` to organize external images, block videos, subtitle text, and BGM direction.
7. Use `video-remotion-editor` to update `work/project.json` and the Remotion composition.
8. Render through Remotion only using `npm run render:session -- projects/YYYY-MM-DD_slug`. Do not export to CapCut in the default workflow.

## Canonical order

Follow this sequence unless the user explicitly asks to skip a step:

1. `npm run init:session -- "<title>" ["directory-title"]`
   Reference: `scripts/init-session.js`
2. Fill `projects/.../input/brief.md` and add source files under `input/source-audio`, `input/source-text`, `input/user-videos`
   Reference: `templates/brief.md`
3. `npm run prepare:session -- projects/YYYY-MM-DD_slug`
   Reference: `scripts/prepare-session.js`
4. If using videos, inspect `projects/.../work/meaning-blocks.json` and update `projects/.../input/video-assignments.json`, then rerun `prepare:session`
   Reference: `scripts/prepare-session.js`
5. Inspect and, if needed, edit `projects/.../work/project.json`
   Reference: `src/lib/schema.ts`, `src/compositions/TravelShort.tsx`
6. `npm run render:session -- projects/YYYY-MM-DD_slug`
   Reference: `scripts/render-session.js`, `src/Root.tsx`

## Canonical files by step

- Session scaffold: `scripts/init-session.js`, `templates/brief.md`, `templates/project.json`
- Video assignment input: `templates/video-assignments.json`, `projects/.../input/video-assignments.json`
- Subtitle extraction: `scripts/extract-subtitles.js`
- Meaning block manifest: `projects/.../work/meaning-blocks.json`
- Web image collection: `scripts/collect-web-images.js`
- Session assembly: `scripts/prepare-session.js`
- Durable state: `projects/.../work/project.json`
- Schema validation: `src/lib/schema.ts`
- Composition root: `src/Root.tsx`
- Final composition: `src/compositions/TravelShort.tsx`
- Scene renderer: `src/components/VideoScene.tsx`
- Session render entry: `scripts/render-session.js`

## Guardrails

- Keep the skill body lean. Put repeatable state in `projects/.../work/project.json`.
- Do not create a full transcript deliverable. Extract only the text needed for subtitles.
- Prefer 9:16 short-form output.
- If web image collection or external APIs are blocked, say so clearly and leave placeholders in `project.json`.
