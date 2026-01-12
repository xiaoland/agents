# useCompletion Reference

Vue composable for single-prompt text completions with streaming.

**Use for:** Summaries, translations, one-shot generation.
**Do NOT use for:** Multi-turn conversations (use `Chat` class instead).

---

## Basic Usage

```vue
<script setup lang="ts">
import { useCompletion } from "@ai-sdk/vue";

const { completion, complete, isLoading, error } = useCompletion({
  api: "/api/completion",
});

const summarize = () => {
  complete("Summarize the key points of Vue 3 composition API");
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
Endpoint URL.

**id** (string, optional)
Unique identifier. Same ID shares state across components.

**initialInput** (string, optional)
Starting input value.

**initialCompletion** (string, optional)
Starting completion value.

**headers** (object, optional)
Custom request headers.

**body** (object, optional)
Additional request body data.

**credentials** (string, default: `"same-origin"`)
Fetch credentials mode.

**streamProtocol** (`"text"` | `"data"`, default: `"data"`)
Stream format.

**onFinish** ((result) => void, optional)
Called when stream completes.

**onError** ((error) => void, optional)
Called on stream error.

---

## Return Values

**completion** (Ref\<string\>)
Current generated text.

**complete** ((prompt: string) => Promise\<string\>)
Execute completion with prompt.

**error** (Ref\<Error | undefined\>)
Error object.

**isLoading** (Ref\<boolean\>)
Request in progress.

**stop** (() => void)
Abort current request.

**input** (Ref\<string\>)
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

## Form Pattern

```vue
<script setup lang="ts">
import { useCompletion } from "@ai-sdk/vue";

const {
  completion,
  input,
  handleInputChange,
  handleSubmit,
  isLoading,
} = useCompletion({ api: "/api/completion" });
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
  <div>{{ completion }}</div>
</template>
```

---

## Callbacks

```vue
<script setup lang="ts">
const { completion, complete } = useCompletion({
  api: "/api/completion",
  onFinish: (result) => {
    console.log("Done:", result);
    saveToHistory(result);
  },
  onError: (error) => {
    console.error("Failed:", error);
  },
});
</script>
```

---

## Shared State

Use same `id` to share across components:

```vue
<!-- Input.vue -->
<script setup lang="ts">
const { complete, isLoading } = useCompletion({
  id: "shared",
  api: "/api/completion",
});
</script>

<!-- Output.vue -->
<script setup lang="ts">
const { completion } = useCompletion({
  id: "shared",
  api: "/api/completion",
});
</script>
```

---

## Anti-patterns

```typescript
// WRONG: Using for conversation
complete("User: Hello\nAssistant:"); // ❌ No memory

// CORRECT: Use Chat for conversations
const chat = new Chat({ api: "/api/chat" });
chat.sendMessage({ text: "Hello" }); // ✓
```
