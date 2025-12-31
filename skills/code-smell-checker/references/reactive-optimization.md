# Reactive Optimization

## 1. Unnecessary Reactivity

**Bad:**
```typescript
// Everything reactive
const config = reactive({
  apiUrl: 'https://api.example.com',
  timeout: 5000,
  retries: 3,
  // Never changes!
})

// Deep reactivity on huge data
const largeTable = reactive({
  rows: Array(10000).fill(null).map((_, i) => ({
    id: i,
    name: `User ${i}`,
    // 20+ fields
  }))
})
```

**Better:**
```typescript
// Constants
const CONFIG = {
  apiUrl: 'https://api.example.com',
  timeout: 5000,
  retries: 3,
} as const

// Shallow if rarely changes
const config = shallowReactive({
  apiUrl: 'https://api.example.com',
  timeout: 5000,
})

// Shallow for large data
const largeTable = shallowRef([/* 10000+ rows */])

// Replace array to update
largeTable.value = [...largeTable.value, newRow]

// Mark raw for static
const staticData = markRaw(largeDataset)
```

**Check:**
- [ ] Static values reactive?
- [ ] Large datasets shallow?
- [ ] `markRaw` for static data?

---

## 2. Update Frequency

**Bad:**
```typescript
// API call every keystroke!
const search = ref('')
watch(search, async () => {
  results.value = await api.search(search.value)
})

// Hundreds of updates per second
const mousePos = reactive({ x: 0, y: 0 })
window.addEventListener('mousemove', (e) => {
  mousePos.x = e.clientX
  mousePos.y = e.clientY
})
```

**Better:**
```typescript
// Debounce search
import { useDebounceFn } from '@vueuse/core'

const search = ref('')
const performSearch = useDebounceFn(async () => {
  results.value = await api.search(search.value)
}, 300)

watch(search, performSearch)

// Throttle mouse tracking
import { useThrottleFn } from '@vueuse/core'

const mousePos = reactive({ x: 0, y: 0 })
const updatePos = useThrottleFn((e: MouseEvent) => {
  mousePos.x = e.clientX
  mousePos.y = e.clientY
}, 100)

window.addEventListener('mousemove', updatePos)

// Or use VueUse
import { useMouse } from '@vueuse/core'
const { x, y } = useMouse()
```

**Patterns:**
- **Debounce**: Wait for pause (search, input)
- **Throttle**: Limit frequency (scroll, resize, mouse)
- **RequestAnimationFrame**: Visual updates (animations)

**Check:**
- [ ] Frequent updates debounced/throttled?
- [ ] Search/input debounced?
- [ ] Mouse/scroll throttled?

---

## 3. Template Optimization

**v-memo:**
```vue
<!-- Skip re-render if deps unchanged -->
<div
  v-for="item in list"
  :key="item.id"
  v-memo="[item.id, item.name]"
>
  {{ item.name }}
</div>
```

**v-once for static:**
```vue
<div v-once>
  {{ staticContent }}
</div>
```

**v-show vs v-if:**
```vue
<!-- Frequent toggle → v-show -->
<div v-show="isVisible">Content</div>

<!-- Rare toggle → v-if -->
<div v-if="userRole === 'admin'">Admin</div>

<!-- Never rendered → v-if -->
<div v-if="hasPermission">Sensitive</div>
```

---

## 4. Component Optimization

**Lazy loading:**
```typescript
const HeavyComponent = defineAsyncComponent(() =>
  import('./HeavyComponent.vue')
)
```

**Virtual scrolling:**
```typescript
// For long lists (1000+ items)
import { useVirtualList } from '@vueuse/core'

const { list, containerProps, wrapperProps } = useVirtualList(
  items,
  { itemHeight: 50 }
)
```

**Component splitting:**
```vue
<!-- Bad - one huge component -->
<UserDashboard>
  <!-- 500+ lines -->
</UserDashboard>

<!-- Better - split -->
<UserDashboard>
  <UserHeader />
  <UserStats />
  <UserPosts />
  <UserSettings />
</UserDashboard>
```

---

## 5. Computed Caching

**Leverage caching:**
```typescript
// Cached - only recalcs when deps change
const filtered = computed(() =>
  users.value.filter(isActive)
)

// Not cached - new array every access
function getActiveUsers() {
  return users.value.filter(isActive)
}
```

**Avoid breaking cache:**
```typescript
// Bad - creates new function every time
const filtered = computed(() =>
  users.value.filter(u => isActive(u))
)

// Better - stable function reference
const isActiveUser = (u: User) => isActive(u)
const filtered = computed(() =>
  users.value.filter(isActiveUser)
)
```

---

## 6. Performance Tips

**Quick wins:**
- Use `shallowRef`/`shallowReactive` for large data
- `markRaw` for non-reactive data
- `v-once` for static content
- `v-memo` for expensive list items
- Split large components
- Lazy load heavy components
- Virtual scroll for long lists

**Profiling:**
```typescript
// Track computed recalcs
const expensive = computed(() => {
  console.time('expensive')
  const result = doExpensiveWork()
  console.timeEnd('expensive')
  return result
})

// Track dependencies
watchEffect(() => {
  console.log('Deps:', {
    userId: userId.value,
    filter: filter.value
  })
})
```

**Vue DevTools:**
- Performance tab: profile reactivity
- Component inspector: view state
- Timeline: track events/updates

**Check:**
- [ ] Profiled for bottlenecks?
- [ ] Large components split?
- [ ] Long lists virtualized?
- [ ] Heavy components lazy loaded?
