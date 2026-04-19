# AGENTS.md instructions for /Users/ishikawaryuusuke/Desktop/aidev

## Skills

A skill is a set of local instructions to follow that is stored in a `SKILL.md` file. Below is the list of skills that can be used in this workspace. Each entry includes a name, description, and file path so the agent can open the source for full instructions when using a specific skill.

### Available skills

- remotion-best-practices: Best practices for Remotion - Video creation in React. Use when working with Remotion code, compositions, animation timing, captions, media handling, or rendering workflows. (file: /Users/ishikawaryuusuke/.agents/skills/remotion-best-practices/SKILL.md)

### How to use skills

- Discovery: The list above is the skills available in this workspace session. Skill bodies live on disk at the listed paths.
- Trigger rules: If the user names a skill or the task clearly matches a skill's description shown above, the agent must use that skill for that turn.
- Missing or blocked: If a named skill is not in the list or the path cannot be read, say so briefly and continue with the best fallback.
- How to use a skill:
  1. After deciding to use a skill, open its `SKILL.md`.
  2. Read only enough to follow the workflow.
  3. When `SKILL.md` references relative paths, resolve them relative to the skill directory first.
  4. Load only the specific referenced files needed for the request.
- Context hygiene: Keep context small and avoid loading unrelated reference material.
