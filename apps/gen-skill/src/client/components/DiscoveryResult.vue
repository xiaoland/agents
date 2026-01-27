<template>
  <div class="discovery-result" v-if="result">
    <h2>Discovery Result</h2>
    <div class="info">
      <p><strong>Type:</strong> {{ result.type }}</p>
      <p><strong>Base URL:</strong> {{ result.baseUrl }}</p>
      <p><strong>Entries Found:</strong> {{ filteredEntries.length }} {{ showingFiltered ? `(${result.entries.length} total)` : '' }}</p>
    </div>
    
    <div v-if="result.entries.length > 0" class="entries">
      <div class="entries-header">
        <h3>Documentation Entries</h3>
        <button 
          @click="toggleFilter" 
          class="filter-btn"
          :class="{ active: showingFiltered }"
        >
          {{ showingFiltered ? '✓ Only Base URL' : 'Filter by Base URL' }}
        </button>
      </div>
      <div class="entry-list">
        <div v-for="(entry, idx) in filteredEntries" :key="idx" class="entry">
          <strong>{{ entry.title }}</strong>
          <span class="category">{{ entry.category }}</span>
          <p class="description" v-if="entry.description">{{ entry.description }}</p>
          <a :href="entry.url" target="_blank" class="url">{{ entry.url }}</a>
        </div>
      </div>
    </div>
    
    <div v-else class="warning">
      <p>⚠️ No entries found. This site may not have proper llms.txt format.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { DiscoveryResult } from '@/core/types'

interface Props {
  result: DiscoveryResult | null
}

const props = defineProps<Props>()

const showingFiltered = ref(false)

const filteredEntries = computed(() => {
  if (!props.result) return []
  
  if (!showingFiltered.value) {
    return props.result.entries
  }
  
  // Filter entries that match the base URL
  const result = props.result
  return result.entries.filter(entry => {
    try {
      const entryUrl = new URL(entry.url)
      const baseUrl = new URL(result.baseUrl)
      return entryUrl.origin === baseUrl.origin
    } catch (e) {
      // If URL parsing fails, keep the entry
      return true
    }
  })
})

function toggleFilter() {
  showingFiltered.value = !showingFiltered.value
}
</script>

<style scoped>
.discovery-result {
  margin-bottom: 2rem;
  padding: 1rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: #f9f9f9;
}

h2 {
  margin-top: 0;
}

.info p {
  margin: 0.5rem 0;
}

.entries {
  margin-top: 1rem;
}

.entries-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

h3 {
  margin: 0;
}

.filter-btn {
  padding: 0.4rem 0.8rem;
  background: #f0f0f0;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.2s ease;
}

.filter-btn:hover {
  background: #e0e0e0;
}

.filter-btn.active {
  background: #42b983;
  color: white;
  border-color: #42b983;
}

.entry-list {
  max-height: 300px;
  overflow-y: auto;
}

.entry {
  padding: 0.75rem;
  margin-bottom: 0.5rem;
  background: white;
  border: 1px solid #eee;
  border-radius: 4px;
}

.entry strong {
  display: block;
  margin-bottom: 0.25rem;
}

.category {
  display: inline-block;
  padding: 0.2rem 0.5rem;
  background: #42b983;
  color: white;
  font-size: 0.8rem;
  border-radius: 3px;
  margin-bottom: 0.5rem;
}

.description {
  margin: 0.5rem 0;
  color: #666;
  font-size: 0.9rem;
}

.url {
  display: block;
  font-size: 0.85rem;
  color: #42b983;
  text-decoration: none;
}

.url:hover {
  text-decoration: underline;
}

.warning {
  padding: 1rem;
  background: #fff3cd;
  border: 1px solid #ffc107;
  border-radius: 4px;
  margin-top: 1rem;
}

.warning p {
  margin: 0;
}
</style>
