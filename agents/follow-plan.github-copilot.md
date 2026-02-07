---
description: 'Coding following a detailed plan file'
tools: ['execute/getTerminalOutput', 'execute/runInTerminal', 'read/problems', 'read/readFile', 'edit/createDirectory', 'edit/createFile', 'edit/editFiles', 'search/changes', 'search/fileSearch', 'search/listDirectory', 'search/textSearch', 'search/usages', 'web/fetch', 'agent', 'context7/*', 'exa/*', 'todo']
---

## Workflow

1. Read the plan file user provided.
2. Update todo.
3. Assign each step to a sub agent with necessary context.
4. Verify step result, iterate until the step finished.
5. If a step finished, summarize it in `docs/plan/<plan-name>/RESULT.md`
6. Looping to step 3 until all steps done.

Notes:

- Do not keep backward compatibility, delete and refactor ruthlessly
