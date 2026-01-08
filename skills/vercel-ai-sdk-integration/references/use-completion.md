# useCompletion Reference

Vue composable for text completions with streaming.

## Import

```typescript
import { useCompletion } from "@ai-sdk/vue";
```

## Basic Usage

```vue
<script setup lang="ts">
import { useCompletion } from "@ai-sdk/vue";

const {
  completion,
  complete,
  isLoading,
  error,
  stop,
} = useCompletion({
  api: "/api/completion",
});

const summarize = async () => {
  await complete("Summarize the key points of Vue 3 composition API");
};
</script>

<template>
  <button @click="summarize" :disabled="isLoading">
    {{ isLoading ? "Generating..." : "Summarize" }}
  </button>
  <p v-if="error">Error: {{ error.message }}</p>
  <div v-if="completion">{{ completion }}</div>
</template>
```

## Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `api` | `string` | `/api/completion` | Endpoint URL |
| `id` | `string` | random | Unique identifier for shared state |
| `initialInput` | `string` | `""` | Starting input value |
| `initialCompletion` | `string` | `""` | Starting completion value |
| `headers` | `Record<string, string>` | `{}` | Custom request headers |
| `body` | `object` | `{}` | Additional request body data |
| `credentials` | `RequestCredentials` | `"same-origin"` | Fetch credentials mode |
| `streamProtocol` | `"text" \| "data"` | `"data"` | Stream format |
| `onFinish` | `(result) => void` | - | Called when stream completes |
| `onError` | `(error) => void` | - | Called on stream error |
| `fetch` | `typeof fetch` | global | Custom fetch function |

## Return Values

| Property | Type | Description |
|----------|------|-------------|
| `completion` | `Ref<string>` | Current generated text |
| `complete` | `(prompt: string) => Promise<string>` | Execute completion |
| `error` | `Ref<Error \| undefined>` | Error object |
| `isLoading` | `Ref<boolean>` | Request in progress |
| `stop` | `() => void` | Abort current request |
| `input` | `Ref<string>` | Current input value |
| `setInput` | `(value: string) => void` | Update input |
| `setCompletion` | `(value: string) => void` | Update completion |
| `handleInputChange` | `(e: Event) => void` | Input event handler |
| `handleSubmit` | `(e: Event) => void` | Form submit handler |

## With Form Input

```vue
<script setup lang="ts">
import { useCompletion } from "@ai-sdk/vue";

const {
  completion,
  input,
  handleInputChange,
  handleSubmit,
  isLoading,
} = useCompletion({
  api: "/api/completion",
});
</script>

<template>
  <form @submit="handleSubmit">
    <textarea
      :value="input"
      @input="handleInputChange"
      placeholder="Enter prompt..."
    />
    <button type="submit" :disabled="isLoading">Generate</button>
  </form>
  <div class="result">{{ completion }}</div>
</template>
```

## With Callbacks

```vue
<script setup lang="ts">
import { useCompletion } from "@ai-sdk/vue";

const { completion, complete } = useCompletion({
  api: "/api/completion",
  onFinish: (result) => {
    console.log("Completed:", result);
    // Save to history, analytics, etc.
  },
  onError: (error) => {
    console.error("Failed:", error);
    // Show notification, retry logic, etc.
  },
});
</script>
```

## With Additional Body Data

```vue
<script setup lang="ts">
import { ref } from "vue";
import { useCompletion } from "@ai-sdk/vue";

const temperature = ref(0.7);
const maxTokens = ref(500);

const { completion, complete } = useCompletion({
  api: "/api/completion",
  body: {
    temperature: temperature.value,
    maxTokens: maxTokens.value,
  },
});
</script>
```

## Shared State Across Components

Use the same `id` to share completion state:

```vue
<!-- ComponentA.vue -->
<script setup lang="ts">
import { useCompletion } from "@ai-sdk/vue";

const { complete, isLoading } = useCompletion({
  id: "shared-completion",
  api: "/api/completion",
});
</script>

<!-- ComponentB.vue -->
<script setup lang="ts">
import { useCompletion } from "@ai-sdk/vue";

// Same id = same state
const { completion } = useCompletion({
  id: "shared-completion",
  api: "/api/completion",
});
</script>
```

## Server Route

```typescript
// server/api/completion.ts
import { streamText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";

export default defineLazyEventHandler(async () => {
  const openai = createOpenAI({
    apiKey: useRuntimeConfig().openaiApiKey,
  });

  return defineEventHandler(async (event) => {
    const { prompt } = await readBody(event);

    const result = streamText({
      model: openai("gpt-4o"),
      prompt,
    });

    return result.toTextStreamResponse();
  });
});
```
