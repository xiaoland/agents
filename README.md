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

## VS Code Tasks

To copy the GitHub Copilot agent files to your VS Code profiles' prompts folders:

- **One-time copy (Windows/PowerShell)**: Run the VS Code task "Copy Agent Files to Profiles" from the Command Palette (Tasks: Run Task). This uses `.vscode/copy-agents.ps1` to copy `agents/github-copilot/*.agent.md` to `%APPDATA%\Code\User\profiles\<profile-id>\prompts\`, creating the `prompts` folder if needed and overwriting existing files.

- **One-time copy (POSIX/bash)**: On Linux/macOS, run `./.vscode/copy-agents.sh` to copy to `~/.config/Code/User/profiles/<profile-id>/prompts/`.

These scripts ensure the agent files are available in each VS Code profile for use with GitHub Copilot.
