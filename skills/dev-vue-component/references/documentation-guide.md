# `compName.md` Guide

## Purpose

Provide specification-grade documentation that tells coding agents what the component does, when to use it, and how it behaves. This is NOT API documentation (that lives in the code) but rather semantic and behavioral documentation.

## Template

See [assets/compName.md](../assets/compName.md) for the starter template.

## Principles

- **Story-driven**: Show what the component can and cannot do
- **Token-efficient**: Use concise, clear language for coding agents
- **Specification-grade**: Executable knowledge, not vague descriptions
- **Maintain API in code**: Don't duplicate prop/emit documentation here

## Document Structure

The documentation should include these sections (see [assets/compName.md](../assets/compName.md) for structure):

1. **Rationale** - Why this component exists, when to use/not use it
2. **Design Semantics** - Concepts and visual/UX meaning
3. **Canonical Examples** - Representative usage patterns (not exhaustive)
4. **Behavioral Contract** - Guarantees consumers can rely on
5. **Extension & Composition** - How it integrates with other components
6. **Non-Goals** - What is explicitly out of scope
7. **Implementation Notes** - Notes for maintainers (optional)

## What to Include

### ✅ DO Include

- **Semantic meaning** of variants/states
- **When to use** and when NOT to use
- **Behavioral guarantees** consumers can rely on
- **Composition patterns** with other components
- **Canonical examples** showing typical usage
- **Non-goals** to prevent misuse
- **Visual/UX differences** between states

### ❌ DON'T Include

- Exhaustive prop/emit documentation (lives in `.ts` file)
- Step-by-step usage instructions (code examples show this)
- Changelog or version history
- Implementation details users don't need
- Marketing copy or sales language

## Writing Style

**For Coding Agents**: Write concisely and precisely

- Use active voice
- Be specific and measurable
- Use concrete examples
- Avoid ambiguity
- State guarantees, not possibilities
- List explicitly rather than prose

**Good**: "In `loading` state, no events are emitted"
**Bad**: "When loading, the component might not emit events"

**Good**: "Use for primary workflow actions. Do NOT use for navigation."
**Bad**: "This button can be used for various purposes throughout your application."

## Common Patterns

### Rationale Section

```markdown
## Rationale

Provides [problem solved]. Use when [condition]. Do NOT use for [anti-pattern] (use [alternative] instead).

Example:
Use for asynchronous actions that require user confirmation. Do NOT use for immediate state changes (use Toggle instead).
```

### Behavioral Contract Section

```markdown
## Behavioral Contract

- In [state]:
  - [guarantee 1]
  - [guarantee 2]
  
- [Operation] is [property] (example: idempotent, atomic)
- Never [anti-guarantee]
- Always [guarantee]
```

### Non-Goals Section

```markdown
## Non-Goals

- [Out of scope item 1]
- [Out of scope item 2]
- [Wrong use case]: use [correct component] instead
```

## Quality Checklist

Before finalizing documentation:

- [ ] Rationale clearly states when to use and when NOT to use
- [ ] Examples are canonical, not exhaustive
- [ ] Behavioral contract lists concrete guarantees
- [ ] Non-goals prevent common misuses
- [ ] No duplicate API docs (props/emits are in `.ts`)
- [ ] Language is concise and agent-friendly
- [ ] No ambiguous statements ("might", "could", "possibly")

## References

- [Histoire Docs Guide](https://histoire.dev/guide/vue3/docs.html)
