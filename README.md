# Xiaoland's Agent Things

Include the prompts, agent skills, rules and everthing I'm using for coding agent are here.

- `skills/`: Claude Skills
- `toolsets/`
  - `github-copilot`
- `prompts/`
- `agents/`
  - `<agentName>/`
    - `<agentName>.github-copilot.md`
    - `<agentName>.xxx.xx`
- `agents.md/`

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
