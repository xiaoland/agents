import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

// ============================================================================
// Types
// ============================================================================

export interface StoreNameItem {
  id: string
  // Add item properties here
}

// ============================================================================
// Store
// ============================================================================

export const useStoreNameStore = defineStore('store-name', () => {
  // --------------------------------------------------------------------------
  // State
  // --------------------------------------------------------------------------

  const items = ref<StoreNameItem[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // --------------------------------------------------------------------------
  // Getters
  // --------------------------------------------------------------------------

  const isEmpty = computed(() => items.value.length === 0)

  const getById = computed(() => {
    return (id: string): StoreNameItem | undefined => {
      return items.value.find((item) => item.id === id)
    }
  })

  // --------------------------------------------------------------------------
  // Actions
  // --------------------------------------------------------------------------

  async function fetch(): Promise<void> {
    isLoading.value = true
    error.value = null

    try {
      // items.value = await api.fetchItems()
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to fetch'
    } finally {
      isLoading.value = false
    }
  }

  function add(item: StoreNameItem): void {
    items.value.push(item)
  }

  function remove(id: string): void {
    items.value = items.value.filter((item) => item.id !== id)
  }

  function reset(): void {
    items.value = []
    isLoading.value = false
    error.value = null
  }

  // --------------------------------------------------------------------------
  // Return
  // --------------------------------------------------------------------------

  return {
    // State
    items,
    isLoading,
    error,
    // Getters
    isEmpty,
    getById,
    // Actions
    fetch,
    add,
    remove,
    reset,
  }
})

// ============================================================================
// Store Type Export
// ============================================================================

export type StoreNameStore = ReturnType<typeof useStoreNameStore>
