---
name: vercel-ai-sdk-integration
description: Integrate Vercel AI SDK v6 with Vue.js applications (client-side). Use when building chat interfaces, text completions, or streaming structured data with AI models. Covers Chat class, useCompletion, useObject composables.
license: Apache-2.0
compatibility: Vue 3, AI SDK v6 (@ai-sdk/vue ^2.x)
metadata:
  author: xiaoland
  version: "1.2"
---

# Vercel AI SDK v6 for Vue.js (Client-Side)

## Critical: SDK v6 Breaking Changes

**NEVER use these deprecated patterns:**
- `useChat()` composable → Use `new Chat()` class instead
- `generateObject()` / `streamObject()` → Use `generateText()` / `streamText()` with `output` parameter

## Decision Framework

**For multi-turn chat:** Use `Chat` class. See [chat.md](references/chat.md)

**For single-prompt completion:** Use `useCompletion`. See [use-completion.md](references/use-completion.md)

**For streaming JSON objects:** Use `useObject`. See [use-object.md](references/use-object.md)

## Installation

```bash
pnpm add @ai-sdk/vue zod
```

## Quick Start

### Chat

```vue
<script setup lang="ts">
import { Chat } from "@ai-sdk/vue";
import { ref } from "vue";

const input = ref("");
const chat = new Chat({ api: "/api/chat" });

const send = () => {
  chat.sendMessage({ text: input.value });
  input.value = "";
};
</script>

<template>
  <div v-for="m in chat.messages" :key="m.id">
    <p v-for="(part, i) in m.parts" :key="i">
      <span v-if="part.type === 'text'">{{ part.text }}</span>
    </p>
  </div>
  <input v-model="input" @keyup.enter="send" />
</template>
```

### Completion

```vue
<script setup lang="ts">
import { useCompletion } from "@ai-sdk/vue";

const { completion, complete, isLoading } = useCompletion({ api: "/api/completion" });
</script>

<template>
  <button @click="complete('Summarize Vue 3')" :disabled="isLoading">Go</button>
  <p>{{ completion }}</p>
</template>
```

### Streaming Objects

```vue
<script setup lang="ts">
import { experimental_useObject as useObject } from "@ai-sdk/vue";
import { z } from "zod";

const { object, submit } = useObject({
  api: "/api/recipe",
  schema: z.object({ name: z.string(), steps: z.array(z.string()) }),
});
</script>

<template>
  <button @click="submit({ dish: 'pasta' })">Generate</button>
  <pre>{{ object }}</pre>
</template>
```

## Anti-patterns

```typescript
// WRONG: Deprecated useChat
import { useChat } from "@ai-sdk/vue"; // ❌

// CORRECT: Chat class
import { Chat } from "@ai-sdk/vue";
const chat = new Chat({ api: "/api/chat" }); // ✓
```

```typescript
// WRONG: Separate loading state
const isLoading = ref(false); // ❌

// CORRECT: Use chat.status
<button :disabled="chat.status === 'streaming'">Send</button> // ✓
```

## References

- [chat.md](references/chat.md) — Chat class API, messages, status, methods
- [use-completion.md](references/use-completion.md) — Single-prompt text generation
- [use-object.md](references/use-object.md) — Streaming JSON objects with schemas

## Assets

- [chat-component.vue](assets/chat-component.vue) — Complete chat UI template
