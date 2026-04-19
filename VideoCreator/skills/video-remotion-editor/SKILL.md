---
name: video-remotion-editor
description: Edit or render VideoCreator travel shorts in Remotion using the local project.json scene model, subtitle overlays, image motion, and BGM.
---

# Video Remotion Editor

Use this skill for building or revising the final short-form video in Remotion.

## Files

- Composition entrypoint: `src/Root.tsx`
- Main composition: `src/compositions/TravelShort.tsx`
- Re-editable session state: `projects/.../work/project.json`

## Workflow

1. Validate the session JSON against `src/lib/schema.ts`.
2. Keep scene timing, overlay text, captions, asset sources, narration, and BGM in `project.json`.
3. For image scenes, apply motion so the result feels like video rather than a static slide.
4. Keep edits declarative so a future prompt can change timing, text, or assets without rewriting components.
5. Render via Remotion using the updated JSON props with `npm run render:session -- projects/YYYY-MM-DD_slug`.

## Render contract

- Treat `projects/.../work/project.json` as the source of truth for render input.
- The session render entrypoint is `scripts/render-session.js`.
- The script passes `work/project.json` into Remotion via `--props=...`.
- `src/Root.tsx` validates those props with `src/lib/schema.ts`.

## Edit Types

- Shorten or extend a scene
- Replace a web image with a better one
- Swap a user video into a different scene
- Rewrite overlay text
- Adjust subtitle timing
- Tune BGM volume
