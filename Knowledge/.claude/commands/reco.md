# /reco

Project-local command for recording durable Knowledge.

## Trigger

Use this command only when the user message starts with or clearly contains `/reco`.

## Behavior

1. Read `Knowledge/CLAUDE.md`.
2. Extract the statement after `/reco`.
3. Select the best category file in `Knowledge/categories/`.
4. Append a concise entry.
5. Do not record anything from messages without `/reco`.

## Entry Format

```markdown
- 2026-06-01 `/reco`: Concise knowledge note.
```

Use the actual current date for new entries.
