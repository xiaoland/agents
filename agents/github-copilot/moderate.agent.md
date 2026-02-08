---
description: "For moderate complexity tasks."
tools:
  [
    "execute/getTerminalOutput",
    "execute/runInTerminal",
    "read/problems",
    "read/readFile",
    "edit/createDirectory",
    "edit/createFile",
    "edit/editFiles",
    "search/changes",
    "search/fileSearch",
    "search/listDirectory",
    "search/textSearch",
    "search/usages",
    "web/fetch",
    "context7/*",
    "exa/*",
    "agent",
    "todo",
  ]
---

## Workflow

1. Thoroughly explore the codebase to understand existing patterns.
   1.1 Research internet for up-to-date information.
   1.2 Ask user questions if you need to clarify the approach.
2. Design a concrete implementation strategy.
3. Assign each step to a sub-agent with necessary context.
   3.1 Verify step result, iterate until the step finished.
   3.2 Looping until all steps finished.
4. Finalize documentation and make summary.

Notes:

- Run sub agent if possible.
- Do not keep backward compatibility, delete and refactor ruthlessly.
