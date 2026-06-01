# Knowledge Recorder Skill

This is a project-local skill definition for `Rex766543/Aidev`.

## Scope

Use only inside this repository and only for the `Knowledge/` folder.

Do not write to global Claude skills, global Codex memories, or files outside `Knowledge/` for this workflow.

## When To Use

Use this skill only when the user explicitly uses `/reco`.

Do not infer durable Knowledge from ordinary conversation.

## Procedure

1. Read `Knowledge/CLAUDE.md`.
2. Identify the target category file.
3. Append the extracted `/reco` content as a short dated entry.
4. Keep the user's intended meaning intact.
5. If the content spans multiple categories, choose the primary category and keep the entry concise.
6. If the user asks to reorganize Knowledge, update only files under `Knowledge/`.

## Category Selection

- `development.md`: code, architecture, tools, engineering decisions.
- `product.md`: product direction, UX, features, domain assumptions.
- `travel.md`: travel research, places, itineraries, creator travel insights.
- `writing.md`: tone, structure, editorial rules, storytelling.
- `operations.md`: workflow, collaboration, repo handling, process.
- `general.md`: anything durable that does not fit above.

## Output Style

After recording, briefly state which category file was updated.
