# Setup Stores Guide

See [assets/storeName.ts](../assets/storeName.ts) for the starter template.

## Basic Structure

Setup Stores use the Composition API style with `ref()`, `computed()`, and functions:

```typescript
import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

export const useCounterStore = defineStore('counter', () => {
  // State - use ref() for reactive values
  const count = ref(0)
  const name = ref('Eduardo')

  // Getters - use computed() for derived state
  const doubleCount = computed(() => count.value * 2)

  // Actions - plain functions that modify state
  function increment() {
    count.value++
  }

  function reset() {
    count.value = 0
  }

  // Return everything that should be public
  return { count, name, doubleCount, increment, reset }
})
```

## State Patterns

### Primitive State

```typescript
const count = ref(0)
const name = ref('')
const isLoading = ref(false)
```

### Object State

```typescript
interface User {
  id: string
  name: string
  email: string
}

const user = ref<User | null>(null)
```

### Array State

```typescript
interface Item {
  id: string
  name: string
}

const items = ref<Item[]>([])
```

### Shallow Ref for Large Objects

Use `shallowRef()` when you only need to track reference changes, not deep mutations:

```typescript
import { shallowRef } from 'vue'

const largeData = shallowRef<LargeObject | null>(null)

// Triggers reactivity
largeData.value = newLargeObject

// Does NOT trigger reactivity (use this for performance)
largeData.value.someProperty = 'new value'
```

## Getter Patterns

### Simple Getter

```typescript
const doubleCount = computed(() => count.value * 2)
```

### Getter with Other Getters

```typescript
const count = ref(0)
const doubleCount = computed(() => count.value * 2)
const quadrupleCount = computed(() => doubleCount.value * 2)
```

### Getter with Parameters

Return a function from the computed:

```typescript
const items = ref<Item[]>([])

const getItemById = computed(() => {
  return (id: string) => items.value.find(item => item.id === id)
})

// Usage: store.getItemById('123')
```

### Boolean Getters

```typescript
const items = ref<Item[]>([])
const user = ref<User | null>(null)

const isEmpty = computed(() => items.value.length === 0)
const isLoggedIn = computed(() => user.value !== null)
const hasItems = computed(() => items.value.length > 0)
```

## Action Patterns

### Synchronous Actions

```typescript
function increment() {
  count.value++
}

function addItem(item: Item) {
  items.value.push(item)
}

function removeItem(id: string) {
  items.value = items.value.filter(item => item.id !== id)
}

function reset() {
  count.value = 0
  items.value = []
}
```

### Async Actions

```typescript
const data = ref<Data | null>(null)
const isLoading = ref(false)
const error = ref<Error | null>(null)

async function fetchData() {
  isLoading.value = true
  error.value = null

  try {
    data.value = await api.getData()
  } catch (e) {
    error.value = e instanceof Error ? e : new Error('Unknown error')
  } finally {
    isLoading.value = false
  }
}
```

### Actions Calling Other Actions

```typescript
function increment() {
  count.value++
}

function incrementTwice() {
  increment()
  increment()
}
```

## Using Stores in Components

### Basic Usage

```vue
<script setup lang="ts">
import { useCounterStore } from '@/stores/counter'

const store = useCounterStore()
// Access state: store.count
// Call actions: store.increment()
</script>

<template>
  <div>{{ store.count }}</div>
  <button @click="store.increment">+1</button>
</template>
```

### Destructuring with storeToRefs

Use `storeToRefs()` to preserve reactivity when destructuring state and getters:

```vue
<script setup lang="ts">
import { useCounterStore } from '@/stores/counter'
import { storeToRefs } from 'pinia'

const store = useCounterStore()

// State and getters - must use storeToRefs for reactivity
const { count, doubleCount } = storeToRefs(store)

// Actions can be destructured directly (they're just functions)
const { increment, reset } = store
</script>

<template>
  <div>{{ count }} (double: {{ doubleCount }})</div>
  <button @click="increment">+1</button>
  <button @click="reset">Reset</button>
</template>
```

### Watching Store State

```vue
<script setup lang="ts">
import { watch } from 'vue'
import { useCounterStore } from '@/stores/counter'
import { storeToRefs } from 'pinia'

const store = useCounterStore()
const { count } = storeToRefs(store)

watch(count, (newCount) => {
  console.log('Count changed:', newCount)
})

// Or watch the entire store
watch(
  () => store.count,
  (newCount) => {
    console.log('Count changed:', newCount)
  }
)
</script>
```

## Common Patterns

### Loading/Error State Pattern

```typescript
export const useDataStore = defineStore('data', () => {
  const data = ref<Data[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  async function fetch() {
    isLoading.value = true
    error.value = null

    try {
      data.value = await api.fetchData()
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to fetch'
    } finally {
      isLoading.value = false
    }
  }

  function reset() {
    data.value = []
    isLoading.value = false
    error.value = null
  }

  return { data, isLoading, error, fetch, reset }
})
```

### CRUD Pattern

```typescript
export const useItemsStore = defineStore('items', () => {
  const items = ref<Item[]>([])

  const getById = computed(() => {
    return (id: string) => items.value.find(item => item.id === id)
  })

  function add(item: Item) {
    items.value.push(item)
  }

  function update(id: string, updates: Partial<Item>) {
    const index = items.value.findIndex(item => item.id === id)
    if (index !== -1) {
      items.value[index] = { ...items.value[index], ...updates }
    }
  }

  function remove(id: string) {
    items.value = items.value.filter(item => item.id !== id)
  }

  return { items, getById, add, update, remove }
})
```

### Pagination Pattern

```typescript
export const usePaginatedStore = defineStore('paginated', () => {
  const items = ref<Item[]>([])
  const page = ref(1)
  const pageSize = ref(20)
  const total = ref(0)
  const isLoading = ref(false)

  const hasMore = computed(() => items.value.length < total.value)
  const totalPages = computed(() => Math.ceil(total.value / pageSize.value))

  async function fetchPage(pageNum: number) {
    isLoading.value = true
    try {
      const result = await api.fetch({ page: pageNum, size: pageSize.value })
      items.value = result.items
      total.value = result.total
      page.value = pageNum
    } finally {
      isLoading.value = false
    }
  }

  async function nextPage() {
    if (hasMore.value) {
      await fetchPage(page.value + 1)
    }
  }

  return { items, page, total, hasMore, totalPages, isLoading, fetchPage, nextPage }
})
```
