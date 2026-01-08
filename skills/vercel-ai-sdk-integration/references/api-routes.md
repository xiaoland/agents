# API Routes Reference

Server-side patterns for Nuxt/Vue AI SDK integration.

## Basic Chat Route

```typescript
// server/api/chat.ts
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

## With System Prompt

```typescript
const result = streamText({
  model: openai("gpt-4o"),
  system: "You are a helpful coding assistant. Respond concisely.",
  messages: await convertToModelMessages(messages),
});
```

## With Tools

```typescript
import { streamText, convertToModelMessages, tool } from "ai";
import { z } from "zod";

const calculatorTool = tool({
  description: "Perform mathematical calculations",
  inputSchema: z.object({
    expression: z.string().describe("Math expression to evaluate"),
  }),
  execute: async ({ expression }) => {
    return { result: eval(expression) }; // Use safe parser in production
  },
});

export default defineLazyEventHandler(async () => {
  const openai = createOpenAI({ apiKey: useRuntimeConfig().openaiApiKey });

  return defineEventHandler(async (event) => {
    const { messages } = await readBody(event);

    const result = streamText({
      model: openai("gpt-4o"),
      tools: { calculator: calculatorTool },
      messages: await convertToModelMessages(messages),
    });

    return result.toUIMessageStreamResponse();
  });
});
```

## Text Completion Route

```typescript
// server/api/completion.ts
import { streamText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";

export default defineLazyEventHandler(async () => {
  const openai = createOpenAI({ apiKey: useRuntimeConfig().openaiApiKey });

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

## Structured Object Route

```typescript
// server/api/recipe.ts
import { streamText, Output } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { z } from "zod";

const recipeSchema = z.object({
  name: z.string().describe("Recipe name"),
  prepTime: z.number().describe("Preparation time in minutes"),
  ingredients: z.array(z.object({
    name: z.string(),
    amount: z.string(),
  })),
  steps: z.array(z.string()),
});

export default defineLazyEventHandler(async () => {
  const openai = createOpenAI({ apiKey: useRuntimeConfig().openaiApiKey });

  return defineEventHandler(async (event) => {
    const { dish } = await readBody(event);

    const result = streamText({
      model: openai("gpt-4o"),
      output: Output.object({ schema: recipeSchema }),
      prompt: `Create a recipe for ${dish}`,
    });

    return result.toTextStreamResponse();
  });
});
```

## Error Handling

```typescript
export default defineEventHandler(async (event) => {
  try {
    const { messages } = await readBody(event);

    const result = streamText({
      model: openai("gpt-4o"),
      messages: await convertToModelMessages(messages),
      onError: (error) => {
        console.error("Stream error:", error);
      },
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    throw createError({
      statusCode: 500,
      message: error instanceof Error ? error.message : "AI generation failed",
    });
  }
});
```

## Environment Configuration

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  runtimeConfig: {
    openaiApiKey: process.env.OPENAI_API_KEY,
    anthropicApiKey: process.env.ANTHROPIC_API_KEY,
  },
});
```

## Provider Examples

### Anthropic

```typescript
import { createAnthropic } from "@ai-sdk/anthropic";

const anthropic = createAnthropic({
  apiKey: useRuntimeConfig().anthropicApiKey,
});

const result = streamText({
  model: anthropic("claude-sonnet-4-20250514"),
  messages: await convertToModelMessages(messages),
});
```

### Google

```typescript
import { createGoogleGenerativeAI } from "@ai-sdk/google";

const google = createGoogleGenerativeAI({
  apiKey: useRuntimeConfig().googleApiKey,
});

const result = streamText({
  model: google("gemini-1.5-pro"),
  messages: await convertToModelMessages(messages),
});
```

### AI Gateway (Multi-provider)

```typescript
import { createGateway } from "ai";

const gateway = createGateway({
  apiKey: useRuntimeConfig().aiGatewayApiKey,
});

const result = streamText({
  model: gateway("anthropic/claude-sonnet-4.5"),
  messages: await convertToModelMessages(messages),
});
```
