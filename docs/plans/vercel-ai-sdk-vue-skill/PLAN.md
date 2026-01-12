# Vercel AI SDK v6 Vue Skill - Comprehensive Plan

## Part 1: Current AI SDK Documentation Structure

### Foundations
- Overview
- Providers and Models
- Prompts
- Tools
- Streaming

### AI SDK Core (Server-Side)
- Overview
- Generating Text (`generateText`, `streamText`)
- Generating Structured Data (`Output.object`, `Output.array`, etc.)
- Tool Calling (`tool`, `dynamicTool`, multi-step loops)
- Model Context Protocol (MCP)
- Prompt Engineering
- Settings (temperature, maxTokens, etc.)
- Embeddings (`embed`, `embedMany`)
- Error Handling
- Telemetry

### AI SDK UI (Client-Side, Framework-Agnostic)
- Overview
- Chatbot (`useChat` / `Chat`)
- Chatbot Message Persistence
- Chatbot Tool Usage
- Completion (`useCompletion`)
- Object Generation (`useObject`)
- Streaming Custom Data
- Error Handling
- Transport
- Stream Protocols

### AI SDK Vue (@ai-sdk/vue)
- `Chat` class
- `useCompletion` composable
- `useObject` composable

### Reference APIs
- `generateText()`, `streamText()`
- `tool()`, `dynamicTool()`
- `Output.object()`, `Output.array()`, `Output.choice()`
- `convertToModelMessages()`
- `stepCountIs()`, `hasToolCall()`
- Provider functions (`createOpenAI`, `createAnthropic`, etc.)

---

## Part 2: Scope Decision

**Question for approval:** What scope should this skill cover?

### Option A: Client-Side Only (Current)
- `@ai-sdk/vue` composables only
- Assumes API routes exist elsewhere
- ~5 reference files

### Option B: Full Vue.js Stack (Recommended)
- Client-side: `@ai-sdk/vue` composables
- Server-side: `ai` package for API routes (works with any Vue backend)
- Covers complete Vue.js AI application patterns
- ~12-15 reference files

### Option C: Full SDK Coverage
- Everything in Option B
- Plus: Embeddings, MCP, Telemetry, advanced patterns
- ~20+ reference files

---

## Part 3: Proposed Skill Structure (Option B)

```
skills/vercel-ai-sdk-integration/
├── SKILL.md                      # Index: decision framework, quick examples, links
│
├── references/
│   │
│   │ # Client-Side (@ai-sdk/vue)
│   ├── chat.md                   # Chat class API, messages, status, methods
│   ├── use-completion.md         # useCompletion API
│   ├── use-object.md             # useObject API, streaming JSON
│   │
│   │ # Server-Side (ai package)
│   ├── generate-text.md          # generateText, streamText, prompts
│   ├── structured-output.md      # Output.object, Output.array, Output.choice, schemas
│   ├── tool-calling.md           # tool(), multi-step agents, stopWhen
│   ├── streaming.md              # Stream responses, toUIMessageStreamResponse, protocols
│   ├── providers.md              # createOpenAI, createAnthropic, createGateway
│   │
│   │ # Patterns
│   ├── message-handling.md       # convertToModelMessages, UIMessage, ModelMessage
│   ├── error-handling.md         # Client & server error patterns
│   └── api-routes.md             # Generic API route patterns (not Nuxt-specific)
│
└── assets/
    ├── chat-component.vue        # Complete chat UI
    ├── completion-component.vue  # Completion UI
    ├── object-component.vue      # Streaming object UI
    └── api-route-example.ts      # Generic server route (framework-agnostic)
```

---

## Part 4: SKILL.md Structure (Index)

```markdown
# Vercel AI SDK v6 for Vue.js

## Critical: v6 Breaking Changes
[4-5 lines of NEVER do X → do Y instead]

## Decision Framework
**Building chat UI?** → See [chat.md]
**Single prompt completion?** → See [use-completion.md]
**Streaming JSON objects?** → See [use-object.md]
**Server-side text generation?** → See [generate-text.md]
**Structured data from AI?** → See [structured-output.md]
**AI calling functions?** → See [tool-calling.md]
**Setting up providers?** → See [providers.md]

## Installation
[2 lines]

## Quick Start
[Minimal 3 examples: Chat, Completion, Object - ~40 lines total]

## Anti-patterns
[10-15 lines of common mistakes]

## References
[Links to all reference files]

## Assets
[Links to templates]
```

---

## Part 5: Content Outline Per Reference File

### chat.md (~150 lines)
- Constructor options
- Properties: messages, status, error
- Methods: sendMessage, stop, regenerate, setMessages
- Rendering message parts (text, tool-invocation)
- Status-based UI patterns
- Shared state across components
- Anti-patterns

### use-completion.md (~100 lines)
- Parameters
- Return values
- Form pattern
- Callbacks
- Shared state
- Anti-patterns

### use-object.md (~120 lines)
- Parameters (api, schema)
- Return values (object, submit, isLoading)
- Progressive rendering of partial objects
- Schema best practices (.describe())
- Type inference
- Anti-patterns

### generate-text.md (~150 lines)
- generateText vs streamText decision
- Parameters (model, prompt, system, messages)
- Return values (text, output, toolCalls, steps)
- Streaming patterns (textStream, fullStream)
- Callbacks (onChunk, onFinish, onError)
- Anti-patterns

### structured-output.md (~150 lines)
- Output.object({ schema })
- Output.array({ element })
- Output.choice({ options })
- Output.json(), Output.text()
- Schema best practices
- Combining with tools
- Error handling (NoObjectGeneratedError)
- Anti-patterns

### tool-calling.md (~150 lines)
- tool() definition (description, inputSchema, execute)
- Using with generateText/streamText
- Multi-step loops (stopWhen: stepCountIs)
- Stop conditions (stepCountIs, toolCallIs, textContains)
- Tool choice control
- Streaming with tools
- Anti-patterns

### streaming.md (~100 lines)
- toUIMessageStreamResponse() for chat
- toTextStreamResponse() for completion
- Stream protocols
- Backpressure handling
- Anti-patterns

### providers.md (~100 lines)
- createOpenAI, createAnthropic, createGoogle
- createGateway (multi-provider)
- Configuration options
- Environment variables
- Anti-patterns (exposing keys)

### message-handling.md (~80 lines)
- UIMessage structure
- ModelMessage structure
- convertToModelMessages() (async!)
- Message parts (text, tool-invocation)
- Anti-patterns

### error-handling.md (~80 lines)
- Client-side: chat.error, onError callbacks
- Server-side: try/catch, onError in streams
- NoObjectGeneratedError
- Network errors
- Anti-patterns

### api-routes.md (~100 lines)
- Generic pattern (not framework-specific)
- Chat route structure
- Completion route structure
- Structured output route
- With tools
- Error handling
- Anti-patterns

---

## Part 6: Questions for Approval

1. **Scope:** Option A (client-only), B (full stack), or C (full SDK)?

2. **Framework specificity:** Should api-routes.md be completely generic, or include Nuxt examples alongside generic patterns?

3. **Depth:** Should references be exhaustive (all parameters) or focused (common patterns only)?

4. **Assets:** Should assets include more complete examples (full chat app) or minimal templates?

---

## Next Steps After Approval

1. Update SKILL.md to index structure
2. Create/update reference files one by one
3. Create asset templates
4. Commit and push
