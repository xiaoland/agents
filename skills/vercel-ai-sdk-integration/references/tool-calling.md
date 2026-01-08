# Tool Calling Reference

Define and execute tools with AI SDK v6.

## Tool Definition

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
    // Call weather API
    const temp = Math.floor(Math.random() * 30) + 5;
    return {
      location,
      temperature: temp,
      unit,
      condition: "partly cloudy",
    };
  },
});
```

## Tool Components

| Property | Required | Description |
|----------|----------|-------------|
| `description` | Yes | Guides model on when to use the tool |
| `inputSchema` | Yes | Zod schema for parameters |
| `execute` | No | Async function to run when called |
| `strict` | No | Enable provider schema validation |
| `needsApproval` | No | Require human approval before execution |

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

## Using Tools with streamText

```typescript
import { streamText, tool } from "ai";

const result = streamText({
  model: openai("gpt-4o"),
  tools: { weather: weatherTool },
  prompt: "What's the weather in Paris?",
  onChunk: ({ chunk }) => {
    if (chunk.type === "tool-call") {
      console.log("Tool called:", chunk.toolName, chunk.args);
    }
    if (chunk.type === "tool-result") {
      console.log("Tool result:", chunk.result);
    }
  },
});
```

## Multi-Step Tool Loops

Enable automatic multi-step execution with `stopWhen`:

```typescript
import { generateText, stepCountIs } from "ai";

const { text, steps } = await generateText({
  model: openai("gpt-4o"),
  tools: {
    search: searchTool,
    calculate: calculatorTool,
    summarize: summarizeTool,
  },
  stopWhen: stepCountIs(10), // Max 10 steps
  prompt: "Research Vue.js market share, calculate growth rate, summarize findings",
});

// Access each step
for (const step of steps) {
  console.log("Step:", step.text);
  console.log("Tool calls:", step.toolCalls);
  console.log("Tool results:", step.toolResults);
}
```

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

## Human-in-the-Loop Approval

```typescript
const sensitiveAction = tool({
  description: "Delete user data",
  inputSchema: z.object({
    userId: z.string(),
    confirm: z.boolean(),
  }),
  needsApproval: true, // Requires approval before execute
  execute: async ({ userId }) => {
    // Destructive action
    await deleteUserData(userId);
    return { success: true };
  },
});
```

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
  activeTools: ["search", "summarize"], // Only these available
  prompt: "Search and summarize Vue.js features",
});
```

## Error Handling

Tool validation errors throw. Execution errors appear as content parts:

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

## Common Tool Patterns

### Search Tool

```typescript
const searchTool = tool({
  description: "Search the web for information",
  inputSchema: z.object({
    query: z.string().describe("Search query"),
    limit: z.number().optional().describe("Max results"),
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
  description: "Perform mathematical calculations",
  inputSchema: z.object({
    expression: z.string().describe("Math expression (e.g., '2 + 2 * 3')"),
  }),
  execute: async ({ expression }) => {
    // Use a safe math parser like mathjs
    const result = evaluate(expression);
    return { expression, result };
  },
});
```

### Database Query Tool

```typescript
const queryTool = tool({
  description: "Query the database for user information",
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

### API Call Tool

```typescript
const apiTool = tool({
  description: "Call external API endpoint",
  inputSchema: z.object({
    endpoint: z.string().url(),
    method: z.enum(["GET", "POST"]).default("GET"),
    body: z.record(z.unknown()).optional(),
  }),
  execute: async ({ endpoint, method, body }) => {
    const response = await fetch(endpoint, {
      method,
      body: body ? JSON.stringify(body) : undefined,
      headers: { "Content-Type": "application/json" },
    });
    return response.json();
  },
});
```
