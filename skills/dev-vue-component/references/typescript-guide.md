# `compName.ts` Guide

## Purpose

Define the public interface (props, emits, types) that consumers use to interact with the component. Reading this file enables users to understand how to use the component.

## Template

See [assets/compName.ts](../assets/compName.ts) for the starter template.

## Rules

### Props Definition

- Use utility functions from `@/utils/props`:
  - `makeStringProp<UnionType>(defaultValue)`
  - `makeBooleanProp(defaultValue)`
  - `makeNumberProp(defaultValue)`
  - `makeArrayProp<ItemType>()`
- For complex types, use `PropType` generic:

  ```typescript
  data: {
    type: Object as PropType<MyInterface>,
    required: true,
  }
  ```

- Always add JSDoc comments describing what each prop does
- Provide sensible defaults for optional props
- Use TypeScript union types for enums: `makeStringProp<"a" | "b" | "c">("a")`

### Emits Definition

- Define emits as an object with validator functions
- Always add JSDoc comments describing when emit fires
- Type the parameters: `eventName: (param: Type) => true`
- Return `true` from validator (required by Vue)

### Type Exports

- Export all interfaces and types consumers need
- Export constants that consumers might use
- Keep internal types private (don't export)

### Utilities

- Export helper functions related to the component
- Add JSDoc comments for all exported utilities
- Keep utilities focused on component-specific logic

## Best Practices

### Models vs Props

- If data is mutable (object, array) AND component is stateless → use **prop**
- If data needs two-way binding → use **model** with `defineModel` in `.vue` file
- Example when to use prop:

  ```typescript
  // Component just displays, doesn't modify
  options: {
    type: Array as PropType<Option[]>,
    required: true,
  }
  ```

### Type Safety

- Avoid `any` and `unknown` - always specify concrete types
- Use discriminated unions for complex state:

  ```typescript
  export type LoadingState = 
    | { status: "idle" }
    | { status: "loading" }
    | { status: "error"; message: string }
    | { status: "success"; data: Data };
  ```

### Constants

- Define magic strings/numbers as exported constants
- Use `as const` for literal type arrays
- Group related constants together

## Common Patterns

### Optional Prop with Union Type

```typescript
size: makeStringProp<"sm" | "md" | "lg">("md"),
```

### Required Complex Object

```typescript
config: {
  type: Object as PropType<ComponentConfig>,
  required: true,
}
```

### Array Prop

```typescript
items: {
  type: Array as PropType<Item[]>,
  default: () => [],
}
```

### Function Prop

```typescript
formatter: {
  type: Function as PropType<(value: string) => string>,
  default: (v: string) => v,
}
```

### Emit with Multiple Parameters

```typescript
export const compNameEmits = {
  change: (newValue: string, oldValue: string) => true,
  update: (id: number, data: Partial<Data>) => true,
};
```
