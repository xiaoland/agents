# Watch and WatchEffect

## 1. Watch Anti-Patterns

**Bad:**
```typescript
// Using watch for transformation - use computed!
const userInput = ref('')
const processedValue = ref('')

watch(userInput, (newValue) => {
  processedValue.value = transform(newValue)
})

// Watch chains - dependency web
watch(stateA, () => {
  stateB.value = calculateB(stateA.value)
})

watch(stateB, () => {
  stateC.value = calculateC(stateB.value)
})

watch(stateC, () => {
  stateA.value = calculateA(stateC.value)  // Circular!
})

// No cleanup
const stop = watch(source, callback)
// Component unmounts, watch still runs!

// Watch every property
watch(() => user.value.name, handleName)
watch(() => user.value.email, handleEmail)
watch(() => user.value.age, handleAge)
```

**Better:**
```typescript
// Transformation → computed
const processedValue = computed(() =>
  transform(userInput.value)
)

// Avoid chains - redesign
const finalState = computed(() => {
  const b = calculateB(stateA.value)
  const c = calculateC(b)
  return c
})

// Watch for side effects only
watch(userId, async (id) => {
  isLoading.value = true
  try {
    userData.value = await fetchUser(id)
  } finally {
    isLoading.value = false
  }
})

// Cleanup
const stop = watch(source, callback)
onUnmounted(() => stop())

// Or auto-cleanup
watchEffect(() => {
  // Cleaned up on unmount
})

// Watch object efficiently
watch(
  () => user.value,
  handleUserChange,
  { deep: true }
)

// Or selected properties
watch(
  () => ({
    name: user.value.name,
    email: user.value.email
  }),
  handleChange
)
```

**Check:**
- [ ] Watch doing transformation?
- [ ] Watch chains?
- [ ] Manual watches cleaned up?
- [ ] `deep: true` unnecessary?
- [ ] >5 watchers in component?

---

## 2. Watch vs WatchEffect

**Watch:**
```typescript
// Explicit deps, lazy, access old value
watch(
  () => user.value.id,
  (newId, oldId) => {
    console.log(`${oldId} → ${newId}`)
  },
  { immediate: false }
)
```

**WatchEffect:**
```typescript
// Auto-track, eager
watchEffect(() => {
  console.log(`User ID: ${user.value.id}`)
  // Runs immediately
})
```

**Use watch when:**
- Need old value
- Lazy execution
- Explicit dependencies

**Use watchEffect when:**
- Don't need old value
- Eager execution
- Auto-tracking easier

---

## 3. Watch Options

**Immediate:**
```typescript
// Run on mount and on changes
watch(userId, fetchUser, { immediate: true })

// Or use watchEffect
watchEffect(() => {
  if (userId.value) fetchUser(userId.value)
})
```

**Flush timing:**
```typescript
// Default: before DOM update
watch(count, () => {
  console.log('Pre-update')
})

// After DOM update
watch(count, () => {
  console.log('Post-update')
  // Can access updated DOM
}, { flush: 'post' })

// Sync (rare)
watch(count, () => {
  console.log('Sync')
}, { flush: 'sync' })
```

**Deep:**
```typescript
// Watch nested properties
watch(
  () => state.nested,
  handleChange,
  { deep: true }
)

// Or watch specific paths
watch(
  () => state.nested.prop,
  handleChange
)
```

---

## 4. Debounce and Throttle

**Debounce - wait for pause:**
```typescript
import { watchDebounced } from '@vueuse/core'

// Search after typing stops
watchDebounced(
  searchTerm,
  () => performSearch(),
  { debounce: 300 }
)

// Or manual
import { useDebounceFn } from '@vueuse/core'

const search = ref('')
const performSearch = useDebounceFn(async () => {
  results.value = await api.search(search.value)
}, 300)

watch(search, performSearch)
```

**Throttle - limit frequency:**
```typescript
import { watchThrottled } from '@vueuse/core'

// Update position max once per 100ms
watchThrottled(
  scrollPosition,
  () => updateUI(),
  { throttle: 100 }
)

// Or manual
import { useThrottleFn } from '@vueuse/core'

const updatePosition = useThrottleFn((e: MouseEvent) => {
  position.x = e.clientX
  position.y = e.clientY
}, 100)
```

---

## 5. Advanced Patterns

**Conditional watching:**
```typescript
// Only watch when condition met
const shouldWatch = ref(false)

watchEffect(() => {
  if (!shouldWatch.value) return

  // Watch logic here
  console.log(data.value)
})
```

**Multiple sources:**
```typescript
// Watch multiple values
watch(
  [userId, filter],
  ([newUserId, newFilter]) => {
    fetchFilteredUser(newUserId, newFilter)
  }
)
```

**Async handling:**
```typescript
// Cancel previous async operation
let controller: AbortController | null = null

watch(searchTerm, async (term) => {
  // Cancel previous request
  controller?.abort()
  controller = new AbortController()

  try {
    results.value = await api.search(term, {
      signal: controller.signal
    })
  } catch (error) {
    if (error.name !== 'AbortError') {
      console.error(error)
    }
  }
})
```
