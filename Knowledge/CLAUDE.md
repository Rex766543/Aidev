# Knowledge Project Guide

This folder is the only place for accumulated Knowledge in this repository.

## Purpose

Use `Knowledge/` as a project-local memory base for durable notes that the user explicitly marks for recording. Do not treat ordinary conversation, implementation details, temporary plans, or guesses as Knowledge.

## Rule For Recording

Only record content when the user explicitly uses `/reco`.

Examples:

```text
/reco Next.js App Router notes should go into development knowledge.
/reco 旅行記事では現地交通の不確実性も体験価値として扱う。
```

If the user does not use `/reco`, do not add or update Knowledge files.

## How Claude Should Use This

At session start, Claude should read this file first when working inside this project. This file acts as the project guide for Knowledge handling.

When `/reco` appears:

1. Extract only the knowledge-worthy statement after `/reco`.
2. Choose the best category file under `Knowledge/categories/`.
3. Append the item with the date, source marker, and a concise note.
4. Preserve existing entries. Do not rewrite unrelated Knowledge.
5. If no category fits, append to `Knowledge/categories/general.md`.

## How Codex Should Use This

Codex does not automatically treat `CLAUDE.md` exactly like Claude does. For this project, Codex should voluntarily follow the same convention:

1. When working on Knowledge behavior, read `Knowledge/CLAUDE.md` first.
2. Treat this file as the local project instruction for Knowledge only.
3. Record Knowledge only when the user explicitly writes `/reco`.
4. Keep all Knowledge artifacts inside `Knowledge/`.
5. Do not use global Codex memories, global skills, or files outside this repository for this Knowledge base.

## Project-Local Commands And Skills

Project-local command and skill definitions live under:

```text
Knowledge/.claude/commands/
Knowledge/.claude/skills/
```

These files are documentation and Claude-local configuration for this repository only. They should not be copied into global Claude or Codex configuration unless the user explicitly asks.

## Category Files

Use these category files by default:

```text
Knowledge/categories/general.md
Knowledge/categories/development.md
Knowledge/categories/product.md
Knowledge/categories/travel.md
Knowledge/categories/writing.md
Knowledge/categories/operations.md
```

Add a new category file only when repeated `/reco` items clearly need their own category.
