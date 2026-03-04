# CLAUDE.md

This file provides guidance to Claude Code when working in this repository.

## Project Overview

This is an AI development workspace containing multiple projects:

- **aidevforclaude/**: Web application project (Next.js)
- **project-alpha/**: ビジネスタスク自動化プロジェクト（議事録・メール・パワポ自動生成）

## Project Routing

### aidevforclaude/
Web application development project. See `aidevforclaude/` for details.

### project-alpha/
ビジネス業務タスクの自動化環境。会議後処理（議事録Word生成・メール下書き作成）やパワポ資料作成を `/meeting`, `/pptx-*` コマンドで実行する。
詳細は `project-alpha/CLAUDE.md` を参照。

## Skills & Commands

- `/meeting` — 会議後ワンストップ処理（議事録生成→メール下書き→レビュー）
- `/pptx-proposal` — 提案資料パワポ作成
- `/pptx-report` — 定例報告資料パワポ作成
- `/pptx-adhoc` — アドホック課題資料パワポ作成

## MCP Configuration

`mcp.json` defines MCP servers available to this project:

- **playwright**: Browser automation via `@playwright/mcp@latest`
- **supabase**: Supabase database operations
- **github**: GitHub API operations

## Development Notes

- This is a git repository
- Add new MCP servers to `mcp.json` under `mcpServers`
- Python dependencies: `python-docx`, `python-pptx`
