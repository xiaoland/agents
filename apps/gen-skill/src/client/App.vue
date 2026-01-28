<template>
  <div id="app">
    <header>
      <h1>🤖 Agent Skill Generator</h1>
      <p class="subtitle">Convert documentation sites into Agent Skills</p>
    </header>

    <main>
      <!-- Step 1: URL Input -->
      <UrlInput :disabled="isProcessing" @discover="handleDiscover" />

      <!-- Step 2: Discovery Result -->
      <!-- NEW: Filters Component -->
      <Filters
        v-if="discoveryResult && discoveryResult.entries.length > 0"
        :filter-state="filterState"
        :total-entries="discoveryResult.entries.length"
        :filtered-entries="filteredEntries"
        :is-processing="isProcessing"
        @filters-change="handleFiltersChange"
      />

      <DiscoveryResultComponent
        v-if="discoveryResult"
        :result="discoveryResult"
        :filtered-entries="filteredEntries"
        :total-entries="discoveryResult.entries.length"
      />

      <!-- Action Buttons after Discovery -->
      <div
        v-if="discoveryResult && discoveryResult.entries.length > 0"
        class="actions"
      >
        <button
          @click="handleFetchAndGenerate"
          :disabled="isProcessing"
          class="primary-btn"
        >
          {{ isProcessing ? "Processing..." : "Fetch & Generate Skill" }}
        </button>
      </div>

      <!-- Step 3: Fetch Progress -->
      <FetchProgressComponent
        v-if="fetchProgress.total > 0"
        :progress="fetchProgress"
      />

      <!-- Step 4: Skill Preview -->
      <SkillPreview v-if="skillPackage" :skillPackage="skillPackage" />

      <!-- Step 5: Export Button -->
      <ExportButton
        v-if="skillPackage"
        :disabled="zipLoading"
        :loading="zipLoading"
        @export="handleExport"
      />

      <!-- Error Display -->
      <div v-if="error" class="error">
        <h3>Error</h3>
        <p>{{ error }}</p>
      </div>
    </main>

    <footer>
      <p>Built with Vue 3 + TypeScript | Deploy to Cloudflare Workers</p>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import UrlInput from "./components/UrlInput.vue";
import Filters from "./components/Filters.vue";
import DiscoveryResultComponent from "./components/DiscoveryResult.vue";
import FetchProgressComponent from "./components/FetchProgress.vue";
import SkillPreview from "./components/SkillPreview.vue";
import ExportButton from "./components/ExportButton.vue";

import { useDocSiteDiscovery } from "./composables/useDocSiteDiscovery";
import { useDocFetcher } from "./composables/useDocFetcher";
import { useDocParser } from "./composables/useDocParser";
import { useSkillGenerator } from "./composables/useSkillGenerator";
import { useZipExporter } from "./composables/useZipExporter";

import type {
  DiscoveryResult,
  SkillPackage,
  SkillMeta,
  FilterState,
} from "@/core/types";

// Composables
const { discover } = useDocSiteDiscovery();
const { fetchAll, progress: fetchProgress } = useDocFetcher();
const { parse } = useDocParser();
const { generate } = useSkillGenerator();
const { exportZip, loading: zipLoading } = useZipExporter();

// State
const discoveryResult = ref<DiscoveryResult | null>(null);
const skillPackage = ref<SkillPackage | null>(null);
const isProcessing = ref(false);
const error = ref<string | null>(null);

// NEW: Filter state
const filterState = ref<FilterState>({
  baseUrlOnly: false,
});

// NEW: Computed filtered entries
const filteredEntries = computed(() => {
  if (!discoveryResult.value) return [];

  let entries = discoveryResult.value.entries;

  // Apply base URL filter
  if (filterState.value.baseUrlOnly) {
    const result = discoveryResult.value;
    const baseUrl = new URL(result.baseUrl);
    entries = entries.filter((entry) => {
      try {
        // Try to parse as absolute URL, if it fails, resolve as relative URL
        let entryUrl: URL;
        try {
          entryUrl = new URL(entry.url);
        } catch {
          // If entry.url is relative, resolve it against baseUrl
          entryUrl = new URL(entry.url, result.baseUrl);
        }
        return entryUrl.origin === baseUrl.origin;
      } catch {
        return false;
      }
    });
  }

  // Future: Apply category filter
  // if (filterState.value.categories?.length) {
  //   entries = entries.filter(e => filterState.value.categories.includes(e.category))
  // }

  // Future: Apply search filter
  // if (filterState.value.searchText) {
  //   entries = entries.filter(e =>
  //     e.title.toLowerCase().includes(filterState.value.searchText.toLowerCase())
  //   )
  // }

  return entries;
});

/**
 * Handle discovery of documentation site
 */
async function handleDiscover(url: string) {
  isProcessing.value = true;
  error.value = null;
  discoveryResult.value = null;
  skillPackage.value = null;

  try {
    const result = await discover(url);
    discoveryResult.value = result;

    if (result.type === "unknown") {
      error.value =
        "This site does not have llms.txt or llms-full.txt. Only sites with these files are supported.";
    } else if (result.entries.length === 0) {
      error.value = "No documentation entries found in llms.txt";
    }
  } catch (e) {
    error.value = e instanceof Error ? e.message : String(e);
  } finally {
    isProcessing.value = false;
  }
}

/**
 * Handle fetching and generating skill
 */
async function handleFetchAndGenerate() {
  if (!discoveryResult.value) return;

  isProcessing.value = true;
  error.value = null;

  try {
    // Step 1: Fetch all documents
    // CHANGE: Use filteredEntries instead of discoveryResult.value.entries
    const fetchedDocs = await fetchAll(filteredEntries.value);

    // Step 2: Parse documents
    const parsedDocs = parse(fetchedDocs);

    if (parsedDocs.length === 0) {
      error.value = "No valid documents could be parsed";
      return;
    }

    // Step 3: Generate skill
    const meta: SkillMeta = {
      name:
        discoveryResult.value.rawContent.split("\n")[0]?.replace(/^#\s*/, "") ||
        "Documentation",
      description:
        discoveryResult.value.rawContent
          .split("\n")
          .find((line) => line.startsWith(">"))
          ?.replace(/^>\s*/, "") || "Generated skill from documentation site",
      sourceUrl: discoveryResult.value.baseUrl,
    };

    skillPackage.value = generate(parsedDocs, meta);
  } catch (e) {
    error.value = e instanceof Error ? e.message : String(e);
  } finally {
    isProcessing.value = false;
  }
}

/**
 * Handle exporting ZIP
 */
async function handleExport() {
  if (!skillPackage.value || !discoveryResult.value) return;

  try {
    const filename = discoveryResult.value.baseUrl
      .replace(/^https?:\/\//, "")
      .replace(/\./g, "-")
      .replace(/\//g, "-");

    await exportZip(skillPackage.value, filename);
  } catch (e) {
    error.value = e instanceof Error ? e.message : String(e);
  }
}

// NEW: Handle filter changes
function handleFiltersChange(filters: FilterState) {
  filterState.value = filters;
}
</script>

<style>
* {
  box-sizing: border-box;
}

body {
  margin: 0;
  font-family:
    -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu,
    Cantarell, sans-serif;
  line-height: 1.6;
  color: #333;
}

#app {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

header {
  text-align: center;
  margin-bottom: 3rem;
}

h1 {
  margin: 0;
  color: #42b983;
  font-size: 2.5rem;
}

.subtitle {
  margin: 0.5rem 0 0;
  color: #666;
  font-size: 1.2rem;
}

main {
  min-height: 400px;
}

.actions {
  text-align: center;
  margin: 2rem 0;
}

.primary-btn {
  padding: 1rem 2rem;
  background: #42b983;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1.1rem;
  font-weight: bold;
}

.primary-btn:hover:not(:disabled) {
  background: #35a372;
}

.primary-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.error {
  padding: 1rem;
  background: #f8d7da;
  border: 1px solid #f5c6cb;
  border-radius: 4px;
  margin: 2rem 0;
}

.error h3 {
  margin-top: 0;
  color: #721c24;
}

.error p {
  margin: 0;
  color: #721c24;
}

footer {
  margin-top: 4rem;
  padding-top: 2rem;
  border-top: 1px solid #ddd;
  text-align: center;
  color: #666;
  font-size: 0.9rem;
}
</style>
