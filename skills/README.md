# Agent Skills

A collection of reusable, portable skills following the [Agent Skills](https://agentskills.io/) open standard.

## What are Agent Skills?

Agent Skills are a lightweight, open format for extending AI agent capabilities with specialized knowledge and workflows. Each skill is a folder containing a `SKILL.md` file with metadata and instructions that tell an agent how to perform a specific task.

### Directory Structure

```
skill-name/
├── SKILL.md          # Required: instructions + metadata
├── scripts/          # Optional: executable code
├── references/       # Optional: documentation
└── assets/           # Optional: templates, resources
```

## How Skills Work

Skills use progressive disclosure to manage context efficiently:

1. **Discovery**: At startup, agents load only the name and description of each available skill
2. **Activation**: When a task matches a skill's description, the agent reads the full `SKILL.md` instructions
3. **Execution**: The agent follows the instructions, loading referenced files or executing bundled code as needed

## SKILL.md Format

Every skill requires a `SKILL.md` file with YAML frontmatter and Markdown instructions:

```markdown
---
name: skill-name
description: What this skill does and when to use it (1-1024 chars)
license: Apache-2.0  # optional
compatibility: Required environment details  # optional
metadata:  # optional
  author: your-name
  version: "1.0"
---

# Skill Title

## When to use this skill
Describe the specific scenarios...

## Instructions
Step-by-step guidance...
```

### Frontmatter Requirements

- **name**: 1-64 characters, lowercase letters/numbers/hyphens only, must match directory name
- **description**: 1-1024 characters, describe what it does AND when to use it, include keywords
- **license**: Optional, license name or reference to LICENSE.txt
- **compatibility**: Optional, max 500 characters, environment requirements
- **metadata**: Optional, arbitrary key-value pairs
- **allowed-tools**: Optional, space-delimited list of pre-approved tools (experimental)

## Authoring Best Practices

### 1. **Progressive Disclosure**

- Keep `SKILL.md` under 500 lines and 5000 tokens recommended
- Move detailed documentation to `references/` directory
- Place executable code in `scripts/` directory
- Keep file references one level deep from `SKILL.md`

### 2. **Clear Descriptions**

Write descriptions that help agents identify when to use the skill:

✅ **Good**: "Extracts text and tables from PDF files, fills PDF forms, and merges multiple PDFs. Use when working with PDF documents or when the user mentions PDFs, forms, or document extraction."

❌ **Poor**: "Helps with PDFs."

### 3. **Self-Contained Instructions**

- Provide step-by-step instructions in the skill body
- Include examples of inputs and outputs
- Document common edge cases
- Make scripts self-contained or clearly document dependencies

### 4. **Modularity**

- Each skill should have a single, well-defined purpose
- Design skills as reusable building blocks
- Enable skills to work together through standard interfaces
- Avoid tight coupling between skills

### 5. **Portability**

- Skills are just files - easy to edit, version, and share
- Keep them compatible across different agent implementations
- Only use `compatibility` field when truly necessary
- Document any required system packages or network access

## Optional Directories

### `scripts/`

Contains executable code that agents can run:

- Be self-contained or clearly document dependencies
- Include helpful error messages
- Handle edge cases gracefully

### `references/`

Contains additional documentation loaded on demand:

- `REFERENCE.md` - Detailed technical reference
- Domain-specific files (e.g., `finance.md`, `legal.md`)
- Keep files focused - agents load these only when needed

### `assets/`

Contains static resources:

- Templates (document templates, configuration templates)
- Images (diagrams, examples)
- Data files (lookup tables, schemas)

## Validation

Use the [skills-ref](https://github.com/agentskills/agentskills/tree/main/skills-ref) reference library to validate your skills:

```bash
skills-ref validate ./my-skill
```

## Adoption

Agent Skills are supported by leading AI development tools including Cursor, Claude, GitHub Copilot, VS Code, and others. See [agentskills.io](https://agentskills.io/) for the full list.

## Resources

- [Agent Skills Specification](https://agentskills.io/specification) - Complete format specification
- [What are Skills?](https://agentskills.io/what-are-skills) - Introduction and concepts
- [Example Skills](https://github.com/anthropics/skills) - Sample skills on GitHub
- [Integration Guide](https://agentskills.io/integrate-skills) - Add skills support to your agent
- [Best Practices](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices) - Authoring guidelines
