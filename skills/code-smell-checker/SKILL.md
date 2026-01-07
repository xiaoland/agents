---
name: code-smell-checker
description: Review code for maintainability issues and classic code smells. Use when checking code quality, architectural problems, type safety, Vue best practices, or general OOP design issues. Identifies technical debt in components, types, reactive data, and common anti-patterns.
license: Apache-2.0
compatibility: TypeScript + Vue 3 projects (general smells apply to any OOP codebase)
metadata:
  author: xiaoland
  version: "1.0"
  related-skills: "dev-vue-component"
---

# Code Smell Checker

## When to use

Review code when you need to:

- Check AI-generated or developer code for maintainability
- Identify technical debt and quality issues
- Validate TypeScript type design and semantic clarity
- Review Vue component architecture
- Ensure reactive data handling best practices
- Conduct code quality assessments

## What's covered

**TypeScript Types:**

- Organization and coupling → [type-organization.md](references/type-organization.md)
- Extensibility and complexity → [type-design.md](references/type-design.md)

**Vue Components:**

- Structure and lifecycle → [component-structure.md](references/component-structure.md)
- Props and state → [component-props-state.md](references/component-props-state.md)
- Templates and communication → [component-template.md](references/component-template.md)

**Reactive Data:**

- Ref, reactive, depth → [reactive-basics.md](references/reactive-basics.md)
- Computed properties → [reactive-computed.md](references/reactive-computed.md)
- Watch patterns → [reactive-watch.md](references/reactive-watch.md)
- Performance → [reactive-optimization.md](references/reactive-optimization.md)
- Memory management → [reactive-memory.md](references/reactive-memory.md)

**General Code Smells:**

- Bloaters (size & complexity) → [general-bloaters.md](references/general-bloaters.md)
- OO Abusers (design integrity) → [general-oo-abusers.md](references/general-oo-abusers.md)
- Change Preventers (rigidity) → [general-change-preventers.md](references/general-change-preventers.md)
- Dispensables (redundancy) → [general-dispensables.md](references/general-dispensables.md)
- Couplers (connectivity) → [general-couplers.md](references/general-couplers.md)

## How to use

**1. Identify scope:**

- Which area? (types, components, reactive, general smells)
- Which files to review?

**2. Apply checklist:**

- Read relevant reference doc
- Check code against items
- Note violations

**3. Report findings:**

- Categorize by severity
- Focus on maintainability impact
- Consider project context

**4. Provide feedback:**

- Explain why it's a problem
- Show the bad pattern
- Suggest concrete improvements
- Reference checklist item

## Quick reference

**TypeScript red flags:**

- Scattered type definitions
- `any`, `object`, overly broad types
- Complex type gymnastics
- Types don't match runtime

**Vue component red flags:**

- Components >300 lines
- Props drilling >3 levels
- Mixed local/global/derived state
- Weak prop types

**Reactive data red flags:**

- Deep reactive on large data
- Computed with side effects
- Watch for transformations
- Wrong ref/reactive usage

**General code smell red flags:**

- Methods >25 lines, classes doing too much (Bloaters)
- Complex switch/if chains, unused inherited methods (OO Abusers)
- One change = many file edits (Change Preventers)
- Dead code, excessive comments, lazy classes (Dispensables)
- Reaching into other objects' internals, long method chains (Couplers)

## Output format

```
## Review: [Component/Module]

### [Category]

#### [Issue]
- Severity: [Critical/Important/Minor]
- Location: file.ts:123
- Reference: [Link to checklist]
- Problem: [Explain]
- Fix: [Suggest]
```

## Best practices

**Be constructive:**

- Focus on maintainability not preferences
- Explain "why" behind each smell
- Provide concrete alternatives
- Recognize when rules should bend

**Be systematic:**

- Review one category at a time
- Use checklist for coverage
- Document patterns
- Track recurring issues

**Be pragmatic:**

- Not all items apply to every project
- Consider project maturity
- Balance idealism with reality
- Prioritize high-impact issues

## Code Smell Quick Reference

| Category | Key Focus | Goal | Common Refactorings |
| --- | --- | --- | --- |
| **Bloaters** | Size & Complexity | Extract Method / Class | Extract Method, Extract Class, Introduce Parameter Object |
| **OO Abusers** | Design Integrity | Use Polymorphism | Replace Conditional with Polymorphism, Replace Inheritance with Delegation |
| **Change Preventers** | Rigidity | Decouple / Organize | Move Method, Extract Class, Inline Class |
| **Dispensables** | Redundancy | Remove / Simplify | Inline Class, Remove Dead Code, Collapse Hierarchy |
| **Couplers** | Connectivity | Encapsulate / Move | Move Method, Hide Delegate, Remove Middle Man |
