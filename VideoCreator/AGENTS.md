# AGENTS.md instructions for /Users/ishikawaryuusuke/Desktop/aidev/VideoCreator

## Scope

- These instructions apply to all work inside `/Users/ishikawaryuusuke/Desktop/aidev/VideoCreator`.
- Treat this directory as a Remotion-based short-video generation and re-editing project by default.

## Skills

### Available skills

- remotion-best-practices: Best practices for Remotion - Video creation in React. (file: `/Users/ishikawaryuusuke/.agents/skills/remotion-best-practices/SKILL.md`)
- video-orchestrator: End-to-end orchestration for this workspace. (file: `/Users/ishikawaryuusuke/Desktop/aidev/VideoCreator/skills/video-orchestrator/SKILL.md`)
- video-asset-prep: Input normalization, subtitle text preparation, and required web image sourcing. (file: `/Users/ishikawaryuusuke/Desktop/aidev/VideoCreator/skills/video-asset-prep/SKILL.md`)
- video-remotion-editor: Remotion-based composition editing and rendering using `project.json`. (file: `/Users/ishikawaryuusuke/Desktop/aidev/VideoCreator/skills/video-remotion-editor/SKILL.md`)

### Required usage

- For any task in this directory involving video generation, composition design, animation timing, captions, assets, audio, rendering, or Remotion project setup, use `remotion-best-practices`.
- For end-to-end workflow execution in this directory, use `video-orchestrator`.
- For input preparation, subtitle-ready text extraction, or required web image collection, use `video-asset-prep`.
- For scene edits, timing changes, subtitle insertion, image motion treatment, or render operations, use `video-remotion-editor`.
- Before implementing Remotion-related changes, open `/Users/ishikawaryuusuke/.agents/skills/remotion-best-practices/SKILL.md`.
- Load only the specific rule files needed for the current task.

## Operational notes

- If there is any ambiguity about framework choice for video generation in this directory, prefer Remotion first.
- Prefer `projects/.../work/project.json` as the durable editing state to keep prompts and token usage small across sessions.
