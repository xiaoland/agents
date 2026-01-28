<template>
  <div class="skill-preview" v-if="skillPackage">
    <h2>Skill Preview</h2>
    
    <div class="stats">
      <p><strong>Total References:</strong> {{ skillPackage.references.length }}</p>
      <p><strong>Total Size:</strong> {{ formatSize(totalSize) }}</p>
    </div>
    
    <div class="skill-md">
      <h3>SKILL.md Preview</h3>
      <pre>{{ previewSkillMd }}</pre>
    </div>
    
    <div class="references">
      <h3>References ({{ skillPackage.references.length }})</h3>
      <ul>
        <li v-for="(ref, idx) in skillPackage.references.slice(0, 10)" :key="idx">
          <code>{{ ref.path }}</code> - {{ ref.title }}
        </li>
      </ul>
      <p v-if="skillPackage.references.length > 10">
        ... and {{ skillPackage.references.length - 10 }} more references
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { SkillPackage } from '@/core/types'

interface Props {
  skillPackage: SkillPackage | null
}

const props = defineProps<Props>()

const previewSkillMd = computed(() => {
  if (!props.skillPackage) return ''
  const lines = props.skillPackage.skillMd.split('\n')
  return lines.slice(0, 30).join('\n') + (lines.length > 30 ? '\n...' : '')
})

const totalSize = computed(() => {
  if (!props.skillPackage) return 0
  let size = props.skillPackage.skillMd.length
  for (const ref of props.skillPackage.references) {
    size += ref.content.length
  }
  return size
})

function formatSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}
</script>

<style scoped>
.skill-preview {
  margin-bottom: 2rem;
  padding: 1rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: #f9f9f9;
}

h2 {
  margin-top: 0;
}

.stats p {
  margin: 0.5rem 0;
}

.skill-md, .references {
  margin-top: 1rem;
}

h3 {
  margin-bottom: 0.5rem;
}

pre {
  background: white;
  padding: 1rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  overflow-x: auto;
  font-size: 0.85rem;
  max-height: 400px;
  overflow-y: auto;
}

.references ul {
  list-style: none;
  padding: 0;
  max-height: 300px;
  overflow-y: auto;
}

.references li {
  padding: 0.5rem;
  margin-bottom: 0.25rem;
  background: white;
  border: 1px solid #eee;
  border-radius: 4px;
  font-size: 0.9rem;
}

.references code {
  background: #e8e8e8;
  padding: 0.2rem 0.4rem;
  border-radius: 3px;
  font-size: 0.85rem;
}
</style>
