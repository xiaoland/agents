<template>
  <div class="discovery-result" v-if="result">
    <h2>Discovery Result</h2>
    <div class="info">
      <p><strong>Type:</strong> {{ result.type }}</p>
      <p><strong>Base URL:</strong> {{ result.baseUrl }}</p>
      <p><strong>Entries Found:</strong> {{ result.entries.length }}</p>
    </div>
    
    <div v-if="result.entries.length > 0" class="entries">
      <h3>Documentation Entries</h3>
      <div class="entry-list">
        <div v-for="(entry, idx) in result.entries" :key="idx" class="entry">
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
import type { DiscoveryResult } from '@/core/types'

interface Props {
  result: DiscoveryResult | null
}

defineProps<Props>()
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

h3 {
  margin-bottom: 0.5rem;
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
