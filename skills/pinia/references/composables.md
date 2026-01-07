# Composables in Pinia Stores

## Using VueUse Composables

Setup Stores can leverage composables from VueUse and other libraries:

```typescript
import { defineStore } from 'pinia'
import { useMediaControls } from '@vueuse/core'
import { ref } from 'vue'

export const useVideoPlayer = defineStore('video', () => {
  const videoElement = ref<HTMLVideoElement>()
  const src = ref('/data/video.mp4')

  const { playing, volume, currentTime, togglePictureInPicture } =
    useMediaControls(videoElement, { src })

  function loadVideo(element: HTMLVideoElement, videoSrc: string) {
    videoElement.value = element
    src.value = videoSrc
  }

  return {
    src,
    playing,
    volume,
    currentTime,
    loadVideo,
    togglePictureInPicture,
  }
})
```

## Common VueUse Composables in Stores

### useLocalStorage

Persist state to localStorage:

```typescript
import { defineStore } from 'pinia'
import { useLocalStorage } from '@vueuse/core'

export const useSettingsStore = defineStore('settings', () => {
  const theme = useLocalStorage('theme', 'light')
  const language = useLocalStorage('language', 'en')

  function setTheme(value: 'light' | 'dark') {
    theme.value = value
  }

  return { theme, language, setTheme }
})
```

### useDebounceFn

Debounce actions:

```typescript
import { defineStore } from 'pinia'
import { useDebounceFn } from '@vueuse/core'
import { ref } from 'vue'

export const useSearchStore = defineStore('search', () => {
  const query = ref('')
  const results = ref<SearchResult[]>([])

  const debouncedSearch = useDebounceFn(async (searchQuery: string) => {
    results.value = await api.search(searchQuery)
  }, 300)

  function setQuery(value: string) {
    query.value = value
    debouncedSearch(value)
  }

  return { query, results, setQuery }
})
```

### useAsyncState

Handle async data fetching:

```typescript
import { defineStore } from 'pinia'
import { useAsyncState } from '@vueuse/core'

export const useUserStore = defineStore('user', () => {
  const { state: user, isLoading, error, execute: refetch } = useAsyncState(
    () => api.fetchCurrentUser(),
    null,
    { immediate: true }
  )

  return { user, isLoading, error, refetch }
})
```

## Store Composition (Nested Stores)

Stores can use other stores inside actions and getters:

```typescript
import { defineStore } from 'pinia'
import { useUserStore } from './user'
import { ref, computed } from 'vue'

export const useCartStore = defineStore('cart', () => {
  const user = useUserStore()
  const items = ref<CartItem[]>([])

  // Use other store in computed
  const summary = computed(() => {
    return `Hi ${user.name}, you have ${items.value.length} items in your cart.`
  })

  // Use other store in actions
  async function purchase() {
    if (!user.isLoggedIn) {
      throw new Error('Must be logged in to purchase')
    }
    return await api.purchase(user.id, items.value)
  }

  return { items, summary, purchase }
})
```

### Avoiding Circular Dependencies

When two stores need each other, access the other store inside actions/getters, NOT at the top level:

```typescript
// WRONG - causes circular dependency issues
const useX = defineStore('x', () => {
  const y = useY()
  y.name // Don't access at top level

  return { name: ref('X') }
})

// CORRECT - access inside actions/getters
const useX = defineStore('x', () => {
  const name = ref('X')

  function doSomething() {
    const y = useY() // Get store inside action
    console.log(y.name)
  }

  const combined = computed(() => {
    const y = useY() // Get store inside computed
    return `${name.value} + ${y.name}`
  })

  return { name, doSomething, combined }
})
```

## SSR Considerations

### skipHydrate

For state that shouldn't be hydrated from server (client-specific data, DOM refs):

```typescript
import { defineStore, skipHydrate } from 'pinia'
import { useLocalStorage, useEyeDropper } from '@vueuse/core'

export const useColorStore = defineStore('colors', () => {
  const { isSupported, open, sRGBHex } = useEyeDropper()
  const lastColor = useLocalStorage('lastColor', sRGBHex)

  return {
    // Mark to skip hydration - will use client-side value
    lastColor: skipHydrate(lastColor),
    open,
    isSupported,
  }
})
```

Use `skipHydrate` when:
- State is managed by a composable that handles its own persistence
- State references DOM elements
- State should always be initialized on the client

## Creating Reusable Store Composables

Extract common patterns into composables:

```typescript
// composables/useAsyncData.ts
import { ref, type Ref } from 'vue'

export function useAsyncData<T>(fetcher: () => Promise<T>) {
  const data = ref<T | null>(null) as Ref<T | null>
  const isLoading = ref(false)
  const error = ref<Error | null>(null)

  async function execute() {
    isLoading.value = true
    error.value = null
    try {
      data.value = await fetcher()
    } catch (e) {
      error.value = e instanceof Error ? e : new Error('Unknown error')
    } finally {
      isLoading.value = false
    }
  }

  return { data, isLoading, error, execute }
}

// stores/products.ts
import { defineStore } from 'pinia'
import { useAsyncData } from '@/composables/useAsyncData'

export const useProductsStore = defineStore('products', () => {
  const { data: products, isLoading, error, execute: fetchProducts } =
    useAsyncData(() => api.getProducts())

  return { products, isLoading, error, fetchProducts }
})
```

## Best Practices

1. **Prefer composables over store inheritance** - Keep stores flat, extract shared logic to composables

2. **Access nested stores lazily** - Get store references inside actions/getters, not at setup level

3. **Use skipHydrate for client-only state** - Prevent SSR hydration mismatches

4. **Keep DOM references in components** - Pass elements to stores via actions, don't store refs at top level

5. **Debounce expensive operations** - Use `useDebounceFn` or `useThrottleFn` for search, saves, etc.
