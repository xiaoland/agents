# useCompletion Reference

Vue composable for single-prompt text completions with streaming.

**Use for:** Single prompts, summaries, translations, one-shot generation.
**Do NOT use for:** Multi-turn conversations (use `Chat` class instead).

---

## Basic Usage

```vue
<script setup lang="ts">
import { useCompletion } from "@ai-sdk/vue";

const { completion, complete, isLoading, error } = useCompletion({
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

---

## Parameters

**api** (string, default: `/api/completion`)
Endpoint URL for generation.

**id** (string, default: random)
Unique identifier. Use same ID across components to share state.

**initialInput** (string)
Starting input value.

**initialCompletion** (string)
Starting completion value.

**headers** (Record<string, string>)
Custom request headers.

**body** (object)
Additional request body data.

**credentials** (RequestCredentials, default: `"same-origin"`)
Fetch credentials mode.

**streamProtocol** (`"text"` | `"data"`, default: `"data"`)
Stream format.

**onFinish** ((result) => void)
Called when stream completes.

**onError** ((error) => void)
Called on stream error.

**fetch** (typeof fetch)
Custom fetch function.

---

## Return Values

**completion** (Ref<string>)
Current generated text.

**complete** ((prompt: string) => Promise<string>)
Execute completion with prompt.

**error** (Ref<Error | undefined>)
Error object.

**isLoading** (Ref<boolean>)
Request in progress.

**stop** (() => void)
Abort current request.

**input** (Ref<string>)
Current input value.

**setInput** ((value: string) => void)
Update input.

**setCompletion** ((value: string) => void)
Update completion.

**handleInputChange** ((e: Event) => void)
Input onChange handler.

**handleSubmit** ((e: Event) => void)
Form submit handler.

---

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

---

## With Callbacks

```vue
<script setup lang="ts">
import { useCompletion } from "@ai-sdk/vue";

const { completion, complete } = useCompletion({
  api: "/api/completion",
  onFinish: (result) => {
    console.log("Completed:", result);
    saveToHistory(result);
  },
  onError: (error) => {
    console.error("Failed:", error);
    showNotification("Generation failed");
  },
});
</script>
```

---

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

---

## Server Route

Create `server/api/completion.ts`:

```typescript
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

**Note:** Use `toTextStreamResponse()` for completion, not `toUIMessageStreamResponse()`.

---

## Anti-patterns

```typescript
// WRONG: Using useCompletion for chat
const { complete } = useCompletion();
complete("User: Hello\nAssistant:"); // ❌ No conversation memory

// CORRECT: Use Chat class for conversations
import { Chat } from "@ai-sdk/vue";
const chat = new Chat({ api: "/api/chat" });
chat.sendMessage({ text: "Hello" }); // ✓
```

```typescript
// WRONG: Using toUIMessageStreamResponse for completion
return result.toUIMessageStreamResponse(); // ❌ Wrong format

// CORRECT: Use toTextStreamResponse
return result.toTextStreamResponse(); // ✓
```
