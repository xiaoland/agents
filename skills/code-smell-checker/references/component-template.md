# Vue Component Templates

## 1. Complex Template Logic

**Bad:**
```vue
<template>
  <!-- Complex conditions -->
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
    <!-- Inline computation -->
    <span>{{ user.posts.filter(p => p.status === 'published').length }} posts</span>

    <!-- Deep nesting -->
    <div v-if="user.role === 'admin'">
      <div v-if="user.permissions.includes('delete')">
        <button v-if="!user.isDeleting">Delete</button>
        <span v-else>Deleting...</span>
      </div>
    </div>
  </div>
</template>
```

**Better:**
```vue
<script setup lang="ts">
// Move logic to computed
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
  <!-- Clean, readable -->
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

**Check:**
- [ ] Complex boolean expressions in `v-if`/`v-show`?
- [ ] Array operations/filtering in templates?
- [ ] Nested ternary operators?
- [ ] `v-if` nested >3 levels?
- [ ] Complex class/style bindings?
- [ ] Logic could move to computed?
- [ ] Template readable without deep parsing?

---

## 2. Template Best Practices

**Use v-show vs v-if:**
```vue
<!-- Frequent toggle → v-show -->
<div v-show="isVisible">Content</div>

<!-- Rare toggle → v-if -->
<div v-if="userRole === 'admin'">Admin Panel</div>

<!-- Never rendered → v-if -->
<div v-if="hasPermission">Sensitive</div>
```

**List rendering:**
```vue
<!-- Always use :key with v-for -->
<div v-for="user in users" :key="user.id">
  {{ user.name }}
</div>

<!-- Avoid v-if with v-for -->
<!-- Bad -->
<div v-for="user in users" v-if="user.isActive" :key="user.id">

<!-- Better - filter in computed -->
<div v-for="user in activeUsers" :key="user.id">
```

**Event handling:**
```vue
<!-- Descriptive handler names -->
<button @click="handleUserDelete">Delete</button>

<!-- Not -->
<button @click="onClick">Delete</button>

<!-- Use event modifiers -->
<form @submit.prevent="handleSubmit">
<input @keyup.enter="handleSearch">
<div @click.stop="handleClick">
```

**Slots:**
```vue
<!-- Named slots for clarity -->
<template #header>
  <h1>Title</h1>
</template>

<template #default>
  Content
</template>

<!-- Scoped slots for data -->
<template #item="{ item, index }">
  {{ index }}: {{ item.name }}
</template>
```

---

## 3. Component Communication

**Bad:**
```vue
<script setup lang="ts">
// Too many events
const emit = defineEmits<{
  userUpdated: [user: User]
  dataRefreshed: []
  globalNotification: [message: string]
  sidebarToggled: [open: boolean]
  modalOpened: []
  themeChanged: [theme: string]
}>()

// Emitting unrelated events
const doSomething = () => {
  emit('userUpdated', user)
  emit('globalNotification', 'Updated!')
  emit('sidebarToggled', false)  // Why?
}

// Exposing everything
defineExpose({
  users,
  filteredUsers,
  searchTerm,
  fetchUsers,
  deleteUser,
  updateUser,
  exportData,
  // Too much!
})
</script>
```

**Better:**
```typescript
// Focused events
const emit = defineEmits<{
  'update:user': [user: User]
  delete: [userId: UserId]
}>()

// Use stores for global concerns
const notificationStore = useNotificationStore()
notificationStore.show('Updated!')

// Minimal public API
defineExpose({
  refresh: fetchUsers,
  validate: validateForm
})
```

**Check:**
- [ ] Events limited to parent-child?
- [ ] <6 event types per component?
- [ ] `defineExpose` minimal?
- [ ] Stores used for cross-component needs?
