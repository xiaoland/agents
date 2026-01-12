# useObject Reference

Vue composable for streaming JSON objects with schema validation.

**Use for:** Real-time structured data, streaming forms, progressive UI updates.

---

## Basic Usage

```vue
<script setup lang="ts">
import { experimental_useObject as useObject } from "@ai-sdk/vue";
import { z } from "zod";

const recipeSchema = z.object({
  name: z.string(),
  ingredients: z.array(z.string()),
  steps: z.array(z.string()),
});

const { object, submit, isLoading, error } = useObject({
  api: "/api/recipe",
  schema: recipeSchema,
});
</script>

<template>
  <button @click="submit({ dish: 'pasta' })" :disabled="isLoading">
    Generate Recipe
  </button>

  <div v-if="object">
    <h2>{{ object.name }}</h2>
    <ul>
      <li v-for="ing in object.ingredients" :key="ing">{{ ing }}</li>
    </ul>
  </div>
</template>
```

---

## Parameters

**api** (string, required)
Endpoint URL that streams JSON.

**schema** (Zod schema, required)
Defines expected object structure.

**id** (string, optional)
Unique identifier for shared state across components.

**initialValue** (object, optional)
Starting value before streaming begins.

**headers** (object, optional)
Custom request headers.

**credentials** (string, optional)
Fetch credentials mode.

**onError** ((error) => void, optional)
Called on stream error.

**onFinish** ((result) => void, optional)
Called when streaming completes.

---

## Return Values

**object** (reactive, partial)
Current streamed object. Updates incrementally as data arrives.
Type is `DeepPartial<Schema>` — fields may be undefined during streaming.

**submit** ((input) => void)
Trigger generation with input data sent as JSON body.

**isLoading** (boolean)
True while request is in progress.

**error** (Error | undefined)
Error object if request failed.

**stop** (() => void)
Abort current request.

**clear** (() => void)
Reset object to undefined.

---

## Progressive Rendering

Object updates incrementally. Handle partial state:

```vue
<template>
  <!-- Check each field before rendering -->
  <h2 v-if="object?.name">{{ object.name }}</h2>

  <!-- Arrays may be partial -->
  <ul v-if="object?.ingredients?.length">
    <li v-for="ing in object.ingredients" :key="ing">{{ ing }}</li>
  </ul>

  <!-- Show placeholder while loading -->
  <div v-else-if="isLoading">Loading...</div>
</template>
```

---

## Schema Best Practices

Add `.describe()` to improve generation accuracy:

```typescript
const schema = z.object({
  title: z.string().describe("Article title, max 60 characters"),
  summary: z.string().describe("2-3 sentence summary"),
  tags: z.array(z.string()).describe("3-5 relevant keywords"),
});
```

---

## Nested Objects

```typescript
const schema = z.object({
  user: z.object({
    name: z.string(),
    email: z.string().email(),
  }),
  preferences: z.object({
    theme: z.enum(["light", "dark"]),
    notifications: z.boolean(),
  }),
});
```

---

## Type Inference

Extract TypeScript types from schema:

```typescript
const recipeSchema = z.object({
  name: z.string(),
  ingredients: z.array(z.string()),
});

type Recipe = z.infer<typeof recipeSchema>;

// Use in props
defineProps<{ recipe: Recipe }>();
```

---

## Error Handling

```vue
<script setup lang="ts">
const { object, submit, error, isLoading } = useObject({
  api: "/api/generate",
  schema,
  onError: (err) => {
    console.error("Generation failed:", err);
  },
});
</script>

<template>
  <div v-if="error" class="error">
    {{ error.message }}
  </div>
</template>
```

---

## Anti-patterns

```typescript
// WRONG: Assuming object is complete
<h2>{{ object.name }}</h2> // ❌ May be undefined during streaming

// CORRECT: Optional chaining
<h2 v-if="object?.name">{{ object.name }}</h2> // ✓
```

```typescript
// WRONG: Schema without descriptions
z.object({
  x: z.string(),
  y: z.number(),
}); // ❌ Model guesses meaning

// CORRECT: Explicit descriptions
z.object({
  x: z.string().describe("Product name"),
  y: z.number().describe("Price in USD"),
}); // ✓
```
