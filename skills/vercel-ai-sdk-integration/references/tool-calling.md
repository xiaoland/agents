# Tool Calling Reference

Define and execute tools with AI SDK v6.

---

## Tool Definition

Every tool requires three parts:

```typescript
import { tool } from "ai";
import { z } from "zod";

const weatherTool = tool({
  description: "Get current weather for a location",
  inputSchema: z.object({
    location: z.string().describe("City name"),
    unit: z.enum(["celsius", "fahrenheit"]).optional(),
  }),
  execute: async ({ location, unit = "celsius" }) => {
    const temp = await fetchWeatherAPI(location);
    return { location, temperature: temp, unit };
  },
});
```

**Required properties:**
- `description` — Guides model on when to use the tool (be specific)
- `inputSchema` — Zod schema with `.describe()` on each field
- `execute` — Async function receiving validated inputs

**Optional properties:**
- `strict: true` — Enable provider schema validation
- `needsApproval: true` — Require human approval before execution

---

## Using Tools with generateText

```typescript
import { generateText, tool } from "ai";

const { text, toolCalls, toolResults } = await generateText({
  model: openai("gpt-4o"),
  tools: {
    weather: weatherTool,
    search: searchTool,
  },
  prompt: "What's the weather in Tokyo?",
});
```

---

## Multi-Step Tool Loops

Enable automatic multi-step execution with `stopWhen`. Without it, only one tool call happens.

```typescript
import { generateText, stepCountIs } from "ai";

const { text, steps } = await generateText({
  model: openai("gpt-4o"),
  tools: {
    search: searchTool,
    calculate: calculatorTool,
  },
  stopWhen: stepCountIs(10),
  prompt: "Research Vue.js market share and calculate year-over-year growth",
});

// Access each step
for (const step of steps) {
  console.log("Text:", step.text);
  console.log("Tool calls:", step.toolCalls);
  console.log("Tool results:", step.toolResults);
}
```

---

## Stop Conditions

```typescript
import { stepCountIs, toolCallIs, textContains } from "ai";

// Stop after N steps
stopWhen: stepCountIs(5)

// Stop when specific tool is called
stopWhen: toolCallIs("finalize")

// Stop when text contains phrase
stopWhen: textContains("DONE")

// Custom condition
stopWhen: ({ steps }) => steps.length >= 3 && steps.some(s => s.toolCalls.length === 0)
```

---

## Tool Choice Control

```typescript
// Model decides (default)
toolChoice: "auto"

// Force tool usage
toolChoice: "required"

// Disable tools
toolChoice: "none"

// Force specific tool
toolChoice: { type: "tool", toolName: "weather" }
```

---

## Streaming with Tools

```typescript
import { streamText, tool } from "ai";

const result = streamText({
  model: openai("gpt-4o"),
  tools: { weather: weatherTool },
  prompt: "What's the weather in Paris?",
  onChunk: ({ chunk }) => {
    if (chunk.type === "tool-call") {
      console.log("Calling:", chunk.toolName, chunk.args);
    }
    if (chunk.type === "tool-result") {
      console.log("Result:", chunk.result);
    }
  },
});
```

---

## Human-in-the-Loop Approval

Require approval before executing sensitive actions:

```typescript
const deleteUserTool = tool({
  description: "Delete user data permanently",
  inputSchema: z.object({
    userId: z.string(),
  }),
  needsApproval: true,
  execute: async ({ userId }) => {
    await deleteUserData(userId);
    return { success: true };
  },
});
```

---

## Active Tools (Subset Selection)

Limit available tools without changing types:

```typescript
const allTools = {
  search: searchTool,
  calculate: calculatorTool,
  summarize: summarizeTool,
  translate: translateTool,
};

const { text } = await generateText({
  model: openai("gpt-4o"),
  tools: allTools,
  activeTools: ["search", "summarize"],
  prompt: "Search and summarize Vue.js features",
});
```

---

## Common Tool Patterns

### Search Tool

```typescript
const searchTool = tool({
  description: "Search the web for current information",
  inputSchema: z.object({
    query: z.string().describe("Search query"),
    limit: z.number().optional().describe("Max results (default 5)"),
  }),
  execute: async ({ query, limit = 5 }) => {
    const results = await searchAPI(query, limit);
    return results.map(r => ({ title: r.title, snippet: r.snippet }));
  },
});
```

### Calculator Tool

```typescript
const calculatorTool = tool({
  description: "Evaluate mathematical expressions",
  inputSchema: z.object({
    expression: z.string().describe("Math expression (e.g., '2 + 2 * 3')"),
  }),
  execute: async ({ expression }) => {
    // Use safe parser like mathjs
    const result = evaluate(expression);
    return { expression, result };
  },
});
```

### Database Query Tool

```typescript
const queryTool = tool({
  description: "Query database for records",
  inputSchema: z.object({
    table: z.enum(["users", "orders", "products"]),
    filter: z.record(z.string()).optional(),
    limit: z.number().default(10),
  }),
  execute: async ({ table, filter, limit }) => {
    const results = await db.query(table, filter, limit);
    return { count: results.length, data: results };
  },
});
```

---

## Error Handling

Tool validation errors throw immediately. Execution errors appear as content parts:

```typescript
const { text, toolResults } = await generateText({
  model: openai("gpt-4o"),
  tools: { risky: riskyTool },
  prompt: "Run the risky operation",
});

for (const result of toolResults) {
  if (result.type === "tool-error") {
    console.error("Tool failed:", result.error);
  }
}
```

---

## Anti-patterns

```typescript
// WRONG: No stopWhen with tools (only one call)
const { text } = await generateText({
  tools: { search: searchTool },
  prompt: "Research Vue.js",
}); // ❌ Single tool call only

// CORRECT: Enable multi-step
const { text } = await generateText({
  tools: { search: searchTool },
  stopWhen: stepCountIs(10),
  prompt: "Research Vue.js",
}); // ✓
```

```typescript
// WRONG: Using v5 'system' parameter
const agent = new Experimental_Agent({
  system: "You are helpful",
}); // ❌ Deprecated

// CORRECT: Use 'instructions' in v6
const { text } = await generateText({
  instructions: "You are helpful",
  tools: { ... },
}); // ✓
```

```typescript
// WRONG: Tool description too vague
const tool = tool({
  description: "Does stuff", // ❌ Model can't determine when to use
});

// CORRECT: Specific description
const tool = tool({
  description: "Calculate mathematical expressions like addition, multiplication, percentages", // ✓
});
```

```typescript
// WRONG: Input schema without descriptions
inputSchema: z.object({
  x: z.string(),
  y: z.number(),
}); // ❌ Model guesses parameter meaning

// CORRECT: Describe each parameter
inputSchema: z.object({
  x: z.string().describe("City name to look up"),
  y: z.number().describe("Number of days to forecast"),
}); // ✓
```
