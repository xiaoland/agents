<template>
  <div class="export-button">
    <button 
      @click="handleExport" 
      :disabled="disabled || loading"
      class="export-btn"
    >
      {{ loading ? 'Exporting...' : 'Export ZIP' }}
    </button>
  </div>
</template>

<script setup lang="ts">
interface Props {
  disabled?: boolean
  loading?: boolean
}

interface Emits {
  (e: 'export'): void
}

defineProps<Props>()
const emit = defineEmits<Emits>()

function handleExport() {
  emit('export')
}
</script>

<style scoped>
.export-button {
  margin: 2rem 0;
  text-align: center;
}

.export-btn {
  padding: 1rem 2rem;
  background: #42b983;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1.1rem;
  font-weight: bold;
}

.export-btn:hover:not(:disabled) {
  background: #35a372;
}

.export-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}
</style>
