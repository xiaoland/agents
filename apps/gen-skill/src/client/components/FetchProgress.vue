<template>
  <div class="fetch-progress" v-if="progress.total > 0">
    <h3>Fetching Documents</h3>
    <div class="progress-bar">
      <div 
        class="progress-fill" 
        :style="{ width: `${progressPercent}%` }"
      ></div>
    </div>
    <p class="stats">
      {{ progress.completed }} / {{ progress.total }} completed
    </p>
    <p class="current" v-if="progress.current">
      Current: {{ progress.current }}
    </p>
    <div v-if="progress.errors.length > 0" class="errors">
      <h4>Errors ({{ progress.errors.length }})</h4>
      <ul>
        <li v-for="(error, idx) in progress.errors.slice(0, 5)" :key="idx">
          {{ error }}
        </li>
      </ul>
      <p v-if="progress.errors.length > 5">
        ... and {{ progress.errors.length - 5 }} more
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { FetchProgress } from '@/core/types'

interface Props {
  progress: FetchProgress
}

const props = defineProps<Props>()

const progressPercent = computed(() => {
  if (props.progress.total === 0) return 0
  return Math.round((props.progress.completed / props.progress.total) * 100)
})
</script>

<style scoped>
.fetch-progress {
  margin-bottom: 2rem;
  padding: 1rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: #f9f9f9;
}

h3 {
  margin-top: 0;
}

.progress-bar {
  width: 100%;
  height: 30px;
  background: #eee;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 0.5rem;
}

.progress-fill {
  height: 100%;
  background: #42b983;
  transition: width 0.3s ease;
}

.stats, .current {
  margin: 0.5rem 0;
  font-size: 0.9rem;
}

.current {
  color: #666;
  font-style: italic;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.errors {
  margin-top: 1rem;
  padding: 1rem;
  background: #fff3cd;
  border: 1px solid #ffc107;
  border-radius: 4px;
}

.errors h4 {
  margin-top: 0;
}

.errors ul {
  margin: 0.5rem 0;
  padding-left: 1.5rem;
}

.errors li {
  font-size: 0.85rem;
  color: #666;
  margin-bottom: 0.25rem;
}
</style>
