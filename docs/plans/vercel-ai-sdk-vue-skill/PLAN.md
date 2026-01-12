# Vercel AI SDK v6 Vue Skill - Comprehensive Plan

## Scope

**Target:** Browser-based AI applications with Vue.js (no server/Nuxt dependency)

**Coverage:**
- AI SDK Core: Text generation, Structured data, Tool calling, MCP, Prompts, Settings, Middleware, Providers, Errors
- Agents: Building agents, Workflow patterns, Loop control
- AI SDK UI (Vue): Chat class, useCompletion, useObject

---

## Proposed Skill Structure

```
skills/vercel-ai-sdk-integration/
├── SKILL.md                      # Index (~100 lines)
│
├── references/
│   │
│   │ # AI SDK Core
│   ├── generate-text.md          # generateText, streamText
│   ├── structured-output.md      # Output.object, array, choice, enum
│   ├── tool-calling.md           # tool(), execute, multi-step
│   ├── mcp.md                    # Model Context Protocol client
│   ├── prompts.md                # Prompt engineering patterns
│   ├── settings.md               # temperature, maxTokens, topP, etc.
│   ├── middleware.md             # wrapLanguageModel, custom middleware
│   ├── providers.md              # createOpenAI, createAnthropic, etc.
│   ├── error-handling.md         # Error types, handling patterns
│   │
│   │ # Agents
│   ├── agents.md                 # ToolLoopAgent, workflow patterns, loop control
│   │
│   │ # AI SDK UI (Vue.js)
│   ├── chat.md                   # Chat class for Vue
│   ├── use-completion.md         # useCompletion composable
│   └── use-object.md             # useObject composable
│
└── assets/
    └── chat-component.vue        # Minimal chat template
```

**Total: 14 reference files + 1 asset**

---

## SKILL.md Structure

```markdown
# Vercel AI SDK v6 for Vue.js

## Critical: v6 Breaking Changes
- useChat() → new Chat()
- generateObject() → generateText({ output: Output.object() })
- await convertToModelMessages() (now async)
- Experimental_Agent → ToolLoopAgent with `instructions`

## Decision Framework

**Text generation?** → [generate-text.md]
**Structured JSON output?** → [structured-output.md]
**AI calling functions?** → [tool-calling.md]
**Building agents?** → [agents.md]
**MCP servers?** → [mcp.md]
**Chat UI in Vue?** → [chat.md]
**Completion UI?** → [use-completion.md]
**Streaming objects?** → [use-object.md]
**Provider setup?** → [providers.md]
**Model settings?** → [settings.md]
**Custom middleware?** → [middleware.md]
**Prompt patterns?** → [prompts.md]
**Error handling?** → [error-handling.md]

## Installation
pnpm add ai @ai-sdk/vue @ai-sdk/openai zod

## Quick Start
[3 minimal examples: generateText, Chat, useObject]

## Anti-patterns
[Common v6 mistakes]

## References
[Links]
```

---

## Content Outline Per Reference

### generate-text.md (~120 lines)
- generateText vs streamText decision
- Basic usage with prompt
- Using with messages (conversation)
- System prompt
- Streaming (textStream, fullStream)
- Callbacks (onChunk, onFinish, onError)
- Anti-patterns

### structured-output.md (~120 lines)
- Output.object({ schema }) with Zod
- Output.array({ element })
- Output.choice({ options }) for classification
- Output.enum() for enums
- Schema best practices (.describe())
- Streaming partial objects
- Anti-patterns

### tool-calling.md (~130 lines)
- tool() definition
- inputSchema with Zod
- execute function
- Using with generateText/streamText
- Multi-step (stopWhen: stepCountIs)
- Stop conditions
- Tool choice control
- Anti-patterns

### mcp.md (~100 lines)
- createMCPClient()
- Connecting to MCP servers
- Using MCP tools with generateText
- Transport options
- Anti-patterns

### prompts.md (~80 lines)
- Text prompts vs message arrays
- System prompts
- Multi-modal (images, files)
- Prompt templates
- Anti-patterns

### settings.md (~80 lines)
- temperature, topP, topK
- maxTokens, maxOutputTokens
- stopSequences
- seed for reproducibility
- Provider-specific settings
- Anti-patterns

### middleware.md (~100 lines)
- wrapLanguageModel()
- Built-in middleware (smoothStream, extractReasoning)
- Custom middleware pattern
- Chaining middleware
- Anti-patterns

### providers.md (~100 lines)
- createOpenAI, createAnthropic, createGoogle
- createGateway (multi-provider)
- Browser-compatible setup
- API key handling
- Custom baseURL
- Anti-patterns

### error-handling.md (~80 lines)
- Error types (APICallError, NoObjectGeneratedError, etc.)
- onError callbacks
- Retry patterns
- Client-side error display
- Anti-patterns

### agents.md (~150 lines)
- ToolLoopAgent overview
- instructions parameter
- stopWhen conditions
- Accessing steps and tool results
- Workflow patterns (sequential, parallel, routing)
- Human-in-the-loop (needsApproval)
- Anti-patterns

### chat.md (~120 lines)
- Chat class constructor
- Properties: messages, status, error
- Methods: sendMessage, stop, regenerate
- Rendering message parts
- Status-based UI
- Anti-patterns

### use-completion.md (~80 lines)
- Parameters
- Return values
- Basic usage
- Callbacks
- Anti-patterns

### use-object.md (~100 lines)
- Parameters (api, schema)
- Return values
- Progressive rendering
- Schema with descriptions
- Anti-patterns

---

## Estimated Size

- SKILL.md: ~100 lines
- References: ~1,360 lines total (14 files)
- Assets: ~100 lines (1 file)
- **Total: ~1,560 lines**

---

## Implementation Order

1. SKILL.md (index)
2. Core: generate-text.md, structured-output.md, tool-calling.md
3. Core: providers.md, settings.md, prompts.md
4. Core: middleware.md, mcp.md, error-handling.md
5. Agents: agents.md
6. Vue UI: chat.md, use-completion.md, use-object.md
7. Assets: chat-component.vue
8. Final review and commit
