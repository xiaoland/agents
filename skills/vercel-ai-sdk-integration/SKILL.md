---
name: vercel-ai-sdk-integration
description: Integrate Vercel AI SDK v6 with Vue.js applications. Use when building chat interfaces, text completions, streaming responses, structured data generation, or tool calling with AI models. Covers Chat class, useCompletion, useObject composables, and server-side API routes with Nuxt.
license: Apache-2.0
compatibility: Vue 3, Nuxt 3, AI SDK v6 (@ai-sdk/vue ^2.x, ai ^6.x)
metadata:
  author: xiaoland
  version: "1.0"
---

# Vercel AI SDK v6 Integration for Vue.js

## When to use this skill

Use this skill when you need to:

- Build chat interfaces with streaming AI responses
- Implement text completion features
- Generate structured data (objects, arrays, enums) from AI models
- Create tool-calling agents with multi-step execution
- Set up Nuxt API routes for AI streaming
- Handle real-time UI updates during AI generation

## Installation

```bash
pnpm add ai @ai-sdk/vue zod
```

## Core Concepts

### AI SDK v6 Key Changes

1. **Chat class replaces useChat**: The `Chat` class is a composable holding reactive state
2. **Unified structured output**: Use `generateText`/`streamText` with `Output.object()` instead of deprecated `generateObject`/`streamObject`
3. **ToolLoopAgent**: Replaces `Experimental_Agent` with `instructions` parameter (was `system`)
4. **Async message conversion**: `convertToModelMessages()` is now async

### Framework Packages

| Package | Purpose |
|---------|---------|
| `ai` | Core SDK: `generateText`, `streamText`, `Output`, `tool` |
| `@ai-sdk/vue` | Vue composables: `Chat`, `useCompletion`, `useObject` |

## Instructions

### 1. Chat Interface

Use the `Chat` class for conversational AI:

```vue
<script setup lang="ts">
import { Chat } from "@ai-sdk/vue";
import { ref } from "vue";

const input = ref("");
const chat = new Chat({ api: "/api/chat" });

const handleSubmit = (e: Event) => {
  e.preventDefault();
  if (!input.value.trim()) return;
  chat.sendMessage({ text: input.value });
  input.value = "";
};
</script>

<template>
  <div class="chat-container">
    <div v-for="m in chat.messages" :key="m.id" :class="m.role">
      <template v-for="(part, i) in m.parts" :key="i">
        <p v-if="part.type === 'text'">{{ part.text }}</p>
      </template>
    </div>
    <form @submit="handleSubmit">
      <input v-model="input" placeholder="Type a message..." />
      <button type="submit" :disabled="chat.status === 'streaming'">
        Send
      </button>
    </form>
  </div>
</template>
```

**Chat class properties:**
- `messages`: Reactive message array with `id`, `role`, `parts`
- `status`: `'ready'` | `'submitted'` | `'streaming'` | `'error'`
- `error`: Error object or undefined
- `sendMessage({ text })`: Send user message
- `stop()`: Abort current stream
- `regenerate()`: Resend last assistant message

### 2. Text Completion

Use `useCompletion` for single-prompt completions:

```vue
<script setup lang="ts">
import { useCompletion } from "@ai-sdk/vue";

const { completion, complete, isLoading, error } = useCompletion({
  api: "/api/completion",
});

const generateSummary = async (text: string) => {
  await complete(`Summarize: ${text}`);
};
</script>
```

See [useCompletion reference](references/use-completion.md) for full API.

### 3. Structured Object Generation

Use `useObject` for streaming JSON objects:

```vue
<script setup lang="ts">
import { experimental_useObject as useObject } from "@ai-sdk/vue";
import { z } from "zod";

const recipeSchema = z.object({
  name: z.string(),
  ingredients: z.array(z.string()),
  steps: z.array(z.string()),
});

const { object, submit, isLoading } = useObject({
  api: "/api/recipe",
  schema: recipeSchema,
});
</script>

<template>
  <button @click="submit({ dish: 'pasta' })">Generate Recipe</button>
  <div v-if="object">
    <h2>{{ object.name }}</h2>
    <ul>
      <li v-for="ing in object.ingredients" :key="ing">{{ ing }}</li>
    </ul>
  </div>
</template>
```

### 4. Server-Side API Route (Nuxt)

Create `server/api/chat.ts`:

```typescript
import { streamText, convertToModelMessages, UIMessage } from "ai";
import { createOpenAI } from "@ai-sdk/openai";

export default defineLazyEventHandler(async () => {
  const openai = createOpenAI({
    apiKey: useRuntimeConfig().openaiApiKey,
  });

  return defineEventHandler(async (event) => {
    const { messages }: { messages: UIMessage[] } = await readBody(event);

    const result = streamText({
      model: openai("gpt-4o"),
      messages: await convertToModelMessages(messages),
    });

    return result.toUIMessageStreamResponse();
  });
});
```

See [api-routes.md](references/api-routes.md) for advanced patterns.

### 5. Structured Output with Tools

Generate structured data with tool calling:

```typescript
import { generateText, Output, tool } from "ai";
import { z } from "zod";

const weatherTool = tool({
  description: "Get current weather for a location",
  inputSchema: z.object({
    location: z.string().describe("City name"),
  }),
  execute: async ({ location }) => ({
    location,
    temperature: Math.floor(Math.random() * 30) + 10,
    condition: "sunny",
  }),
});

const { output, toolCalls } = await generateText({
  model: openai("gpt-4o"),
  tools: { weather: weatherTool },
  output: Output.object({
    schema: z.object({
      summary: z.string(),
      locations: z.array(z.object({
        city: z.string(),
        temp: z.number(),
      })),
    }),
  }),
  stopWhen: stepCountIs(5),
  prompt: "What's the weather in Paris and Tokyo?",
});
```

See [structured-output.md](references/structured-output.md) for Output API.

### 6. Multi-Step Agent

Create autonomous agents with tool loops:

```typescript
import { generateText, tool, stepCountIs } from "ai";

const { text, steps } = await generateText({
  model: openai("gpt-4o"),
  instructions: "You are a helpful research assistant.",
  tools: {
    search: searchTool,
    calculate: calculatorTool,
  },
  stopWhen: stepCountIs(10),
  prompt: "Research and calculate the average GDP of G7 countries",
});

// Access intermediate steps
for (const step of steps) {
  console.log(step.toolCalls, step.toolResults);
}
```

## Quality Checklist

Before completing AI SDK integration, verify:

- [ ] Using `Chat` class (not deprecated `useChat`)
- [ ] API routes use `convertToModelMessages()` with await
- [ ] Structured output uses `Output.object()` not `generateObject`
- [ ] Tool schemas use Zod with `.describe()` for better accuracy
- [ ] Error handling with `onError` callbacks
- [ ] Loading states bound to `status` or `isLoading`
- [ ] Streaming responses use `toUIMessageStreamResponse()`

## Best Practices

**State Management:**
- Keep Chat instance at component level or in Pinia store
- Use `chat.status` for UI state, not separate loading refs
- Handle errors via `chat.error` or `onError` callback

**Performance:**
- Use `streamText` for interactive UIs (immediate feedback)
- Use `generateText` for background tasks (automation, agents)
- Set appropriate `stopWhen` for multi-step tools

**Type Safety:**
- Define Zod schemas with explicit descriptions
- Export schema types for component props
- Use `Output.object({ name, description })` for provider hints

---

**References:**
- [api-routes.md](references/api-routes.md) - Server-side streaming patterns
- [structured-output.md](references/structured-output.md) - Output API reference
- [use-completion.md](references/use-completion.md) - useCompletion API
- [tool-calling.md](references/tool-calling.md) - Tool definition patterns

**Assets:**
- [chat-component.vue](assets/chat-component.vue) - Complete chat UI
- [api-chat.ts](assets/api-chat.ts) - Nuxt API route template
- [structured-agent.ts](assets/structured-agent.ts) - Agent with tools
