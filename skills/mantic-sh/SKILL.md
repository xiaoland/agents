---
name: mantic-sh
description: Use Mantic.sh for context-aware code search in local repositories. Use when an agent needs intent-based file discovery, symbol definition/reference lookup, impact analysis, or session-aware context retrieval before coding.
compatibility: Requires Node.js and npx to run mantic.sh commands.
metadata:
  author: xiaoland
  version: "1.0"
---

# mantic-sh

Simple guidance for deciding when to use Mantic.sh and how to run it effectively.

## When to use this skill

- Find code by intent when exact keywords are unknown.
- Locate likely files before reading a large codebase.
- Jump to symbol definitions across packages.
- Find symbol references for refactors or code review.
- Estimate blast radius with impact-aware search.
- Keep retrieval context across a multi-step coding task.

Common trigger phrases:

- "where is X implemented"
- "find auth/payment/router logic"
- "go to definition of X"
- "find references of X"
- "show impact of changing X"

## When not to use Mantic.sh

- Exact literal or regex text search (prefer `rg`).
- Mass text operations (for example, scanning all TODO comments).
- Interactive fuzzy browsing (prefer `fzf` style workflows).

## Decision flow

1. If the task is exact text or regex matching, use `rg` first.
2. If the task is intent-based discovery, use `mantic <query>`.
3. If a symbol name is known, use `mantic goto <symbol>` or `mantic references <symbol>`.
4. If change risk matters, add `--impact`.
5. If results are weak, retry with better domain terms or `--semantic`.

## Procedure

1. Run Mantic without installation:

```bash
npx mantic.sh@latest "<query>" --files
```

2. Choose output mode:

- `--files` for fast path lists
- `--json` for structured processing
- `--markdown` for readable terminal output

3. Use symbol intelligence when applicable:

```bash
npx mantic.sh@latest goto "<SymbolName>"
npx mantic.sh@latest references "<SymbolName>"
```

4. Use deeper analysis only when needed:

```bash
npx mantic.sh@latest "<query>" --impact
npx mantic.sh@latest "<query>" --semantic
```

5. Restrict scope for precision:

- `--path <dir>`
- `--code`, `--test`, `--config`

6. Open top-ranked files and continue with normal edit/test workflow.

## Completion checks

- Query type matches the selected search mode.
- At least one relevant file or symbol location is found.
- Impact was checked before risky changes.
- Fallback to `rg` was used if Mantic output is empty or too broad.

## Quick examples

```bash
npx mantic.sh@latest "stripe payment webhook" --files
npx mantic.sh@latest goto "UserService"
npx mantic.sh@latest references "handleLogin"
npx mantic.sh@latest "session auth middleware" --impact --json
```

## MCP note

If your environment already exposes Mantic MCP tools (`search_files`, `get_definition`, `find_references`), prefer those tools over shell commands in that environment.
