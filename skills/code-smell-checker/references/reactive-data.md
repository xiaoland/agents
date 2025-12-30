# Reactive Data Handling - Maintainability Code Smells

This reference document provides detailed checklists for identifying maintainability issues in Vue 3 reactive data handling.

---

## 1. Reactivity Depth Control

### Code Smell: Unnecessary Deep Reactivity

**Bad Example:**

```typescript
// ❌ Large objects with full deep reactivity
const massiveData = reactive({
  users: [],        // 10000+ items
  posts: [],        // 50000+ items
  comments: [],     // 100000+ items
  metadata: {
    // Complex deeply nested structure
    config: { /* ... */ },
    settings: { /* ... */ },
    cache: { /* ... */ }
  }
})

// ❌ Deep reactivity for collections that don't need it
const userMap = reactive(new Map<string, User>())  // Overkill for Map
const userSet = reactive(new Set<UserId>())        // Overkill for Set

// ❌ Making third-party instances reactive
const chartInstance = reactive(new Chart(canvas))  // Will cause issues!
const editor = reactive(new Monaco.Editor())       // Not needed!
```

**Better Approach:**

```typescript
// ✅ Use shallow reactivity for large datasets
const userList = shallowRef<User[]>([])  // Only track array reference changes
const selectedId = ref<string>()         // Track only the ID

// When data changes, replace the whole array
userList.value = [...userList.value, newUser]  // Triggers update

// ✅ Use shallowReactive for collections
const userCache = shallowReactive(new Map<string, User>())
const selectedIds = shallowReactive(new Set<UserId>())

// ✅ Use markRaw for third-party instances
const chartInstance = markRaw(new Chart(canvas))
const editor = markRaw(new Monaco.Editor())

// ✅ Selective reactivity
const state = reactive({
  // Only make reactive what needs to be
  selectedUserId: null as UserId | null,
  isLoading: false,
  // Keep large data non-reactive
  userData: markRaw([])  // Large dataset, not reactive
})
```

**Performance Considerations:**

```typescript
// Reactivity overhead comparison:
// reactive() - Deep tracking, high overhead for large/nested objects
// shallowReactive() - Shallow tracking, medium overhead
// shallowRef() - Only ref.value tracking, low overhead
// markRaw() - No tracking, zero overhead

// Choose based on your needs:
// - Need deep change detection? → reactive()
// - Need only top-level tracking? → shallowReactive()
// - Need only reference tracking? → shallowRef()
// - Don't need reactivity? → markRaw()
```

**Checklist:**

- [ ] Are large lists/trees using `reactive()` instead of `shallowRef()`?
- [ ] Are third-party library instances (charts, editors, etc.) wrapped in reactive?
- [ ] Have you evaluated using `shallowRef`/`shallowReactive` for performance?
- [ ] Are Maps/Sets unnecessarily deeply reactive?
- [ ] Does performance profiling show excessive reactive dependency tracking?
- [ ] Are there objects with 100+ properties being made fully reactive?
- [ ] Could `markRaw()` be used for static/immutable data?

---

## 2. Computed Property Design

### Code Smell: Computed Properties with Side Effects

**Bad Example:**

```typescript
// ❌ Side effects in computed!
const processedData = computed(() => {
  console.log('Computing...')  // Side effect: logging
  logAnalytics('data-computed')  // Side effect: analytics
  apiService.updateCache(data.value)  // Side effect: API call
  lastComputedTime.value = Date.now()  // Side effect: mutation
  return data.value.map(transform)
})

// ❌ Overly complex computation
const complexResult = computed(() => {
  // 50+ lines of complex logic
  // Multiple nested loops
  // Multiple conditional branches
  // Hard to understand and test
  let result = []
  for (const item of data.value) {
    if (item.status === 'active') {
      for (const subItem of item.children) {
        if (subItem.valid) {
          // More nesting...
        }
      }
    }
  }
  return result
})

// ❌ Computed that should be a method
const filteredUsers = computed(() => {
  // Takes a parameter that changes frequently
  return users.value.filter(u => u.department === currentDepartment.value)
})
```

**Better Approach:**

```typescript
// ✅ Computed is pure
const processedData = computed(() =>
  data.value.map(transform)
)

// ✅ Side effects in watchEffect
watchEffect(() => {
  console.log('Data changed:', processedData.value)
  logAnalytics('data-changed', { count: processedData.value.length })
  apiService.updateCache(processedData.value)
})

// ✅ Break down complex computations
const activeItems = computed(() =>
  data.value.filter(item => item.status === 'active')
)

const validSubItems = computed(() =>
  activeItems.value.flatMap(item =>
    item.children.filter(sub => sub.valid)
  )
)

const finalResult = computed(() =>
  processValidSubItems(validSubItems.value)
)

// ✅ Extract complex logic to pure functions
function processValidSubItems(items: SubItem[]) {
  // Complex logic here, but testable!
  return items.map(/* ... */)
}

// ✅ Use methods for parameterized logic
function getUsersByDepartment(department: string) {
  return users.value.filter(u => u.department === department)
}

// Or use a computed factory
function useFilteredUsers(department: Ref<string>) {
  return computed(() =>
    users.value.filter(u => u.department === department.value)
  )
}
```

**Computed vs Method vs Watch:**

```typescript
// Use computed when:
// - Pure transformation of reactive data
// - Result should be cached
// - Automatically updates when dependencies change

// Use methods when:
// - Need parameters
// - One-time calculation
// - Not frequently called

// Use watch/watchEffect when:
// - Side effects needed (API calls, logging, etc.)
// - Manual control over when to run
// - Async operations
```

**Checklist:**

- [ ] Do `computed` properties have side effects (API calls, logging, mutations)?
- [ ] Is any single `computed` longer than 20 lines?
- [ ] Are there multiple `computed` properties doing duplicate calculations?
- [ ] Are computed properties being used where methods would be more appropriate?
- [ ] Is the computation logic testable in isolation?
- [ ] Are complex computations broken down into smaller pieces?
- [ ] Are getter and setter clearly separated in writable computed?

---

## 3. Watch Usage Patterns

### Code Smell: Watch Becoming Imperative State Synchronization

**Bad Example:**

```typescript
// ❌ Using watch for data transformation (should use computed!)
const userInput = ref('')
const processedValue = ref('')

watch(userInput, (newValue) => {
  processedValue.value = transform(newValue)  // This should be computed!
})

// ❌ Over-watching creates complex dependency web
watch(stateA, () => {
  stateB.value = calculateB(stateA.value)
})

watch(stateB, () => {
  stateC.value = calculateC(stateB.value)
})

watch(stateC, () => {
  stateA.value = calculateA(stateC.value)  // Circular dependency!
})

// ❌ Forgetting to cleanup watch
const stop = watch(source, callback)
// Component unmounts but stop() is never called
// Watch continues running!

// ❌ Watch for every property instead of one watch for object
watch(() => user.value.name, handleNameChange)
watch(() => user.value.email, handleEmailChange)
watch(() => user.value.age, handleAgeChange)
// Should watch the whole object instead
```

**Better Approach:**

```typescript
// ✅ Data transformation uses computed
const processedValue = computed(() => transform(userInput.value))

// ✅ Avoid watch chains - redesign state
// Instead of: A → watch → B → watch → C
// Use: computed(() => calculateFinal(A))
const finalState = computed(() => {
  const b = calculateB(stateA.value)
  const c = calculateC(b)
  return c
})

// ✅ Watch only for side effects
watch(userId, async (id) => {
  // True side effect: API call
  isLoading.value = true
  try {
    userData.value = await fetchUser(id)
  } finally {
    isLoading.value = false
  }
})

// ✅ Cleanup watch when needed
const stop = watch(source, callback)

onUnmounted(() => {
  stop()
})

// Or use watchEffect (auto-cleanup in component)
watchEffect(() => {
  // Auto-cleanup when component unmounts
})

// ✅ Watch object efficiently
watch(
  () => user.value,
  (newUser) => {
    // Handle any user property change
    handleUserChange(newUser)
  },
  { deep: true }  // Use deep when needed
)

// Or watch specific properties as object
watch(
  () => ({
    name: user.value.name,
    email: user.value.email,
    age: user.value.age
  }),
  (newValues) => {
    handleChange(newValues)
  }
)
```

**Watch vs WatchEffect:**

```typescript
// watch - Explicit dependencies, lazy by default
watch(
  () => user.value.id,  // Explicit source
  (newId, oldId) => {   // Get old and new values
    console.log(`Changed from ${oldId} to ${newId}`)
  },
  { immediate: false }  // Can control when to run
)

// watchEffect - Auto-track dependencies, eager by default
watchEffect(() => {
  // Automatically tracks user.value.id if accessed
  console.log(`User ID: ${user.value.id}`)
  // Runs immediately and on every change
})

// Use watch when: need old value, lazy execution, explicit dependencies
// Use watchEffect when: don't need old value, eager execution, auto-tracking
```

**Checklist:**

- [ ] Are `watch` calls being used for data transformation instead of side effects?
- [ ] Are there chains of watchers creating state synchronization networks?
- [ ] Are manually created watchers cleaned up on component unmount?
- [ ] Should you use `watchEffect` instead of `watch`?
- [ ] Is `deep: true` used unnecessarily (performance cost)?
- [ ] Are there too many watchers (>5) in a single component?
- [ ] Could watch logic be simplified with better state design?

---

## 4. Ref vs Reactive Choice

### Code Smell: Inconsistent or Wrong Ref/Reactive Usage

**Bad Example:**

```typescript
// ❌ Inconsistent style
const user = reactive({ name: '', age: 0 })
const userId = ref('')
const isLoading = reactive({ value: false })  // Why reactive for single value?
const count = ref({ value: 0 })  // Why nested value?

// ❌ Reactive object replaced entirely (loses reactivity!)
let state = reactive({ data: [] })
state = { data: newData }  // ❌ Lost reactivity!

// ❌ Destructuring reactive without toRefs (loses reactivity!)
const state = reactive({ name: '', age: 0 })
const { name, age } = state  // ❌ name and age are not reactive!

// ❌ Reactive with primitives (unnecessary)
const count = reactive({ value: 0 })
// Should just be: const count = ref(0)
```

**Better Approach:**

```typescript
// ✅ Consistent style: prefer ref for simplicity and consistency
const user = ref({ name: '', age: 0 })
const userId = ref('')
const isLoading = ref(false)
const count = ref(0)

// ✅ If using reactive, never replace the object
const state = reactive({ data: [] })
state.data = newData  // ✅ Modify properties, don't replace object

// ✅ Use toRefs when destructuring reactive
const state = reactive({ name: '', age: 0 })
const { name, age } = toRefs(state)  // ✅ Maintains reactivity

// Or use storeToRefs for Pinia stores
const userStore = useUserStore()
const { name, age } = storeToRefs(userStore)  // ✅ Maintains reactivity

// ✅ Use ref for primitives
const count = ref(0)
const isActive = ref(false)
const userName = ref('')

// ✅ Use reactive for complex objects (if preferred)
const form = reactive({
  username: '',
  email: '',
  password: '',
  settings: {
    notifications: true,
    theme: 'dark'
  }
})
```

**Ref vs Reactive Decision Tree:**

```
Need reactive state?
│
├─ Single primitive value? → ref
│  └─ const count = ref(0)
│
├─ Object that might be replaced? → ref
│  └─ const user = ref<User | null>(null)
│
├─ Object with stable structure? → reactive (or ref)
│  └─ const form = reactive({ name: '', email: '' })
│
├─ Need to destructure? → reactive + toRefs
│  └─ const { x, y } = toRefs(reactive({ x: 0, y: 0 }))
│
└─ When in doubt? → ref (more flexible)
```

**Auto-unwrapping Rules:**

```vue
<script setup lang="ts">
const count = ref(0)
const user = ref({ name: 'Alice' })
const state = reactive({
  nestedRef: ref(1)
})
</script>

<template>
  <!-- Auto-unwraps in templates -->
  <div>{{ count }}</div>  <!-- ✅ No .value needed -->
  <div>{{ user.name }}</div>  <!-- ✅ Auto-unwraps ref -->

  <!-- Auto-unwraps in reactive -->
  <div>{{ state.nestedRef }}</div>  <!-- ✅ No .value needed -->
</template>

<script setup lang="ts">
// But in script, you need .value
console.log(count.value)  // Must use .value
console.log(user.value.name)  // Must use .value

// Exception: refs in reactive auto-unwrap
console.log(state.nestedRef)  // No .value needed
</script>
```

**Checklist:**

- [ ] Does the project have a consistent ref/reactive convention?
- [ ] Are reactive objects being entirely replaced (breaking reactivity)?
- [ ] Is destructuring of reactive objects using `toRefs`?
- [ ] Are the auto-unwrap rules correctly understood and applied?
- [ ] Are primitives unnecessarily wrapped in reactive?
- [ ] Is there confusion about when to use `.value`?
- [ ] Could simpler ref usage reduce complexity?

---

## 5. Reactivity Gotchas and Edge Cases

### Code Smell: Unintentional Reactivity Loss

**Bad Example:**

```typescript
// ❌ Assigning reactive to new variable loses reactivity
const original = reactive({ count: 0 })
const copy = original  // Still reactive
const spread = { ...original }  // ❌ Lost reactivity!

// ❌ Array methods that return new arrays
const items = ref([1, 2, 3])
const doubled = items.value.map(x => x * 2)  // Not reactive!

// ❌ Passing reactive values to external functions
const state = reactive({ count: 0 })
someExternalFunction(state.count)  // Passes primitive, not reactive

// ❌ Accessing nested refs incorrectly
const nested = ref({
  inner: ref(0)  // Double-wrapped!
})
console.log(nested.value.inner.value)  // Confusing!
```

**Better Approach:**

```typescript
// ✅ Use toRefs to spread while maintaining reactivity
const original = reactive({ count: 0 })
const { count } = toRefs(original)  // count is still reactive

// ✅ Create new computed for derived arrays
const items = ref([1, 2, 3])
const doubled = computed(() => items.value.map(x => x * 2))

// ✅ Pass the whole reactive object or use computed
const state = reactive({ count: 0 })
someExternalFunction(toRef(state, 'count'))  // Pass reactive ref

// Or
const countRef = computed(() => state.count)
someExternalFunction(countRef)

// ✅ Avoid double-wrapping refs
const nested = ref({
  inner: 0  // Just the value, ref auto-unwraps
})
console.log(nested.value.inner)  // Clean access
```

**Common Reactivity Loss Scenarios:**

```typescript
// 1. Destructuring without toRefs
const state = reactive({ x: 1, y: 2 })
const { x, y } = state  // ❌ Lost reactivity

// 2. Native array methods
const arr = ref([1, 2, 3])
const filtered = arr.value.filter(x => x > 1)  // ❌ Not reactive

// 3. Assigning to const
const count = ref(0)
const value = count.value  // ❌ value is just a number

// 4. Passing to non-reactive context
const state = reactive({ name: 'Alice' })
localStorage.setItem('name', state.name)  // ❌ Stores current value only

// Solutions:
const { x, y } = toRefs(state)  // ✅
const filtered = computed(() => arr.value.filter(x => x > 1))  // ✅
const value = computed(() => count.value)  // ✅
watch(() => state.name, (name) => {  // ✅
  localStorage.setItem('name', name)
})
```

**Checklist:**

- [ ] Are reactive objects being spread without `toRefs`?
- [ ] Are derived arrays/objects using `computed` for reactivity?
- [ ] Are reactive values correctly passed to functions/external APIs?
- [ ] Are refs accidentally double-wrapped?
- [ ] Is reactivity maintained throughout data flow?
- [ ] Are team members aware of common reactivity gotchas?

---

## 6. Performance Optimization

### Code Smell: Unnecessary Reactive Overhead

**Bad Example:**

```typescript
// ❌ Making everything reactive by default
const config = reactive({
  apiUrl: 'https://api.example.com',
  timeout: 5000,
  retries: 3,
  // These don't change, why reactive?
})

// ❌ Deep reactivity when not needed
const largeTable = reactive({
  rows: Array(10000).fill(null).map((_, i) => ({
    id: i,
    name: `User ${i}`,
    email: `user${i}@example.com`,
    // 20+ more fields...
  }))
})

// ❌ Computed recalculating too often
const filtered = computed(() => {
  // Expensive operation runs on any dependency change
  return users.value
    .filter(complexFilter)
    .map(expensiveTransform)
    .sort(expensiveSort)
})
```

**Better Approach:**

```typescript
// ✅ Constants don't need reactivity
const CONFIG = {
  apiUrl: 'https://api.example.com',
  timeout: 5000,
  retries: 3,
} as const

// Or if it might change later, but rarely:
const config = shallowReactive({
  apiUrl: 'https://api.example.com',
  timeout: 5000,
  retries: 3,
})

// ✅ Shallow reactivity for large datasets
const largeTable = shallowRef([
  // 10000+ rows
])

// When updating, replace entire array
largeTable.value = [...largeTable.value, newRow]

// ✅ Memoize expensive computations
const filtered = computed(() => {
  // Only recalculate when dependencies actually change
  return users.value
    .filter(complexFilter)
    .map(expensiveTransform)
    .sort(expensiveSort)
})

// ✅ Or split into stages to avoid recalculating everything
const filteredUsers = computed(() => users.value.filter(complexFilter))
const transformedUsers = computed(() => filteredUsers.value.map(expensiveTransform))
const sortedUsers = computed(() => [...transformedUsers.value].sort(expensiveSort))
```

**Performance Best Practices:**

```typescript
// 1. Use shallowRef for large lists
const bigList = shallowRef<Item[]>([])

// 2. Use markRaw for non-reactive data
const staticData = markRaw(largeDataset)

// 3. Use v-once for static content in templates
// <div v-once>{{ staticContent }}</div>

// 4. Lazy load expensive computations
const expensiveResult = computed(() => {
  if (!shouldCompute.value) return null
  return doExpensiveComputation()
})

// 5. Debounce reactive updates
import { useDebounceFn } from '@vueuse/core'

const search = ref('')
const debouncedSearch = computed(() => search.value)
const performSearch = useDebounceFn(() => {
  // Search logic
}, 300)

watch(search, performSearch)
```

**Checklist:**

- [ ] Are static/constant values unnecessarily reactive?
- [ ] Are large datasets using shallow reactivity where appropriate?
- [ ] Are expensive computations properly memoized?
- [ ] Are there performance issues related to reactivity in profiling?
- [ ] Could `markRaw` reduce overhead for static data?
- [ ] Are reactive updates debounced/throttled where appropriate?
- [ ] Is `v-once` used for truly static template content?

---

## Additional Best Practices

### Naming Conventions

**Good practices:**
- Use descriptive names: `isUserLoading` not `loading`
- Use `is`/`has`/`should` prefixes for booleans
- Use plural for arrays/collections: `users` not `user`
- Use verb prefixes for computed with actions: `canEdit`, `shouldShow`

```typescript
// ✅ Clear naming
const isLoading = ref(false)
const hasErrors = computed(() => errors.value.length > 0)
const users = ref<User[]>([])
const canEditUser = computed(() => user.value?.role === 'admin')
```

### Reactivity Debugging

**Techniques:**

```typescript
// Track what triggers updates
watchEffect(() => {
  console.log('Dependencies:', {
    userId: userId.value,
    filter: filter.value
  })
})

// Track computed recalculations
const expensive = computed(() => {
  console.log('Expensive computed ran')
  return doExpensiveWork()
})

// Use Vue DevTools to inspect reactive state
// Use Vue DevTools performance tab to profile reactivity
```

---

**Document Version**: v1.0
**Last Updated**: 2024-12
