<script setup lang="ts">
/**
 * AI Chat Component
 * Complete chat interface using AI SDK v6 Chat class
 */
import { Chat } from "@ai-sdk/vue";
import { ref, computed } from "vue";

interface Props {
  api?: string;
  placeholder?: string;
  systemPrompt?: string;
}

const props = withDefaults(defineProps<Props>(), {
  api: "/api/chat",
  placeholder: "Type a message...",
});

const input = ref("");

const chat = new Chat({
  api: props.api,
  body: props.systemPrompt ? { system: props.systemPrompt } : undefined,
  onError: (error) => {
    console.error("Chat error:", error);
  },
});

const isStreaming = computed(() => chat.status === "streaming");
const hasError = computed(() => chat.status === "error");

const handleSubmit = (e: Event) => {
  e.preventDefault();
  const text = input.value.trim();
  if (!text || isStreaming.value) return;

  chat.sendMessage({ text });
  input.value = "";
};

const handleKeydown = (e: KeyboardEvent) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    handleSubmit(e);
  }
};

const handleStop = () => {
  chat.stop();
};

const handleRegenerate = () => {
  chat.regenerate();
};
</script>

<template>
  <div class="chat-container">
    <!-- Messages -->
    <div class="messages">
      <div
        v-for="message in chat.messages"
        :key="message.id"
        :class="['message', message.role]"
      >
        <div class="message-role">
          {{ message.role === "user" ? "You" : "AI" }}
        </div>
        <div class="message-content">
          <template v-for="(part, index) in message.parts" :key="index">
            <p v-if="part.type === 'text'" class="text-part">
              {{ part.text }}
            </p>
            <div v-else-if="part.type === 'tool-invocation'" class="tool-part">
              <span class="tool-name">{{ part.toolInvocation.toolName }}</span>
              <pre class="tool-args">{{ JSON.stringify(part.toolInvocation.args, null, 2) }}</pre>
              <div v-if="part.toolInvocation.state === 'result'" class="tool-result">
                <pre>{{ JSON.stringify(part.toolInvocation.result, null, 2) }}</pre>
              </div>
            </div>
          </template>
        </div>
      </div>

      <!-- Loading indicator -->
      <div v-if="isStreaming" class="message assistant loading">
        <div class="typing-indicator">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>
    </div>

    <!-- Error display -->
    <div v-if="hasError && chat.error" class="error-banner">
      {{ chat.error.message }}
      <button @click="handleRegenerate">Retry</button>
    </div>

    <!-- Input form -->
    <form class="input-form" @submit="handleSubmit">
      <textarea
        v-model="input"
        :placeholder="placeholder"
        :disabled="isStreaming"
        rows="1"
        @keydown="handleKeydown"
      />
      <div class="actions">
        <button
          v-if="isStreaming"
          type="button"
          class="stop-btn"
          @click="handleStop"
        >
          Stop
        </button>
        <button
          v-else
          type="submit"
          class="send-btn"
          :disabled="!input.trim()"
        >
          Send
        </button>
      </div>
    </form>
  </div>
</template>

<style scoped>
.chat-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  max-width: 800px;
  margin: 0 auto;
}

.messages {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.message {
  padding: 0.75rem 1rem;
  border-radius: 0.5rem;
  max-width: 85%;
}

.message.user {
  align-self: flex-end;
  background: #3b82f6;
  color: white;
}

.message.assistant {
  align-self: flex-start;
  background: #f3f4f6;
  color: #1f2937;
}

.message-role {
  font-size: 0.75rem;
  font-weight: 600;
  margin-bottom: 0.25rem;
  opacity: 0.7;
}

.message-content {
  line-height: 1.5;
}

.text-part {
  margin: 0;
  white-space: pre-wrap;
}

.tool-part {
  margin: 0.5rem 0;
  padding: 0.5rem;
  background: rgba(0, 0, 0, 0.05);
  border-radius: 0.25rem;
  font-size: 0.875rem;
}

.tool-name {
  font-weight: 600;
  color: #6366f1;
}

.tool-args,
.tool-result pre {
  margin: 0.25rem 0 0;
  font-size: 0.75rem;
  overflow-x: auto;
}

.typing-indicator {
  display: flex;
  gap: 0.25rem;
}

.typing-indicator span {
  width: 0.5rem;
  height: 0.5rem;
  background: #9ca3af;
  border-radius: 50%;
  animation: bounce 1.4s ease-in-out infinite;
}

.typing-indicator span:nth-child(2) {
  animation-delay: 0.2s;
}

.typing-indicator span:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes bounce {
  0%, 60%, 100% {
    transform: translateY(0);
  }
  30% {
    transform: translateY(-0.5rem);
  }
}

.error-banner {
  padding: 0.75rem 1rem;
  background: #fef2f2;
  color: #dc2626;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.error-banner button {
  padding: 0.25rem 0.75rem;
  background: #dc2626;
  color: white;
  border: none;
  border-radius: 0.25rem;
  cursor: pointer;
}

.input-form {
  display: flex;
  gap: 0.5rem;
  padding: 1rem;
  border-top: 1px solid #e5e7eb;
}

.input-form textarea {
  flex: 1;
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  resize: none;
  font-family: inherit;
  font-size: 1rem;
}

.input-form textarea:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
}

.actions button {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 0.5rem;
  font-weight: 500;
  cursor: pointer;
}

.send-btn {
  background: #3b82f6;
  color: white;
}

.send-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.stop-btn {
  background: #ef4444;
  color: white;
}
</style>
