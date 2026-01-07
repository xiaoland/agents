# TypeScript Guide for Pinia Stores

## Typing State

Always explicitly type your state refs:

```typescript
import { ref } from 'vue'
import { defineStore } from 'pinia'

interface User {
  id: string
  name: string
  email: string
}

interface CartItem {
  productId: string
  quantity: number
  price: number
}

export const useAppStore = defineStore('app', () => {
  // Primitives
  const count = ref<number>(0)
  const name = ref<string>('')
  const isLoading = ref<boolean>(false)

  // Objects - nullable
  const currentUser = ref<User | null>(null)

  // Arrays
  const items = ref<CartItem[]>([])

  // Union types
  const status = ref<'idle' | 'loading' | 'success' | 'error'>('idle')

  return { count, name, isLoading, currentUser, items, status }
})
```

## Typing Getters

TypeScript infers getter types from computed return values:

```typescript
import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

export const useCounterStore = defineStore('counter', () => {
  const count = ref(0)

  // Type is inferred as ComputedRef<number>
  const doubleCount = computed(() => count.value * 2)

  // Type is inferred as ComputedRef<boolean>
  const isPositive = computed(() => count.value > 0)

  return { count, doubleCount, isPositive }
})
```

### Getter with Parameters

```typescript
interface Item {
  id: string
  name: string
}

export const useItemsStore = defineStore('items', () => {
  const items = ref<Item[]>([])

  // Returns a function - type is ComputedRef<(id: string) => Item | undefined>
  const getById = computed(() => {
    return (id: string): Item | undefined => {
      return items.value.find(item => item.id === id)
    }
  })

  return { items, getById }
})
```

## Typing Actions

Type parameters and return values for clarity:

```typescript
interface User {
  id: string
  name: string
}

export const useUserStore = defineStore('user', () => {
  const user = ref<User | null>(null)
  const error = ref<string | null>(null)

  // Async action with typed return
  async function login(email: string, password: string): Promise<boolean> {
    try {
      user.value = await api.login(email, password)
      return true
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Login failed'
      return false
    }
  }

  // Action with complex parameter
  function updateUser(updates: Partial<User>): void {
    if (user.value) {
      user.value = { ...user.value, ...updates }
    }
  }

  return { user, error, login, updateUser }
})
```

## Exporting Store Types

Export the store return type for consumers:

```typescript
import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

export const useCounterStore = defineStore('counter', () => {
  const count = ref(0)
  const doubleCount = computed(() => count.value * 2)

  function increment() {
    count.value++
  }

  return { count, doubleCount, increment }
})

// Export the store type
export type CounterStore = ReturnType<typeof useCounterStore>
```

### Using Store Types

```typescript
import type { CounterStore } from '@/stores/counter'

function processStore(store: CounterStore) {
  console.log(store.count)
  store.increment()
}
```

## Generic Stores

Create reusable store factories:

```typescript
import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

// Generic CRUD store factory
export function createCrudStore<T extends { id: string }>(
  name: string,
  fetchAll: () => Promise<T[]>
) {
  return defineStore(name, () => {
    const items = ref<T[]>([])
    const isLoading = ref(false)

    const getById = computed(() => {
      return (id: string): T | undefined => {
        return items.value.find(item => item.id === id)
      }
    })

    async function fetch() {
      isLoading.value = true
      try {
        items.value = await fetchAll()
      } finally {
        isLoading.value = false
      }
    }

    function add(item: T) {
      items.value.push(item)
    }

    function remove(id: string) {
      items.value = items.value.filter(item => item.id !== id)
    }

    return { items, isLoading, getById, fetch, add, remove }
  })
}

// Usage
interface Product {
  id: string
  name: string
  price: number
}

export const useProductsStore = createCrudStore<Product>(
  'products',
  () => api.getProducts()
)
```

## Typing with External APIs

```typescript
import { ref } from 'vue'
import { defineStore } from 'pinia'

// API response types
interface ApiResponse<T> {
  data: T
  meta: {
    total: number
    page: number
  }
}

interface Product {
  id: string
  name: string
  price: number
}

export const useProductsStore = defineStore('products', () => {
  const products = ref<Product[]>([])
  const total = ref(0)
  const page = ref(1)

  async function fetchProducts(): Promise<void> {
    const response: ApiResponse<Product[]> = await api.get('/products', {
      page: page.value
    })

    products.value = response.data
    total.value = response.meta.total
    page.value = response.meta.page
  }

  return { products, total, page, fetchProducts }
})
```

## Avoiding Common Type Issues

### Don't Use `any`

```typescript
// BAD
const data = ref<any>(null)

// GOOD
interface Data {
  id: string
  value: number
}
const data = ref<Data | null>(null)
```

### Type Narrowing in Actions

```typescript
const user = ref<User | null>(null)

function requireUser(): User {
  if (!user.value) {
    throw new Error('User is required')
  }
  return user.value
}

async function updateProfile(updates: Partial<User>) {
  const current = requireUser() // Now typed as User, not User | null
  await api.updateUser(current.id, updates)
}
```

### Readonly State for Getters

Use `readonly` when exposing state that shouldn't be modified directly:

```typescript
import { ref, computed, readonly } from 'vue'
import { defineStore } from 'pinia'

export const useCounterStore = defineStore('counter', () => {
  const _count = ref(0)

  // Expose as readonly - consumers can't modify directly
  const count = readonly(_count)

  // Only actions can modify
  function increment() {
    _count.value++
  }

  return { count, increment }
})
```

## Best Practices

1. **Always type state refs explicitly** - Don't rely on inference for state

2. **Let TypeScript infer computed types** - Explicit typing is usually unnecessary for getters

3. **Type action parameters and returns** - Makes the API clear and catches errors

4. **Export store types** - Allows typing store references in components

5. **Use type guards for null checks** - Properly narrow types before accessing properties

6. **Avoid `as` assertions** - Use proper typing or type guards instead

7. **Use `readonly` for immutable state** - Prevent accidental mutations outside actions
