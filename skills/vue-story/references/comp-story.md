# `compName.story.vue` Guide

## Purpose

Create **visual and behavioral contracts**, not parameter demonstrations. Stories ensure that important states and behaviors never regress.

## Core Principle

A Story represents ONE of the following:

1. **Canonical semantic state** - A stable, long-term design commitment
2. **State transition boundary** - Critical boundaries between internal states
3. **Edge case likely to regress** - Scenarios most likely to break
4. **Design-forbidden state** - Invalid states that must not be relied upon

Stories must be **readable without explanatory text**. If a Story needs explanation, it likely belongs in the documentation instead.

## Story Categories

Organize stories into these categories:

### Canonical (Required)

Stable, long-term design commitments. The "north star" states of your component.

```vue
<Story title="Primary Button" :layout="{ type: 'single' }">
  <InkButton text="Save Changes" variant="primary" />
</Story>

<Story title="Secondary Button">
  <InkButton text="Cancel" variant="secondary" />
</Story>
```

### State (Recommended)

Critical boundaries between internal states.

```vue
<Story title="Loading State">
  <InkButton text="Saving..." :loading="true" />
</Story>

<Story title="Disabled State">
  <InkButton text="Submit" :disabled="true" />
</Story>
```

### Edge (Recommended)

Scenarios most likely to break layout or behavior.

```vue
<Story title="Long Text Wrapping">
  <InkButton text="This is a very long button text that should wrap properly" />
</Story>

<Story title="With Very Small Container">
  <div style="width: 100px">
    <InkButton text="Click Me" />
  </div>
</Story>

<Story title="Rapid State Changes">
  <ButtonWithRapidToggle />
</Story>
```

### Invalid (Optional)

States that must not be relied upon. Use sparingly to document anti-patterns.

```vue
<Story title="❌ Both Loading and Disabled (Undefined)">
  <InkButton text="Invalid" :loading="true" :disabled="true" />
</Story>
```

## What Stories Are NOT

❌ **NOT for exhaustive prop combinations**
```vue
<!-- ❌ BAD: Testing every size/color combination -->
<Story title="All Combinations">
  <InkButton size="sm" variant="primary" />
  <InkButton size="sm" variant="secondary" />
  <InkButton size="sm" variant="danger" />
  <InkButton size="md" variant="primary" />
  <!-- ... 20 more permutations -->
</Story>
```

❌ **NOT a playground or sandbox**
```vue
<!-- ❌ BAD: Interactive playground -->
<Story title="Try It Out">
  <template #controls>
    <HstSelect v-model="variant" :options="allVariants" />
    <HstCheckbox v-model="disabled" />
    <HstText v-model="text" />
  </template>
</Story>
```

❌ **NOT for replacing documentation**
```vue
<!-- ❌ BAD: Stories need too much explanation -->
<Story title="Story 1">
  <!-- This story shows how the button behaves when... -->
  <InkButton />
</Story>
```

✅ **YES for semantic state contracts**
```vue
<!-- ✅ GOOD: Clear semantic meaning -->
<Story title="Primary Action">
  <InkButton text="Save Changes" variant="primary" />
</Story>

<Story title="Destructive Action">
  <InkButton text="Delete Account" variant="danger" />
</Story>
```

## Story Titles

Titles must be:
- **Descriptive** - Clearly convey what state is shown
- **Semantic** - Describe the meaning, not the props
- **Stable** - Won't change frequently with design updates

```vue
<!-- ✅ GOOD: Semantic, stable -->
<Story title="Primary Call-to-Action" />
<Story title="Loading State" />
<Story title="Error State" />

<!-- ❌ BAD: Implementation details -->
<Story title="variant=primary size=lg" />
<Story title="Test 1" />
<Story title="Blue Button" />
```

## Template Structure

```vue
<script setup lang="ts">
import { InkButton } from './InkButton';
</script>

<template>
  <Story
    group="canonical"
    title="Primary Button"
    :layout="{ type: 'single', width: '200px' }"
  >
    <InkButton text="Save Changes" variant="primary" />
  </Story>

  <Story group="state" title="Loading State">
    <InkButton text="Saving..." :loading="true" />
  </Story>

  <Story group="edge" title="Very Long Text">
    <InkButton text="This is a very long button text that might cause layout issues" />
  </Story>
</template>
```

## Layout Options

Use Histoire layout options appropriately:

```vue
<!-- Single component centered -->
<Story :layout="{ type: 'single', width: '400px' }">

<!-- Grid for comparing multiple states -->
<Story :layout="{ type: 'grid', width: '100%' }">
  <div>State 1</div>
  <div>State 2</div>
</Story>
```

## Interactive Stories for State Boundaries

When demonstrating state transitions:

```vue
<Story title="Loading State Transition">
  <template #default>
    <LoadingExample />
  </template>
</Story>

<!-- In separate component or script setup -->
<script setup>
import { ref } from 'vue';

const isLoading = ref(false);

function handleClick() {
  isLoading.value = true;
  setTimeout(() => {
    isLoading.value = false;
  }, 2000);
}
</script>

<template>
  <InkButton 
    text="Click to Load" 
    :loading="isLoading"
    @click="handleClick"
  />
</template>
```

## Minimal Checklist

Before committing a `*.story.vue`:

- [ ] At least one **canonical** variant exists
- [ ] At least one **state** or **edge** variant exists
- [ ] No exhaustive prop combinations are present
- [ ] All Story titles communicate semantic intent
- [ ] All Variants represent meaningful states (not just parameter variations)
- [ ] Stories are readable without needing explanation

## Common Patterns

### Comparing Related States

```vue
<Story group="state" title="Button States">
  <div class="flex gap-4">
    <InkButton text="Normal" />
    <InkButton text="Hover" class="hover" />
    <InkButton text="Active" class="active" />
    <InkButton text="Disabled" :disabled="true" />
  </div>
</Story>
```

### Container Constraints

```vue
<Story group="edge" title="Narrow Container">
  <div style="width: 200px; border: 1px dashed gray;">
    <InkButton text="Button in constrained space" />
  </div>
</Story>
```

### Dark Mode / Theme Variations

```vue
<Story title="Dark Theme" :layout="{ type: 'single' }">
  <div class="dark bg-gray-900 p-4">
    <InkButton text="Dark Mode Button" variant="primary" />
  </div>
</Story>
```

### Composition with Other Components

```vue
<Story group="canonical" title="In Button Group">
  <ButtonGroup>
    <InkButton text="Save" variant="primary" />
    <InkButton text="Cancel" />
  </ButtonGroup>
</Story>
```

## Restrictions

### Cannot Use Provide/Inject

Histoire stories run in isolation. If your component needs provided values:

**❌ This won't work in stories:**
```vue
<Story>
  <provide :value="someValue">
    <MyComponent />
  </provide>
</Story>
```

**✅ Use `histoire.setup.ts` instead:**
```typescript
// histoire.setup.ts
import { defineSetupVue3 } from '@histoire/plugin-vue';

export const setupVue3 = defineSetupVue3(({ app }) => {
  app.provide('theme', defaultTheme);
});
```

## Quality Standards

A good story file has:

- ✅ Clear category grouping (canonical, state, edge)
- ✅ Semantic, descriptive titles
- ✅ Coverage of critical states and boundaries
- ✅ No exhaustive prop matrices
- ✅ Stories that are self-explanatory
- ✅ Focused on long-term semantic contracts
- ❌ No redundant similar stories
- ❌ No stories that just demonstrate parameters
- ❌ No stories requiring extensive explanation

## References

- [Histoire Story API](https://histoire.dev/guide/vue3/stories.html)
- [Layout Options](https://histoire.dev/guide/vue3/stories.html#layout)
