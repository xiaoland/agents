---
name: vercel-ai-sdk-integration
description: Integrate Vercel AI SDK v6 with Vue.js applications. Use when building chat interfaces, text completions, streaming responses, structured data generation, or tool calling with AI models. Covers Chat class, useCompletion, useObject composables, and server-side API routes with Nuxt.
license: Apache-2.0
compatibility: Vue 3, Nuxt 3, AI SDK v6 (@ai-sdk/vue ^2.x, ai ^6.x)
metadata:
  author: xiaoland
  version: "1.1"
---

# Vercel AI SDK v6 for Vue.js

## Critical: SDK v6 Breaking Changes

**NEVER use these deprecated patterns:**
- `useChat()` composable → Use `new Chat()` class instead
- `generateObject()` / `streamObject()` → Use `generateText()` / `streamText()` with `output` parameter
- `convertToModelMessages(messages)` sync → **ALWAYS await** `await convertToModelMessages(messages)`
- `Experimental_Agent` with `system` param → Use `ToolLoopAgent` with `instructions` param

## Decision Framework: Which API to Use

**For conversational chat UI:**
Use `Chat` class from `@ai-sdk/vue`. Provides reactive `messages`, `status`, `sendMessage()`.

**For single-prompt text generation:**
- Interactive UI needing immediate feedback → `useCompletion` composable
- Background automation task → `generateText()` on server

**For structured data (JSON objects/arrays):**
- Streaming partial objects to UI → `useObject` composable
- Server-side generation → `generateText({ output: Output.object() })`

**For multi-step tool-calling agents:**
Use `generateText()` or `streamText()` with `tools` and `stopWhen: stepCountIs(N)`.

---

## Installation

```bash
pnpm add ai @ai-sdk/vue zod
```

Packages:
- `ai` — Core SDK: `generateText`, `streamText`, `Output`, `tool`, `convertToModelMessages`
- `@ai-sdk/vue` — Vue composables: `Chat`, `useCompletion`, `useObject`

---

## 1. Chat Interface with Chat Class

Use `Chat` for multi-turn conversations with streaming.

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
  <div v-for="m in chat.messages" :key="m.id" :class="m.role">
    <template v-for="(part, i) in m.parts" :key="i">
      <p v-if="part.type === 'text'">{{ part.text }}</p>
    </template>
  </div>
  <form @submit="handleSubmit">
    <input v-model="input" :disabled="chat.status === 'streaming'" />
    <button type="submit">Send</button>
  </form>
</template>
```

**Chat class API:**
- `chat.messages` — Reactive array of `{ id, role, parts }`
- `chat.status` — `'ready'` | `'submitted'` | `'streaming'` | `'error'`
- `chat.error` — Error object when status is `'error'`
- `chat.sendMessage({ text })` — Send user message
- `chat.stop()` — Abort current stream
- `chat.regenerate()` — Resend last assistant message

### Anti-patterns to Avoid

```typescript
// WRONG: Using deprecated useChat
import { useChat } from "@ai-sdk/vue";
const { messages } = useChat(); // ❌ Deprecated

// CORRECT: Use Chat class
import { Chat } from "@ai-sdk/vue";
const chat = new Chat({ api: "/api/chat" }); // ✓
```

```typescript
// WRONG: Creating separate loading ref
const isLoading = ref(false);
isLoading.value = true;
chat.sendMessage({ text });

// CORRECT: Use chat.status directly
<button :disabled="chat.status === 'streaming'">Send</button>
```

---

## 2. Server API Route (Nuxt)

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
      messages: await convertToModelMessages(messages), // MUST await
    });

    return result.toUIMessageStreamResponse();
  });
});
```

**Critical:** Always `await convertToModelMessages()`. It is async in v6.

### Anti-patterns to Avoid

```typescript
// WRONG: Missing await
const result = streamText({
  messages: convertToModelMessages(messages), // ❌ Returns Promise
});

// CORRECT: Await the conversion
const result = streamText({
  messages: await convertToModelMessages(messages), // ✓
});
```

```typescript
// WRONG: Using toTextStreamResponse for chat
return result.toTextStreamResponse(); // ❌ Loses message structure

// CORRECT: Use toUIMessageStreamResponse for chat
return result.toUIMessageStreamResponse(); // ✓ Preserves UIMessage format
```

See [api-routes.md](references/api-routes.md) for provider examples (Anthropic, Google, Gateway).

---

## 3. Structured Output

Generate typed objects using `Output.object()` with `generateText` or `streamText`.

**NEVER use deprecated `generateObject()` or `streamObject()`.**

### Server-side structured generation

```typescript
import { generateText, Output } from "ai";
import { z } from "zod";

const recipeSchema = z.object({
  name: z.string().describe("Recipe name"),
  ingredients: z.array(z.string()).describe("List of ingredients"),
  steps: z.array(z.string()).describe("Cooking steps"),
});

const { output } = await generateText({
  model: openai("gpt-4o"),
  output: Output.object({
    schema: recipeSchema,
    name: "Recipe",
    description: "A cooking recipe",
  }),
  prompt: "Create a pasta recipe",
});
// output is typed as { name: string, ingredients: string[], steps: string[] }
```

### Client-side streaming objects

Use `useObject` for real-time partial object streaming:

```vue
<script setup lang="ts">
import { experimental_useObject as useObject } from "@ai-sdk/vue";
import { z } from "zod";

const schema = z.object({
  title: z.string(),
  points: z.array(z.string()),
});

const { object, submit, isLoading } = useObject({
  api: "/api/outline",
  schema,
});
</script>

<template>
  <button @click="submit({ topic: 'Vue 3' })">Generate</button>
  <h2 v-if="object?.title">{{ object.title }}</h2>
  <ul v-if="object?.points">
    <li v-for="p in object.points" :key="p">{{ p }}</li>
  </ul>
</template>
```

### Output type options

- `Output.object({ schema })` — Typed object matching Zod schema
- `Output.array({ element })` — Array of typed elements
- `Output.choice({ options: ['a', 'b', 'c'] })` — Classification to specific values
- `Output.json()` — Unstructured JSON (no validation)
- `Output.text()` — Plain text (default)

### Anti-patterns to Avoid

```typescript
// WRONG: Using deprecated generateObject
import { generateObject } from "ai";
const { object } = await generateObject({ schema }); // ❌ Deprecated

// CORRECT: Use generateText with output
import { generateText, Output } from "ai";
const { output } = await generateText({
  output: Output.object({ schema }),
}); // ✓
```

```typescript
// WRONG: Schema without descriptions
const schema = z.object({
  x: z.string(),
  y: z.number(),
}); // ❌ Model lacks context

// CORRECT: Add .describe() for accuracy
const schema = z.object({
  x: z.string().describe("The product name"),
  y: z.number().describe("Price in USD"),
}); // ✓
```

See [structured-output.md](references/structured-output.md) for complete API.

---

## 4. Tool Calling

Define tools with `tool()` and use with `generateText` or `streamText`.

```typescript
import { generateText, tool, stepCountIs } from "ai";
import { z } from "zod";

const weatherTool = tool({
  description: "Get weather for a city",
  inputSchema: z.object({
    city: z.string().describe("City name"),
  }),
  execute: async ({ city }) => ({
    city,
    temp: 22,
    condition: "sunny",
  }),
});

const { text, steps } = await generateText({
  model: openai("gpt-4o"),
  tools: { weather: weatherTool },
  stopWhen: stepCountIs(5),
  prompt: "What's the weather in Tokyo?",
});
```

**Tool definition requires:**
- `description` — Guides model on when to use the tool
- `inputSchema` — Zod schema for parameters (add `.describe()` to each field)
- `execute` — Async function receiving validated inputs

**Multi-step execution:**
Set `stopWhen: stepCountIs(N)` to enable automatic tool loops. The model calls tools until done or N steps reached.

### Anti-patterns to Avoid

```typescript
// WRONG: Missing stopWhen for tools
const { text } = await generateText({
  tools: { search: searchTool },
  prompt: "Research Vue.js",
}); // ❌ Only one tool call

// CORRECT: Enable multi-step with stopWhen
const { text, steps } = await generateText({
  tools: { search: searchTool },
  stopWhen: stepCountIs(10),
  prompt: "Research Vue.js",
}); // ✓ Multiple tool calls until done
```

```typescript
// WRONG: Using 'system' parameter (v5)
const agent = new Experimental_Agent({
  system: "You are helpful", // ❌ Deprecated
});

// CORRECT: Use 'instructions' parameter (v6)
const { text } = await generateText({
  instructions: "You are helpful", // ✓
  tools: { ... },
});
```

See [tool-calling.md](references/tool-calling.md) for advanced patterns.

---

## 5. Text Completion

Use `useCompletion` for single-prompt completions (not conversations).

```vue
<script setup lang="ts">
import { useCompletion } from "@ai-sdk/vue";

const { completion, complete, isLoading } = useCompletion({
  api: "/api/completion",
});

const summarize = () => complete("Summarize: " + sourceText);
</script>

<template>
  <button @click="summarize" :disabled="isLoading">Summarize</button>
  <p>{{ completion }}</p>
</template>
```

Server route for completion (`server/api/completion.ts`):

```typescript
import { streamText } from "ai";

export default defineLazyEventHandler(async () => {
  const openai = createOpenAI({ apiKey: useRuntimeConfig().openaiApiKey });

  return defineEventHandler(async (event) => {
    const { prompt } = await readBody(event);
    const result = streamText({ model: openai("gpt-4o"), prompt });
    return result.toTextStreamResponse(); // Note: toTextStreamResponse for completion
  });
});
```

See [use-completion.md](references/use-completion.md) for full API.

---

## Quick Reference: Response Methods

Use the correct response method for each use case:

- `result.toUIMessageStreamResponse()` — For chat (preserves message structure)
- `result.toTextStreamResponse()` — For completion (plain text stream)
- `result.text` — For non-streaming (after await generateText)
- `result.output` — For structured output (after await generateText with Output)

---

## References

- [api-routes.md](references/api-routes.md) — Server patterns, provider examples
- [structured-output.md](references/structured-output.md) — Output API, streaming objects
- [use-completion.md](references/use-completion.md) — useCompletion API
- [tool-calling.md](references/tool-calling.md) — Tool definitions, multi-step agents

## Assets

- [chat-component.vue](assets/chat-component.vue) — Complete chat UI template
- [api-chat.ts](assets/api-chat.ts) — Nuxt API route with tools
- [structured-agent.ts](assets/structured-agent.ts) — Multi-step agent example
