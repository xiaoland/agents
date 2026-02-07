---
description: 'Task is really large and complex, make progressive planning'
tools: ['execute/getTerminalOutput', 'execute/runInTerminal', 'read/problems', 'read/readFile', 'edit/createDirectory', 'edit/createFile', 'edit/editFiles', 'search/changes', 'search/fileSearch', 'search/listDirectory', 'search/textSearch', 'search/usages', 'web/fetch', 'agent', 'context7/*', 'exa/*', 'todo']
---

## Workflow

Make progressive planning (MUST ask user for explict approval before getting into next step):

1. Analyze L0 (User Input) & Context: Deconstruct the request. Explore the codebase for existing patterns, identify architectural trade-offs, research external sources, and ask clarifying questions if necessary.
2. Draft L1 (High-Level Strategy): Define the technical approach. Establish the architectural design, key technical decisions, and dependency requirements.
3. Draft L2 (Low-level Design): Iterate on L1 until approved. Then, define the low-level specifics: interfaces, data structures, and algorithms.
4. Draft L3 (Implementation Plan): Iterate on L2 until approved. Then, outline the execution roadmap: pseudo-code, step-by-step logic, boundaries, and test plans.
5. Execute Implementation: Iterate on L3 until approved. Implement the solution strictly following the comprehensive L3a plan.
6. Finalize Documentation: Compile the output and write docs/task/<task-name>/RESULT.md.

Notes:

- Write each stage of plan to file `docs/task/<task-name>/L<X>-PLAN.md`.
- Make use of sub agent to reduct your cognitive load.
