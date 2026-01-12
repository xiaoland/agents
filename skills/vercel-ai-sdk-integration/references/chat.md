# Chat Class Reference

Vue composable for multi-turn conversations with streaming.

**Use for:** Chat interfaces, conversational AI, multi-turn dialogs.
**Do NOT use:** `useChat()` — it is deprecated in v6.

---

## Basic Usage

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

---

## Constructor Options

```typescript
const chat = new Chat({
  api: "/api/chat",           // Required: endpoint URL
  id: "my-chat",              // Optional: unique ID for shared state
  initialMessages: [],        // Optional: pre-populate messages
  headers: {},                // Optional: custom request headers
  body: {},                   // Optional: additional body data
  credentials: "same-origin", // Optional: fetch credentials
  onError: (error) => {},     // Optional: error callback
  onFinish: (message) => {},  // Optional: completion callback
});
```

---

## Properties

**chat.messages** (reactive)
Array of messages with structure:
```typescript
{
  id: string;
  role: "user" | "assistant";
  parts: Array<{ type: "text"; text: string } | { type: "tool-invocation"; ... }>;
}
```

**chat.status**
Current state: `"ready"` | `"submitted"` | `"streaming"` | `"error"`

**chat.error**
Error object when status is `"error"`, otherwise `undefined`.

---

## Methods

**chat.sendMessage({ text: string })**
Send a user message and trigger AI response.

**chat.stop()**
Abort the current streaming response.

**chat.regenerate()**
Resend the last assistant message request.

**chat.setMessages(messages)**
Manually update the message list.

---

## Rendering Messages

Messages contain `parts` array. Handle each part type:

```vue
<template>
  <div v-for="message in chat.messages" :key="message.id">
    <template v-for="(part, i) in message.parts" :key="i">
      <!-- Text content -->
      <p v-if="part.type === 'text'">{{ part.text }}</p>

      <!-- Tool invocation -->
      <div v-else-if="part.type === 'tool-invocation'" class="tool">
        <span>{{ part.toolInvocation.toolName }}</span>
        <pre>{{ part.toolInvocation.args }}</pre>
        <div v-if="part.toolInvocation.state === 'result'">
          {{ part.toolInvocation.result }}
        </div>
      </div>
    </template>
  </div>
</template>
```

---

## Status-Based UI

```vue
<template>
  <!-- Disable input while streaming -->
  <input :disabled="chat.status === 'streaming'" />

  <!-- Show loading indicator -->
  <div v-if="chat.status === 'streaming'">Thinking...</div>

  <!-- Show error -->
  <div v-if="chat.status === 'error'">{{ chat.error?.message }}</div>

  <!-- Stop button -->
  <button v-if="chat.status === 'streaming'" @click="chat.stop()">
    Stop
  </button>
</template>
```

---

## Shared State

Use same `id` to share chat across components:

```vue
<!-- ComponentA.vue -->
<script setup lang="ts">
const chat = new Chat({ id: "main-chat", api: "/api/chat" });
</script>

<!-- ComponentB.vue -->
<script setup lang="ts">
// Same id = same state
const chat = new Chat({ id: "main-chat", api: "/api/chat" });
</script>
```

---

## Anti-patterns

```typescript
// WRONG: Using deprecated useChat
import { useChat } from "@ai-sdk/vue";
const { messages } = useChat(); // ❌

// CORRECT: Use Chat class
import { Chat } from "@ai-sdk/vue";
const chat = new Chat({ api: "/api/chat" }); // ✓
```

```typescript
// WRONG: Separate loading ref
const isLoading = ref(false);
isLoading.value = true;
chat.sendMessage({ text }); // ❌

// CORRECT: Use chat.status
<button :disabled="chat.status === 'streaming'"> // ✓
```

```typescript
// WRONG: Accessing messages as ref
const msgs = chat.messages.value; // ❌ Already unwrapped

// CORRECT: Direct access
const msgs = chat.messages; // ✓
```
