<template>
  <div class="filters">
    <div class="filters-header">
      <h3>Filters</h3>
      <button v-if="hasActiveFilters" @click="clearAll" class="clear-btn">
        Clear All
      </button>
    </div>

    <div class="filter-controls">
      <div class="filter-item">
        <label class="filter-toggle">
          <input
            type="checkbox"
            :checked="filterState.baseUrlOnly"
            @change="handleBaseUrlToggle"
            :disabled="isProcessing"
          />
          <div class="filter-label">
            <span>Only Base URL</span>
            <span class="filter-hint">
              Only fetch entries from the same domain as the documentation site
            </span>
          </div>
        </label>
      </div>
      <!-- Future filters can be added here -->
    </div>

    <!-- Filter Statistics -->
    <div class="entries-summary">
      <div class="stats-row">
        <span class="stat-label">Total Entries:</span>
        <span class="stat-value">{{ totalEntries }}</span>
      </div>
      <div v-if="filterState.baseUrlOnly" class="stats-row">
        <span class="stat-label">Filtered Entries:</span>
        <span class="stat-value highlight">{{ filteredEntriesCount }}</span>
        <span class="stat-badge">{{ excludedCount }} excluded</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { FilterState, DocEntry } from "@/core/types";

interface Props {
  filterState: FilterState;
  totalEntries: number;
  filteredEntries: DocEntry[];
  isProcessing?: boolean;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  "filters-change": [filters: FilterState];
}>();

const hasActiveFilters = computed(() => {
  return props.filterState.baseUrlOnly;
  // Future: || filterState.categories?.length > 0 || filterState.searchText
});

const filteredEntriesCount = computed(() => {
  return props.filteredEntries.length;
});

const excludedCount = computed(() => {
  return props.totalEntries - props.filteredEntries.length;
});

function handleBaseUrlToggle(event: Event) {
  const target = event.target as HTMLInputElement;
  emit("filters-change", {
    ...props.filterState,
    baseUrlOnly: target.checked,
  });
}

function clearAll() {
  emit("filters-change", {
    baseUrlOnly: false,
    // Reset all future filters
  });
}
</script>

<style scoped>
.filters {
  margin-bottom: 1.5rem;
  padding: 1rem;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  background: #fafafa;
}

.filters-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.filters-header h3 {
  margin: 0;
  font-size: 1.1rem;
  color: #333;
}

.clear-btn {
  padding: 0.4rem 0.8rem;
  background: transparent;
  color: #666;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.85rem;
  transition: all 0.2s;
}

.clear-btn:hover {
  background: #f0f0f0;
  color: #333;
}

.filter-controls {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.filter-item {
  display: flex;
  align-items: center;
}

.filter-toggle {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
}

.filter-toggle input[type="checkbox"] {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

.filter-label {
  display: flex;
  flex-direction: column;
  font-size: 0.95rem;
  color: #333;
}

.filter-hint {
  font-size: 0.8rem;
  color: #666;
  margin-top: 0.1rem;
}

.entries-summary {
  margin: 1.5rem 0;
  padding: 1rem;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border: 2px solid #42b983;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.stats-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1rem;
}

.stat-label {
  color: #666;
  min-width: 120px;
}

.stat-value {
  font-size: 1.3rem;
  font-weight: 700;
  color: #333;
}

.stat-value.highlight {
  color: #42b983;
  font-size: 1.5rem;
}

.stat-value.excluded {
  color: #dc3545;
  font-weight: 600;
}

.stat-badge {
  padding: 0.2rem 0.6rem;
  background: #42b983;
  color: white;
  border-radius: 12px;
  font-size: 0.85rem;
  font-weight: 600;
}
</style>
