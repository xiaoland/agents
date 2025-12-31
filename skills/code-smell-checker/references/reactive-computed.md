# Computed Properties

## 1. Side Effects in Computed

**Bad:**
```typescript
// Side effects - wrong!
const processedData = computed(() => {
  console.log('Computing')  // Side effect
  logAnalytics('data-computed')  // Side effect
  apiService.updateCache(data.value)  // Side effect
  lastTime.value = Date.now()  // Side effect
  return data.value.map(transform)
})

// Too complex
const complexResult = computed(() => {
  // 50+ lines, nested loops
  let result = []
  for (const item of data.value) {
    if (item.status === 'active') {
      for (const sub of item.children) {
        if (sub.valid) {
          // More nesting...
        }
      }
    }
  }
  return result
})
```

**Better:**
```typescript
// Pure computed
const processedData = computed(() =>
  data.value.map(transform)
)

// Side effects in watchEffect
watchEffect(() => {
  console.log('Data:', processedData.value)
  logAnalytics('changed', { count: processedData.value.length })
  apiService.updateCache(processedData.value)
})

// Break down complexity
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

// Extract to testable function
function processValidSubItems(items: SubItem[]) {
  return items.map(/* ... */)
}
```

**Check:**
- [ ] Computed has side effects?
- [ ] Single computed >20 lines?
- [ ] Multiple computed doing duplicate work?
- [ ] Logic testable in isolation?

---

## 2. When to Use What

**Computed:**
```typescript
// Pure transformation, cached, auto-updates
const filtered = computed(() =>
  users.value.filter(isActive)
)
```

**Method:**
```typescript
// Needs parameters, one-time, not frequent
function getUsersByDept(dept: string) {
  return users.value.filter(u => u.department === dept)
}
```

**Watch:**
```typescript
// Side effects, API calls, async
watch(userId, async (id) => {
  userData.value = await fetchUser(id)
})
```

---

## 3. Optimization

**Avoid full recalculation:**
```typescript
// Bad - recalcs everything
const filtered = computed(() => {
  return users.value
    .filter(complexFilter)
    .map(expensiveTransform)
    .sort(expensiveSort)
})

// Better - split stages
const filteredUsers = computed(() =>
  users.value.filter(complexFilter)
)

const transformedUsers = computed(() =>
  filteredUsers.value.map(expensiveTransform)
)

const sortedUsers = computed(() =>
  [...transformedUsers.value].sort(expensiveSort)
)
```

**Lazy evaluation:**
```typescript
// Only compute when needed
const result = computed(() => {
  if (!shouldCompute.value) return null
  return doExpensiveWork()
})
```

**Memoize within:**
```typescript
const processed = computed(() => {
  const cache = new Map()
  return data.value.map(item => {
    if (cache.has(item.id)) {
      return cache.get(item.id)
    }
    const result = expensiveProcess(item)
    cache.set(item.id, result)
    return result
  })
})
```

---

## 4. Writable Computed

**Use case:**
```typescript
// Two-way binding with transformation
const fullName = computed({
  get() {
    return `${firstName.value} ${lastName.value}`
  },
  set(newValue) {
    const parts = newValue.split(' ')
    firstName.value = parts[0]
    lastName.value = parts[1] || ''
  }
})
```

**v-model with store:**
```typescript
const searchTerm = computed({
  get: () => store.searchTerm,
  set: (value) => store.setSearchTerm(value)
})
```

**Check:**
- [ ] Getter pure?
- [ ] Setter clear and safe?
- [ ] No side effects in getter?
