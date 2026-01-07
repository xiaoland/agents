---
name: pinia
description: Create and maintain Pinia stores using Setup Stores pattern with TypeScript. Use when creating state management stores, defining store state/getters/actions, composing stores, or integrating with Vue components. Handles store architecture, type safety, and reactive state patterns.
license: Apache-2.0
compatibility: Requires Vue 3, Pinia, TypeScript
metadata:
  author: xiaoland
  version: "1.0"
---

# Developing Pinia Stores

## When to use this skill

Use this skill when you need to:

- Create new Pinia stores for state management
- Define store state, getters, and actions
- Compose multiple stores together
- Integrate stores with Vue components
- Handle async operations in stores
- Refactor stores for better type safety or structure

## Store File Structure

- `storeName.ts`: Store definition with state, getters, and actions
- Place stores in `stores/` directory (e.g., `stores/user.ts`, `stores/cart.ts`)
- Use `use<Name>Store` naming convention (e.g., `useUserStore`, `useCartStore`)

## Instructions

### Creating a New Store

Follow these steps to create a new Pinia store:

1. **Create store file**: `stores/storeName.ts`

2. **Define the store** using Setup Store pattern:
   - Import `defineStore` from Pinia
   - Import `ref`, `computed` from Vue
   - Define state as `ref()` values
   - Define getters as `computed()` properties
   - Define actions as plain functions
   - Return all public state, getters, and actions
   - See [setup-stores.md](references/setup-stores.md) for patterns

3. **Add TypeScript types**:
   - Type all state refs explicitly
   - Let TypeScript infer computed types when possible
   - Type action parameters and return values
   - See [typescript.md](references/typescript.md) for patterns

4. **Handle async operations** (if needed):
   - Add loading/error state refs
   - Use try/catch/finally in async actions
   - Clean up state appropriately

### Modifying an Existing Store

1. **Understand current state**:
   - Review existing state, getters, and actions
   - Identify dependencies on other stores

2. **Make changes**:
   - Add/modify state refs as needed
   - Update getters if derived state changes
   - Update actions for new behavior
   - Ensure all new exports are returned

3. **Update consumers**:
   - Check components using the store
   - Update destructuring if new state/actions added
   - Verify reactivity is preserved

### Using Stores in Components

```vue
<script setup lang="ts">
import { useCounterStore } from '@/stores/counter'
import { storeToRefs } from 'pinia'

const store = useCounterStore()

// Destructure reactive state/getters with storeToRefs
const { count, doubleCount } = storeToRefs(store)

// Actions can be destructured directly
const { increment, reset } = store
</script>
```

### Quality Checklist

Before completing work on any store, verify:

- [ ] Store uses Setup Store pattern (not Options API)
- [ ] All state is typed explicitly
- [ ] Getters use `computed()` for reactivity
- [ ] Async actions have loading/error handling
- [ ] No circular dependencies between stores
- [ ] Store is properly exported and named (`use<Name>Store`)
- [ ] Components use `storeToRefs()` for destructuring state

## Best Practices

**Naming**:

- Store IDs: lowercase with hyphens (`'user-settings'`)
- Store functions: `use<Name>Store` pattern (`useUserSettingsStore`)
- State: descriptive nouns (`items`, `currentUser`, `isLoading`)
- Getters: descriptive, often prefixed with `is`/`has`/`get` (`isLoggedIn`, `totalItems`)
- Actions: verbs describing the action (`fetchUser`, `addItem`, `reset`)

**State Management**:

- Keep stores focused on a single domain
- Prefer multiple small stores over one large store
- Use `shallowRef()` for large objects that don't need deep reactivity
- Initialize state with sensible defaults

**Composition**:

- Access other stores inside actions/getters, not at setup level
- Avoid circular dependencies between stores
- Use composables for shared logic
- See [composables.md](references/composables.md) for patterns

**Type Safety**:

- Always type state refs explicitly
- Export store return type for consumers
- Avoid `any` and `unknown` types
- See [typescript.md](references/typescript.md) for patterns

---

**Note**:

- For detailed patterns and examples, consult the reference documentation in the `references/` directory.
- Starter template is available in the `assets/` directory.
