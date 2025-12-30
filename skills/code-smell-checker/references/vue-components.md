# Vue Component Design - Maintainability Code Smells

This reference document provides detailed checklists for identifying maintainability issues in Vue 3 component design.

---

## 1. Component Responsibility Boundaries

### Code Smell: A Component Takes on Multiple Responsibilities

**Bad Example:**

```vue
<!-- ❌ UserDashboard.vue does too much -->
<script setup lang="ts">
// Mixing: data fetching, state management, business logic, UI rendering
const users = ref<User[]>([])
const filteredUsers = ref<User[]>([])
const searchTerm = ref('')
const isLoading = ref(false)
const sortOrder = ref<'asc' | 'desc'>('asc')
const selectedUsers = ref<Set<string>>(new Set())

// Data fetching
const fetchUsers = async () => {
  isLoading.value = true
  try {
    const response = await fetch('/api/users')
    users.value = await response.json()
  } finally {
    isLoading.value = false
  }
}

// Business logic
const validateUser = (user: User) => {
  return user.email.includes('@') && user.age >= 18
}

// Export functionality
const exportToCSV = () => {
  const csv = users.value.map(u => `${u.name},${u.email}`).join('\n')
  downloadFile(csv, 'users.csv')
}

// Statistics calculation
const calculateStats = () => {
  return {
    total: users.value.length,
    active: users.value.filter(u => u.status === 'active').length,
    avgAge: users.value.reduce((sum, u) => sum + u.age, 0) / users.value.length
  }
}

// Filtering logic
watch(searchTerm, (term) => {
  filteredUsers.value = users.value.filter(u =>
    u.name.toLowerCase().includes(term.toLowerCase())
  )
})

onMounted(() => {
  fetchUsers()
})
</script>

<template>
  <!-- 200+ lines of template -->
</template>
```

**Better Approach:**

```typescript
// ✅ Split by responsibility

// composables/useUserData.ts - Data fetching
export function useUserData() {
  const users = ref<User[]>([])
  const isLoading = ref(false)

  const fetchUsers = async () => {
    isLoading.value = true
    try {
      const response = await fetch('/api/users')
      users.value = await response.json()
    } finally {
      isLoading.value = false
    }
  }

  return { users, isLoading, fetchUsers }
}

// composables/useUserFilter.ts - Filtering logic
export function useUserFilter(users: Ref<User[]>) {
  const searchTerm = ref('')

  const filteredUsers = computed(() =>
    users.value.filter(u =>
      u.name.toLowerCase().includes(searchTerm.value.toLowerCase())
    )
  )

  return { searchTerm, filteredUsers }
}

// composables/useUserExport.ts - Export functionality
export function useUserExport(users: Ref<User[]>) {
  const exportToCSV = () => {
    const csv = users.value.map(u => `${u.name},${u.email}`).join('\n')
    downloadFile(csv, 'users.csv')
  }

  return { exportToCSV }
}

// components/UserList.vue - Pure presentation
// components/UserDashboard.vue - Composition and coordination
```

**Checklist:**

- [ ] Is the component file longer than 300 lines?
- [ ] Does the component mix data layer, business layer, and presentation layer logic?
- [ ] Can you describe the component's sole responsibility in one sentence?
- [ ] Could the component be easily replaced or deleted without affecting unrelated features?
- [ ] Are there multiple reasons to modify this component?
- [ ] Does the component handle both data fetching AND complex UI interactions?
- [ ] Would splitting this component make the code more maintainable?

---

## 2. Props Design Code Smells

### Code Smell: Props Passed Too Deep or Too Casually

**Bad Example - Props Drilling:**

```vue
<!-- ❌ Props drilling through multiple levels -->
<GrandParent :user="user" :config="config" :theme="theme" />
  <Parent :user="user" :config="config" :theme="theme" />
    <Child :user="user" :config="config" :theme="theme" />
      <GrandChild :user="user" :config="config" :theme="theme" />
        <GreatGrandChild :user="user" :config="config" :theme="theme" />
```

**Bad Example - Weak Props Constraints:**

```vue
<!-- ❌ Props lack clear constraints -->
<script setup lang="ts">
const props = defineProps<{
  data: any  // Too broad
  options?: Record<string, unknown>  // Unclear structure
  config: object  // No structure defined
  items: unknown[]  // What type of items?
  callback: Function  // What parameters? What return type?
}>()
</script>
```

**Better Approach:**

```typescript
// ✅ Use provide/inject to avoid props drilling
// GrandParent.vue
const userContext = computed(() => ({
  user: user.value,
  config: config.value,
  theme: theme.value
}))
provide('userContext', userContext)

// GreatGrandChild.vue
const userContext = inject<UserContext>('userContext')

// ✅ Clear and specific props types
interface UserCardProps {
  userId: UserId
  variant?: 'compact' | 'detailed'
  showActions?: boolean
  onEdit?: (userId: UserId) => void
  onDelete?: (userId: UserId) => void
}

const props = withDefaults(
  defineProps<UserCardProps>(),
  {
    variant: 'compact',
    showActions: true
  }
)
```

**Checklist:**

- [ ] Are props passed through more than 3 component levels?
- [ ] Do props use `any`, `object`, or `Record<string, unknown>`?
- [ ] Are there more than 7 props (consider using a props object)?
- [ ] Do all required props have clear business meaning?
- [ ] Do all optional props have reasonable default values?
- [ ] Are function props typed with clear signatures?
- [ ] Could provide/inject reduce props drilling?
- [ ] Are props validated with runtime validators when needed?

---

## 3. Component State Management Chaos

### Code Smell: Local State, Global State, and Derived State Mixed Together

**Bad Example:**

```vue
<script setup lang="ts">
// ❌ State source unclear
const userStore = useUserStore()
const localUser = ref(userStore.currentUser)  // Duplicate state!
const userName = ref(localUser.value?.name)   // Derived state using ref!
const isAdmin = ref(false)
const cachedData = ref(userStore.cachedData)  // Another duplicate!

// Manual state synchronization - code smell!
watch(() => userStore.currentUser, (newUser) => {
  localUser.value = newUser
  userName.value = newUser?.name
  isAdmin.value = newUser?.role === 'admin'
})

watch(() => userStore.cachedData, (newData) => {
  cachedData.value = newData
})

// Mutation of duplicated state
const updateUser = () => {
  localUser.value.name = 'New Name'  // Out of sync with store!
  userStore.updateUser(localUser.value)
}
</script>
```

**Better Approach:**

```typescript
// ✅ Clear state layering
const userStore = useUserStore()  // Global state - single source of truth

// Local UI state only
const localFilter = ref('')
const isEditing = ref(false)
const selectedTab = ref<'profile' | 'settings'>('profile')

// Derived state uses computed
const userName = computed(() => userStore.currentUser?.name ?? 'Guest')
const isAdmin = computed(() => userStore.currentUser?.role === 'admin')
const filteredData = computed(() =>
  userStore.users.filter(u => u.name.includes(localFilter.value))
)

// No manual synchronization needed!
```

**State Classification Guide:**

```typescript
// Global state (store) - Use for:
// - Data shared across components
// - Server data that needs caching
// - Application-wide settings

// Local state (ref/reactive) - Use for:
// - UI-only state (modal open, selected tab)
// - Form input values (before submission)
// - Component-specific toggles

// Derived state (computed) - Use for:
// - Calculations based on other state
// - Filtered/sorted/mapped data
// - Boolean flags based on conditions
```

**Checklist:**

- [ ] Is the same state defined in multiple places (store + component)?
- [ ] Is derived data incorrectly using `ref` instead of `computed`?
- [ ] Are there manual `watch` calls to synchronize state?
- [ ] Can you clearly distinguish between "state source" and "derived view"?
- [ ] Is there confusion about which state belongs in the store vs component?
- [ ] Are there bugs caused by state getting out of sync?
- [ ] Could removing duplicate state simplify the code?

---

## 4. Component Communication Anti-Patterns

### Code Smell: Improper Event Handling and Communication

**Bad Example:**

```vue
<!-- ❌ Mutating props directly -->
<script setup lang="ts">
const props = defineProps<{ user: User }>()

const updateName = () => {
  props.user.name = 'New Name'  // Mutating prop! Anti-pattern!
}
</script>

<!-- ❌ Using events as global event bus -->
<script setup lang="ts">
const emit = defineEmits<{
  userUpdated: [user: User]
  dataRefreshed: []
  globalNotification: [message: string]
  sidebarToggled: [open: boolean]
}>()

// Emitting events for unrelated concerns
const doSomething = () => {
  emit('userUpdated', user)
  emit('globalNotification', 'Updated!')
  emit('sidebarToggled', false)  // Why is this component controlling sidebar?
}
</script>

<!-- ❌ Expose everything via defineExpose -->
<script setup lang="ts">
defineExpose({
  users,
  filteredUsers,
  searchTerm,
  fetchUsers,
  deleteUser,
  updateUser,
  exportData,
  // Exposing implementation details!
})
</script>
```

**Better Approach:**

```typescript
// ✅ Emit to parent, don't mutate props
const emit = defineEmits<{
  'update:user': [user: User]
}>()

const updateName = (newName: string) => {
  emit('update:user', { ...props.user, name: newName })
}

// ✅ Use v-model for two-way binding
const props = defineProps<{
  modelValue: string
}>()
const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

// ✅ Only expose necessary public API
defineExpose({
  refresh: fetchUsers,  // Clear public method
  validate: validateForm  // Clear public method
})

// ✅ Use store for cross-component communication
const notificationStore = useNotificationStore()
notificationStore.show('Updated!')
```

**Checklist:**

- [ ] Are props being mutated directly?
- [ ] Are emitted events limited to direct parent-child communication?
- [ ] Is `defineExpose` used sparingly and only for public API?
- [ ] Are event names descriptive and follow naming conventions?
- [ ] Is there a clear pattern for component communication?
- [ ] Are global concerns handled by stores, not events?

---

## 5. Template Complexity

### Code Smell: Overly Complex Templates

**Bad Example:**

```vue
<template>
  <!-- ❌ Complex logic in template -->
  <div
    v-if="user && user.status === 'active' && user.role !== 'guest' && user.permissions.includes('edit')"
    :class="[
      'user-card',
      user.isPremium ? 'premium' : 'standard',
      user.notifications.length > 0 ? 'has-notifications' : '',
      isHovered ? 'hovered' : '',
      isSelected ? 'selected' : ''
    ]"
  >
    <!-- Inline complex computation -->
    <span>{{ user.posts.filter(p => p.status === 'published').length }} posts</span>

    <!-- Nested conditions -->
    <div v-if="user.role === 'admin'">
      <div v-if="user.permissions.includes('delete')">
        <button v-if="!user.isDeleting">Delete</button>
        <span v-else>Deleting...</span>
      </div>
    </div>
  </div>
</template>
```

**Better Approach:**

```vue
<script setup lang="ts">
// ✅ Move logic to computed properties
const canEdit = computed(() =>
  user.value?.status === 'active' &&
  user.value?.role !== 'guest' &&
  user.value?.permissions.includes('edit')
)

const cardClasses = computed(() => [
  'user-card',
  user.value?.isPremium ? 'premium' : 'standard',
  { 'has-notifications': hasNotifications.value },
  { 'hovered': isHovered.value },
  { 'selected': isSelected.value }
])

const publishedPostsCount = computed(() =>
  user.value?.posts.filter(p => p.status === 'published').length ?? 0
)

const canDelete = computed(() =>
  user.value?.role === 'admin' &&
  user.value?.permissions.includes('delete')
)
</script>

<template>
  <!-- ✅ Clean, readable template -->
  <div v-if="canEdit" :class="cardClasses">
    <span>{{ publishedPostsCount }} posts</span>

    <button v-if="canDelete && !user.isDeleting">
      Delete
    </button>
    <span v-else-if="user.isDeleting">
      Deleting...
    </span>
  </div>
</template>
```

**Checklist:**

- [ ] Are there complex boolean expressions in `v-if`/`v-show`?
- [ ] Are there complex array operations or filtering in templates?
- [ ] Are there nested ternary operators in template expressions?
- [ ] Is `v-if` nested more than 3 levels deep?
- [ ] Are class/style bindings overly complex?
- [ ] Could template logic be moved to computed properties?
- [ ] Is the template readable without deep mental parsing?

---

## 6. Component Size and Decomposition

### Code Smell: Monolithic Components

**Signs a component needs to be split:**

1. **File size**: Component file > 300 lines
2. **Template size**: Template section > 150 lines
3. **Script size**: Script section > 200 lines
4. **Number of refs/reactive**: > 10 reactive state variables
5. **Number of computed**: > 8 computed properties
6. **Number of methods**: > 10 functions
7. **Number of watchers**: > 5 watchers

**Decomposition Strategies:**

```typescript
// ❌ Monolithic UserProfile.vue (500+ lines)

// ✅ Split into focused components:
// UserProfile.vue (orchestrator, ~100 lines)
// ├── UserProfileHeader.vue (~50 lines)
// ├── UserProfileStats.vue (~60 lines)
// ├── UserProfilePosts.vue (~80 lines)
// │   └── UserPost.vue (~40 lines)
// └── UserProfileSettings.vue (~70 lines)

// ✅ Extract logic into composables:
// composables/useUserProfile.ts
// composables/useUserPosts.ts
// composables/useUserSettings.ts
```

**Checklist:**

- [ ] Is the component file longer than 300 lines?
- [ ] Does the component have more than 10 reactive state variables?
- [ ] Are there distinct UI sections that could be separate components?
- [ ] Are there independent concerns that could be extracted to composables?
- [ ] Would splitting improve testability?
- [ ] Is the component becoming hard to understand at a glance?
- [ ] Are team members avoiding working on this component due to size?

---

## 7. Lifecycle Hook Management

### Code Smell: Lifecycle Hook Chaos

**Bad Example:**

```vue
<script setup lang="ts">
// ❌ Multiple scattered lifecycle hooks
onMounted(() => {
  fetchUsers()
})

onMounted(() => {
  initChart()
})

onMounted(() => {
  startPolling()
})

// ❌ Cleanup not properly handled
onMounted(() => {
  const interval = setInterval(() => {
    fetchData()
  }, 5000)
  // Forgot to clear interval!
})

// ❌ Side effects in lifecycle hooks without cleanup
onMounted(() => {
  window.addEventListener('resize', handleResize)
  // Forgot to remove listener!
})
</script>
```

**Better Approach:**

```typescript
// ✅ Consolidate related lifecycle logic
onMounted(() => {
  // Group related initialization
  fetchUsers()
  initChart()
  startPolling()
})

// ✅ Always cleanup
const interval = ref<number>()

onMounted(() => {
  interval.value = setInterval(() => {
    fetchData()
  }, 5000)
})

onUnmounted(() => {
  if (interval.value) {
    clearInterval(interval.value)
  }
})

// ✅ Or use composables with automatic cleanup
const { data } = usePolling(fetchData, { interval: 5000 })

// ✅ Event listeners with cleanup
onMounted(() => {
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})
```

**Checklist:**

- [ ] Are there multiple `onMounted` hooks that could be consolidated?
- [ ] Does every resource allocation have corresponding cleanup?
- [ ] Are intervals/timeouts cleared in `onUnmounted`?
- [ ] Are event listeners removed in `onUnmounted`?
- [ ] Are subscriptions/observers properly disposed?
- [ ] Could lifecycle logic be encapsulated in composables?

---

## Additional Best Practices

### Component Naming

**Good practices:**
- Use `PascalCase` for component names
- Use descriptive, specific names: `UserProfileCard` not `Card`
- Prefix base components: `BaseButton`, `BaseInput`
- Prefix single-instance components: `TheHeader`, `TheSidebar`

### Component Documentation

**Good practices:**
- Document component purpose and usage
- Document all props with JSDoc
- Provide usage examples
- Document emitted events
- Document slots if applicable

```vue
<script setup lang="ts">
/**
 * UserCard - Displays user information in card format
 *
 * @example
 * <UserCard :user-id="userId" variant="detailed" @edit="handleEdit" />
 */

interface Props {
  /** Unique identifier for the user */
  userId: UserId

  /** Display variant of the card */
  variant?: 'compact' | 'detailed'

  /** Whether to show action buttons */
  showActions?: boolean
}
</script>
```

---

**Document Version**: v1.0
**Last Updated**: 2024-12
