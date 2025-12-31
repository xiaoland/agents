# Reactive Basics

## 1. Reactivity Depth

**Bad:**
```typescript
// Deep reactivity on massive data
const massiveData = reactive({
  users: [],        // 10000+ items
  posts: [],        // 50000+ items
  comments: []      // 100000+ items
})

// Deep reactivity on collections
const userMap = reactive(new Map<string, User>())
const userSet = reactive(new Set<UserId>())

// Reactive third-party instances
const chartInstance = reactive(new Chart(canvas))
const editor = reactive(new Monaco.Editor())
```

**Better:**
```typescript
// Track only reference changes
const userList = shallowRef<User[]>([])
const selectedId = ref<string>()

// Replace array to trigger update
userList.value = [...userList.value, newUser]

// Shallow for collections
const userCache = shallowReactive(new Map<string, User>())
const selectedIds = shallowReactive(new Set<UserId>())

// No reactivity for third-party
const chartInstance = markRaw(new Chart(canvas))
const editor = markRaw(new Monaco.Editor())
```

**Choose:**
- `reactive()` - Deep tracking, high overhead
- `shallowReactive()` - Shallow tracking, medium overhead
- `shallowRef()` - Only ref.value, low overhead
- `markRaw()` - No tracking, zero overhead

**Check:**
- [ ] Large lists using `reactive()` not `shallowRef()`?
- [ ] Third-party instances wrapped in reactive?
- [ ] Maps/Sets deeply reactive?
- [ ] Objects with 100+ properties fully reactive?

---

## 2. Ref vs Reactive

**Bad:**
```typescript
// Inconsistent
const user = reactive({ name: '', age: 0 })
const userId = ref('')
const isLoading = reactive({ value: false })  // Why?

// Replace reactive - loses reactivity!
let state = reactive({ data: [] })
state = { data: newData }  // ❌ Lost!

// Destructure without toRefs
const state = reactive({ name: '', age: 0 })
const { name, age } = state  // ❌ Not reactive!
```

**Better:**
```typescript
// Consistent: prefer ref
const user = ref({ name: '', age: 0 })
const userId = ref('')
const isLoading = ref(false)

// Modify properties, not object
const state = reactive({ data: [] })
state.data = newData  // ✅

// Destructure with toRefs
const state = reactive({ name: '', age: 0 })
const { name, age } = toRefs(state)  // ✅

// For Pinia
const userStore = useUserStore()
const { name, age } = storeToRefs(userStore)  // ✅
```

**Decision:**
- Single primitive → `ref`
- Object might be replaced → `ref`
- Stable object → `reactive` or `ref`
- Need destructure → `reactive + toRefs`
- Unsure → `ref`

**Auto-unwrap:**
```vue
<script setup lang="ts">
const count = ref(0)
const state = reactive({ nestedRef: ref(1) })
</script>

<template>
  <!-- Auto-unwraps -->
  <div>{{ count }}</div>
  <div>{{ state.nestedRef }}</div>
</template>

<script setup lang="ts">
// Need .value
console.log(count.value)
console.log(state.nestedRef)  // Auto in reactive
</script>
```

**Check:**
- [ ] Consistent convention?
- [ ] Reactive replaced entirely?
- [ ] Destructuring uses `toRefs`?
- [ ] Auto-unwrap understood?
- [ ] Primitives in reactive unnecessarily?

---

## 3. Reactivity Loss

**Bad:**
```typescript
// 1. Spreading loses reactivity
const original = reactive({ count: 0 })
const spread = { ...original }  // ❌ Lost!

// 2. Array methods not reactive
const items = ref([1, 2, 3])
const doubled = items.value.map(x => x * 2)  // Not reactive!

// 3. Passing primitives
const state = reactive({ count: 0 })
someFunction(state.count)  // Primitive only

// 4. Double-wrapped
const nested = ref({ inner: ref(0) })  // Confusing
```

**Better:**
```typescript
// 1. Use toRefs
const { count } = toRefs(original)

// 2. Use computed
const doubled = computed(() => items.value.map(x => x * 2))

// 3. Pass ref
someFunction(toRef(state, 'count'))
// Or
const countRef = computed(() => state.count)
someFunction(countRef)

// 4. Avoid double-wrap
const nested = ref({ inner: 0 })  // Auto-unwraps
```

**Check:**
- [ ] Reactive spread without `toRefs`?
- [ ] Derived arrays use `computed`?
- [ ] Reactive values passed correctly?
- [ ] Double-wrapped refs?

---

## 4. Naming

**Conventions:**
- Booleans: `isLoading`, `hasErrors`, `canEdit`, `shouldShow`
- Collections: `users` (plural)
- Actions: `canEdit`, `shouldShow`

```typescript
const isLoading = ref(false)
const hasErrors = computed(() => errors.value.length > 0)
const users = ref<User[]>([])
const canEdit = computed(() => user.value?.role === 'admin')
```
