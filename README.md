# Xiaoland's Agent Things

Include the prompts, agent skills, rules and everthing I'm using for coding agent are here.

- `skills/`: Claude Skills
- `prompts/`
- `agents/`
  - `<agentName>/`
    - `<agentName>.github-copilot.md`
    - `<agentName>.cursor.md`
- `rules/`
- `agents.md/`: Project Index Guideline for Agents
- `mcp/`
  - `<mcpId>/`
    - `<mcpId>.github-copilot.md`
    - `<mcpId>.claude.md`

## Agents

The custom agents.

Frontmatter `version` (array) controls the version of Coding Agent this custom agent can be applied to.

## Usage

- Manaually Copy
- Build: `dist/`
  - `vue`
    - `github-copilot/`
      - `.github/agents/`
      - `.github/instructions/`
      - `.github/prompts/`
      - `.github/skills/`
      - `.github/copilot-instruction.md`
    - `claude-code/`
