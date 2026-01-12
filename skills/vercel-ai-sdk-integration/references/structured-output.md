# Structured Output Reference

Generate typed data with AI SDK v6 Output API.

**NEVER use deprecated `generateObject()` or `streamObject()`.**

---

## Decision: Which Output Type

**For typed objects:** `Output.object({ schema })`
**For arrays of typed elements:** `Output.array({ element })`
**For classification to specific values:** `Output.choice({ options })`
**For unvalidated JSON:** `Output.json()`
**For plain text (default):** `Output.text()`

---

## Output.object()

Generate typed objects matching a Zod schema:

```typescript
import { generateText, Output } from "ai";
import { z } from "zod";

const userSchema = z.object({
  name: z.string().describe("Full name"),
  age: z.number().describe("Age in years"),
  email: z.string().email().describe("Email address"),
});

const { output } = await generateText({
  model: openai("gpt-4o"),
  output: Output.object({
    schema: userSchema,
    name: "User",
    description: "User profile information",
  }),
  prompt: "Generate a fictional user profile",
});
// output: { name: string, age: number, email: string }
```

---

## Output.array()

Generate arrays of typed elements:

```typescript
const productSchema = z.object({
  name: z.string(),
  price: z.number(),
  category: z.string(),
});

const { output } = await generateText({
  model: openai("gpt-4o"),
  output: Output.array({
    element: productSchema,
    description: "List of products",
  }),
  prompt: "Generate 5 fictional tech products",
});
// output: Array<{ name, price, category }>
```

---

## Output.choice()

Classification with predefined options:

```typescript
const { output } = await generateText({
  model: openai("gpt-4o"),
  output: Output.choice({
    options: ["positive", "negative", "neutral"],
  }),
  prompt: "Classify sentiment: 'This product is amazing!'",
});
// output: "positive" | "negative" | "neutral"
```

---

## Streaming Structured Output

Use `streamText` with `partialOutputStream` for real-time updates:

```typescript
const result = streamText({
  model: openai("gpt-4o"),
  output: Output.object({
    schema: z.object({
      title: z.string(),
      sections: z.array(z.object({
        heading: z.string(),
        content: z.string(),
      })),
    }),
  }),
  prompt: "Write an article about Vue.js",
});

for await (const partial of result.partialOutputStream) {
  console.log(partial);
  // Partial objects as they stream:
  // { title: "Vue" }
  // { title: "Vue.js", sections: [{ heading: "Intro" }] }
  // { title: "Vue.js", sections: [{ heading: "Intro", content: "..." }] }
}
```

---

## Combining with Tools

When using structured output with tool calling, the output generation counts as one step. Adjust `stopWhen` accordingly:

```typescript
import { generateText, Output, tool, stepCountIs } from "ai";

const { output, steps } = await generateText({
  model: openai("gpt-4o"),
  tools: {
    getWeather: tool({
      description: "Get weather for a city",
      inputSchema: z.object({ city: z.string() }),
      execute: async ({ city }) => ({ city, temp: 22 }),
    }),
  },
  output: Output.object({
    schema: z.object({
      report: z.string().describe("Weather summary"),
      cities: z.array(z.object({
        name: z.string(),
        temperature: z.number(),
      })),
    }),
  }),
  stopWhen: stepCountIs(5), // 4 tool calls + 1 output step
  prompt: "Get weather for Paris and London, then summarize",
});
```

---

## Schema Best Practices

### Add descriptions to every field

Descriptions improve model accuracy:

```typescript
// WRONG: No descriptions
const schema = z.object({
  x: z.string(),
  y: z.number(),
}); // ❌ Model guesses field meaning

// CORRECT: Explicit descriptions
const schema = z.object({
  x: z.string().describe("Product name"),
  y: z.number().describe("Price in USD"),
}); // ✓
```

### Optional and nullable fields

```typescript
const schema = z.object({
  name: z.string(),
  nickname: z.string().optional(),
  age: z.number().nullable(),
});
```

### Nested objects

```typescript
const addressSchema = z.object({
  street: z.string(),
  city: z.string(),
  country: z.string(),
});

const userSchema = z.object({
  name: z.string(),
  address: addressSchema,
});
```

### Enums

```typescript
const schema = z.object({
  priority: z.enum(["low", "medium", "high"]),
  status: z.enum(["draft", "published", "archived"]),
});
```

---

## Error Handling

```typescript
import { NoObjectGeneratedError } from "ai";

try {
  const { output } = await generateText({
    model: openai("gpt-4o"),
    output: Output.object({ schema }),
    prompt: "...",
  });
} catch (error) {
  if (NoObjectGeneratedError.isInstance(error)) {
    console.log("Raw text:", error.text);
    console.log("Cause:", error.cause);
  }
}
```

---

## Type Inference

Extract TypeScript types from schemas:

```typescript
import { z } from "zod";

const recipeSchema = z.object({
  name: z.string(),
  ingredients: z.array(z.string()),
});

type Recipe = z.infer<typeof recipeSchema>;

// Use in Vue component
defineProps<{ recipe: Recipe }>();
```

---

## Anti-patterns

```typescript
// WRONG: Using deprecated generateObject
import { generateObject } from "ai";
const { object } = await generateObject({ schema }); // ❌

// CORRECT: Use generateText with output
import { generateText, Output } from "ai";
const { output } = await generateText({
  output: Output.object({ schema }),
}); // ✓
```

```typescript
// WRONG: Accessing .object property (v5 pattern)
const { object } = await generateText({ output }); // ❌ No .object

// CORRECT: Access .output property
const { output } = await generateText({ output: Output.object({ schema }) }); // ✓
```
