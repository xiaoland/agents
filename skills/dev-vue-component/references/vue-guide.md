# `compName.vue` Guide

See [assets/compName.vue](../assets/compName.vue) for the starter template.

## Rules

### Script Setup

- Import props, emits, utils, types and constants from companion `.ts` file, keep only the clean business logic in script setup.
- Use `defineProps()` and `defineEmits()` with imported definitions
- Use `defineModel()` for v-model bindings (preferred over manual prop + emit)
- Organize code in sections: data, computed, methods, watchers, lifecycle, exposes
- Use type inference from imported definitions

### Internationalization

- **Never hard-code user-facing strings**
- Always use i18n for text: `{{ $t('component.label') }}`
- Extract all text to translation files

### Composables

- Leverage VueUse composables for common patterns:
  - `useVModel()` for v-model implementation
  - `useToggle()` for boolean state
  - `useEventListener()` for DOM events
  - `useDebounceFn()` for debounced functions
  - `useTemplateRef()` for template refs
- See [VueUse documentation](https://vueuse.org/) for full list

### Event Handlers

- Name handlers as `on<Element><Event>`:
  - `onButtonClick`
  - `onInputChange`
  - `onFormSubmit`
- Keep handlers focused and delegate to methods if complex

### Template Best Practices

- Use `<span>` instead of `<p>` for inline text
- Apply UnoCSS utility classes for simple layout/styling
- Use semantic HTML elements when appropriate
- Keep template logic simple - move complex logic to computed properties

### Internal Template Reuse

If a template pattern repeats within the same component (and won't be reused elsewhere):

```vue
<script setup lang="ts">
import { createReusableTemplate } from '@vueuse/core';

const [DefineTemplate, ReuseTemplate] = createReusableTemplate();
</script>

<template>
  <DefineTemplate v-slot="{ data, index }">
    <div>{{ data }} - {{ index }}</div>
  </DefineTemplate>

  <ReuseTemplate :data="item1" :index="0" />
  <ReuseTemplate :data="item2" :index="1" />
</template>
```

**Do NOT create a new component** for internal-only template reuse.

### Models

- Prefer `defineModel()` for cleaner v-model implementation:

  ```vue
  <script setup lang="ts">
  const model = defineModel<string>();
  // Usage: model.value = 'new value'
  </script>
  ```

- Use multiple models with names:

  ```vue
  <script setup lang="ts">
  const value = defineModel<string>('value');
  const open = defineModel<boolean>('open');
  </script>
  ```

### Expose

- Use `defineExpose()` only for imperative APIs consumers need
- Keep exposed surface area minimal
- Document exposed methods in `compName.ts`

## Common Patterns

### Controlled Component with VueUse

```vue
<script setup lang="ts">
import { useVModel } from '@vueuse/core';
import { compNameProps, compNameEmits } from './compName';

const props = defineProps(compNameProps);
const emit = defineEmits(compNameEmits);

const model = useVModel(props, 'modelValue', emit);

function onChange() {
  // model.value updates will automatically emit
  model.value = newValue;
}
</script>
```

### Toggle State

```vue
<script setup lang="ts">
import { useToggle } from '@vueuse/core';

const [isOpen, toggleOpen] = useToggle(false);
</script>

<template>
  <button @click="toggleOpen()">Toggle</button>
  <div v-if="isOpen">Content</div>
</template>
```

### Debounced Handler

```vue
<script setup lang="ts">
import { useDebounceFn } from '@vueuse/core';

const debouncedSearch = useDebounceFn((value: string) => {
  // Search logic
}, 300);
</script>

<template>
  <input @input="debouncedSearch($event.target.value)" />
</template>
```

### Template Ref

```vue
<script setup lang="ts">
import { useTemplateRef } from '@vueuse/core';

const inputRef = useTemplateRef<HTMLInputElement>('inputRef');

function focus() {
  inputRef.value?.focus();
}
</script>

<template>
  <input ref="inputRef" />
</template>
```

### Lifecycle Hooks

```vue
<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue';

onMounted(() => {
  // Setup logic
});

onUnmounted(() => {
  // Cleanup logic
});
</script>
```
