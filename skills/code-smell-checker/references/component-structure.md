# Vue Component Structure

## 1. Mixed Responsibilities

**Bad:**
```vue
<!-- UserDashboard.vue - does everything -->
<script setup lang="ts">
// Data fetching
const users = ref<User[]>([])
const isLoading = ref(false)
const fetchUsers = async () => { /* ... */ }

// Filtering
const searchTerm = ref('')
const filteredUsers = ref<User[]>([])
watch(searchTerm, (term) => { /* filter */ })

// Business logic
const validateUser = (user: User) => { /* ... */ }

// Export
const exportToCSV = () => { /* ... */ }

// Stats
const calculateStats = () => { /* ... */ }

onMounted(fetchUsers)
</script>
```

**Better:**
```typescript
// Split by responsibility

// composables/useUserData.ts
export function useUserData() {
  const users = ref<User[]>([])
  const isLoading = ref(false)
  const fetchUsers = async () => { /* ... */ }
  return { users, isLoading, fetchUsers }
}

// composables/useUserFilter.ts
export function useUserFilter(users: Ref<User[]>) {
  const searchTerm = ref('')
  const filteredUsers = computed(() =>
    users.value.filter(u =>
      u.name.toLowerCase().includes(searchTerm.value.toLowerCase())
    )
  )
  return { searchTerm, filteredUsers }
}

// components/UserDashboard.vue - orchestrates
// components/UserList.vue - presents data
```

**Check:**
- [ ] Component file >300 lines?
- [ ] Mixes data/business/presentation layers?
- [ ] Can describe sole responsibility in one sentence?
- [ ] Easily replaceable/deletable?
- [ ] Multiple reasons to modify?
- [ ] Handles data fetching AND complex UI?

---

## 2. Component Size

**Signs to split:**
- File >300 lines
- Template >150 lines
- Script >200 lines
- >10 reactive variables
- >8 computed properties
- >10 functions
- >5 watchers

**Bad:**
```vue
<!-- Monolithic UserProfile.vue (500+ lines) -->
```

**Better:**
```typescript
// Split into focused components:
// UserProfile.vue (orchestrator, ~100 lines)
// ├── UserProfileHeader.vue (~50 lines)
// ├── UserProfileStats.vue (~60 lines)
// ├── UserProfilePosts.vue (~80 lines)
// │   └── UserPost.vue (~40 lines)
// └── UserProfileSettings.vue (~70 lines)

// Extract logic:
// composables/useUserProfile.ts
// composables/useUserPosts.ts
// composables/useUserSettings.ts
```

**Check:**
- [ ] Component file >300 lines?
- [ ] >10 reactive variables?
- [ ] Distinct UI sections that could be separate?
- [ ] Independent concerns for composables?
- [ ] Splitting improves testability?
- [ ] Component hard to understand at glance?
- [ ] Team avoids working on it?

---

## 3. Lifecycle Hooks

**Bad:**
```vue
<script setup lang="ts">
// Multiple scattered hooks
onMounted(() => { fetchUsers() })
onMounted(() => { initChart() })
onMounted(() => { startPolling() })

// No cleanup
onMounted(() => {
  const interval = setInterval(fetchData, 5000)
  // Forgot to clear!
})

// Missing event cleanup
onMounted(() => {
  window.addEventListener('resize', handleResize)
  // Forgot to remove!
})
</script>
```

**Better:**
```typescript
// Consolidate related logic
onMounted(() => {
  fetchUsers()
  initChart()
  startPolling()
})

// Always cleanup
const interval = ref<number>()

onMounted(() => {
  interval.value = setInterval(fetchData, 5000)
})

onUnmounted(() => {
  if (interval.value) clearInterval(interval.value)
})

// Or use composables with auto-cleanup
const { data } = usePolling(fetchData, { interval: 5000 })

// Event listeners with cleanup
onMounted(() => {
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})
```

**Check:**
- [ ] Multiple `onMounted` that could consolidate?
- [ ] Every resource has cleanup?
- [ ] Intervals/timeouts cleared in `onUnmounted`?
- [ ] Event listeners removed?
- [ ] Subscriptions/observers disposed?
- [ ] Lifecycle logic in composables?

---

## 4. Naming

**Component names:**
- `PascalCase` for components
- Descriptive: `UserProfileCard` not `Card`
- Base components: `BaseButton`, `BaseInput`
- Single-instance: `TheHeader`, `TheSidebar`

**Examples:**
```vue
<!-- ✅ Good -->
<UserProfileCard>
<BaseButton>
<TheHeader>

<!-- ❌ Bad -->
<Card>
<Btn>
<Header>
```

---

## 5. Documentation

**Good practices:**
```vue
<script setup lang="ts">
/**
 * UserCard - Displays user info in card format
 *
 * @example
 * <UserCard :user-id="userId" variant="detailed" @edit="handleEdit" />
 */

interface Props {
  /** Unique user identifier */
  userId: UserId

  /** Card display variant */
  variant?: 'compact' | 'detailed'

  /** Show action buttons */
  showActions?: boolean
}
</script>
```

**Check:**
- [ ] Component purpose documented?
- [ ] All props have JSDoc?
- [ ] Usage examples provided?
- [ ] Emitted events documented?
- [ ] Slots documented?
