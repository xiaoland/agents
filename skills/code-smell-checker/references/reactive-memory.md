# Memory Management

## 1. Cleanup Watchers

**Bad:**
```typescript
// Watch never cleaned up
const stop = watch(source, callback)
// Component unmounts, watch still active!
```

**Better:**
```typescript
// Manual cleanup
const stop = watch(source, callback)
onUnmounted(() => stop())

// Or auto-cleanup
watchEffect(() => {
  // Cleaned up automatically on unmount
})
```

**Check:**
- [ ] Manual watchers cleaned up?

---

## 2. Event Listeners

**Bad:**
```typescript
// Listener never removed
onMounted(() => {
  window.addEventListener('resize', handler)
  // Leaks!
})
```

**Better:**
```typescript
// Manual cleanup
onMounted(() => {
  window.addEventListener('resize', handler)
})
onUnmounted(() => {
  window.removeEventListener('resize', handler)
})

// Or use VueUse
import { useEventListener } from '@vueuse/core'
useEventListener(window, 'resize', handler)
```

**Check:**
- [ ] Event listeners removed?

---

## 3. Intervals and Timeouts

**Bad:**
```typescript
// Runs forever
onMounted(() => {
  setInterval(() => {
    // Memory leak!
  }, 1000)
})
```

**Better:**
```typescript
// Clear interval
const intervalId = ref<number>()

onMounted(() => {
  intervalId.value = setInterval(() => {}, 1000)
})

onUnmounted(() => {
  if (intervalId.value) {
    clearInterval(intervalId.value)
  }
})

// Or use composable
import { useIntervalFn } from '@vueuse/core'
const { pause, resume } = useIntervalFn(() => {}, 1000)
```

**Check:**
- [ ] Intervals/timeouts cleared?

---

## 4. Cache Management

**Bad:**
```typescript
// Cache grows infinitely
const cache = reactive({
  data: new Map()
})

function addToCache(key: string, value: any) {
  cache.data.set(key, value)
  // Never cleaned!
}
```

**Better:**
```typescript
// Limit cache size
const MAX_CACHE_SIZE = 1000
const cache = reactive({
  data: new Map<string, any>()
})

function addToCache(key: string, value: any) {
  if (cache.data.size >= MAX_CACHE_SIZE) {
    const firstKey = cache.data.keys().next().value
    cache.data.delete(firstKey)
  }
  cache.data.set(key, value)
}

// Or use WeakMap for auto cleanup
const weakCache = new WeakMap<object, any>()
// Keys automatically garbage collected

// Or LRU cache
import { useLRU } from '@vueuse/core'
const cache = useLRU(100) // Max 100 items
```

**Check:**
- [ ] Caches have size limits?
- [ ] WeakMap used where appropriate?
- [ ] Old entries cleaned up?

---

## 5. Component References

**Bad:**
```typescript
// Keeping refs to destroyed components
const components = ref<ComponentInstance[]>([])

function addComponent(comp: ComponentInstance) {
  components.value.push(comp)
  // Never removed even after unmount
}
```

**Better:**
```typescript
// Clean up refs
const components = ref<ComponentInstance[]>([])

function addComponent(comp: ComponentInstance) {
  components.value.push(comp)

  // Clean up when component unmounts
  onBeforeUnmount(() => {
    const index = components.value.indexOf(comp)
    if (index > -1) {
      components.value.splice(index, 1)
    }
  })
}

// Or use WeakSet
const components = new WeakSet<ComponentInstance>()
```

**Check:**
- [ ] Component refs cleaned up?
- [ ] WeakSet/WeakMap for component tracking?

---

## 6. Third-Party Libraries

**Bad:**
```typescript
// Library instance never destroyed
onMounted(() => {
  const editor = new Monaco.Editor(el)
  // Leaks when component unmounts
})
```

**Better:**
```typescript
// Destroy on unmount
const editor = ref<Monaco.Editor>()

onMounted(() => {
  editor.value = new Monaco.Editor(el)
})

onUnmounted(() => {
  editor.value?.dispose()
  editor.value = undefined
})

// Mark as raw (no reactivity needed)
const editor = shallowRef<Monaco.Editor>()

onMounted(() => {
  editor.value = markRaw(new Monaco.Editor(el))
})

onUnmounted(() => {
  editor.value?.dispose()
})
```

**Check:**
- [ ] Third-party instances destroyed?
- [ ] Libraries marked raw?
- [ ] Dispose/destroy methods called?

---

## 7. Memory Leak Checklist

**Common sources:**
- [ ] Unwatched watchers
- [ ] Unremoved event listeners
- [ ] Uncleared intervals/timeouts
- [ ] Unbounded caches
- [ ] Undisposed third-party instances
- [ ] Circular references
- [ ] Global state not cleaned
- [ ] Subscriptions not unsubscribed

**Detection:**
```typescript
// Check for leaks in dev
if (import.meta.env.DEV) {
  onUnmounted(() => {
    console.log('Component unmounted, check for leaks')
  })
}

// Use browser dev tools:
// - Memory profiler
// - Heap snapshots
// - Performance monitor
```

**Prevention:**
- Use composables (auto-cleanup)
- Use VueUse utilities
- Always pair setup with cleanup
- Use WeakMap/WeakSet when possible
- Test component mount/unmount cycles
