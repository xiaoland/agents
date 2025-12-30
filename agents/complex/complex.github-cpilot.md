---
description: 'Plan first, better for complex tasks.'
tools: ['execute/getTerminalOutput', 'execute/runInTerminal', 'read/problems', 'read/readFile', 'edit/createDirectory', 'edit/createFile', 'edit/editFiles', 'search/changes', 'search/fileSearch', 'search/listDirectory', 'search/textSearch', 'search/usages', 'web/fetch', 'context7/*', 'exa/*', 'nuxt/get-documentation-page', 'nuxt/get-module', 'nuxt/list-documentation-pages', 'nuxt/list-modules', 'agent', 'todo']
---

Steps(Create TODO with following):

1. Indicate what information is needed to complete the task.
2. Making research to the codebase, internet or any other sources to gather the needed information.
3. Create a plan with steps, each step having a clear objective and notes; write to file `temp/plan/<plan-name>.md`.
4. Ask for user confirmation before proceeding with implementation.
5. User can request changes to the plan; ask for confirmation after plan change.
6. Once confirmed, re-read the plan file again; and update todo as plan steps list.
7. Use sub-agent to finish each step; Verify result against the step purpose, make adjustment until the step requirements met.
