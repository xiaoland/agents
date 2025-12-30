# CompName

Brief one-sentence description of the problem this component solves.

## Rationale

Why this component exists. When to use it and when NOT to use it.

## Design Semantics

### Concepts

- **ConceptA**: One-sentence definition
- **ConceptB**: One-sentence definition

### Visual / UX Meaning

Explain the semantic differences between states/variants and what users perceive.

## Canonical Examples

- **Default**: Normal usage
  ```vue
  <CompName />
  ```

- **With props**: Configured usage
  ```vue
  <CompName variant="primary" :data="data" />
  ```

## Behavioral Contract

- In `loading` state:
  - [guarantee 1]
  - [guarantee 2]

- Never [anti-guarantee]
- Always [guarantee]

## Extension & Composition

- Can be composed with:
  - `ComponentA` for [purpose]
  - `ComponentB` for [purpose]

- NOT recommended:
  - [anti-pattern]

## Non-Goals

- [Out of scope item 1]
- [Out of scope item 2]

## Implementation Notes

- [Note for maintainers if relevant]
