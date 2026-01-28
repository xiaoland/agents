<template>
  <div class="url-input">
    <h2>Enter Documentation Site URL</h2>
    <form @submit.prevent="handleSubmit">
      <input
        v-model="url"
        type="text"
        placeholder="e.g., ai-sdk.dev"
        :disabled="disabled"
      />
      <button type="submit" :disabled="disabled || !url">
        Discover
      </button>
    </form>
    <p class="hint">
      Only sites with llms.txt or llms-full.txt are supported
    </p>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

interface Props {
  disabled?: boolean
}

interface Emits {
  (e: 'discover', url: string): void
}

defineProps<Props>()
const emit = defineEmits<Emits>()

const url = ref('')

function handleSubmit() {
  if (url.value) {
    emit('discover', url.value)
  }
}
</script>

<style scoped>
.url-input {
  margin-bottom: 2rem;
}

h2 {
  margin-bottom: 1rem;
}

form {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

input {
  flex: 1;
  padding: 0.5rem;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 1rem;
}

button {
  padding: 0.5rem 1rem;
  background: #42b983;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
}

button:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.hint {
  color: #666;
  font-size: 0.9rem;
  margin: 0;
}
</style>
