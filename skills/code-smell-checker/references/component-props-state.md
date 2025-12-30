# Vue Component Props and State

## 1. Props Drilling

**Bad:**
```vue
<!-- Props passed through many levels -->
<GrandParent :user="user" :config="config" :theme="theme" />
  <Parent :user="user" :config="config" :theme="theme" />
    <Child :user="user" :config="config" :theme="theme" />
      <GrandChild :user="user" :config="config" :theme="theme" />
        <GreatGrandChild :user="user" :config="config" :theme="theme" />
```

**Better:**
```typescript
// Use provide/inject
// GrandParent.vue
const userContext = computed(() => ({
  user: user.value,
  config: config.value,
  theme: theme.value
}))
provide('userContext', userContext)

// GreatGrandChild.vue
const userContext = inject<UserContext>('userContext')
```

**Check:**
- [ ] Props passed through >3 levels?
- [ ] Could provide/inject reduce drilling?

---

## 2. Weak Props Types

**Bad:**
```vue
<script setup lang="ts">
const props = defineProps<{
  data: any  // Too broad
  options?: Record<string, unknown>  // Unclear
  config: object  // No structure
  items: unknown[]  // What items?
  callback: Function  // What signature?
}>()
</script>
```

**Better:**
```typescript
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

**Check:**
- [ ] Props use `any`/`object`/`Record<string, unknown>`?
- [ ] >7 props (consider props object)?
- [ ] Required props have clear meaning?
- [ ] Optional props have defaults?
- [ ] Function props have clear signatures?
- [ ] Runtime validators when needed?

---

## 3. State Management Chaos

**Bad:**
```vue
<script setup lang="ts">
// State source unclear
const userStore = useUserStore()
const localUser = ref(userStore.currentUser)  // Duplicate!
const userName = ref(localUser.value?.name)   // Derived with ref!
const isAdmin = ref(false)

// Manual sync - code smell!
watch(() => userStore.currentUser, (newUser) => {
  localUser.value = newUser
  userName.value = newUser?.name
  isAdmin.value = newUser?.role === 'admin'
})

// Out of sync mutations
const updateUser = () => {
  localUser.value.name = 'New Name'  // Not in store!
  userStore.updateUser(localUser.value)
}
</script>
```

**Better:**
```typescript
// Clear state layers
const userStore = useUserStore()  // Global - single source

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

// No manual sync needed!
```

**State guide:**
```typescript
// Global (store):
// - Data shared across components
// - Server data needing cache
// - App-wide settings

// Local (ref/reactive):
// - UI-only state (modal open, selected tab)
// - Form inputs (before submission)
// - Component-specific toggles

// Derived (computed):
// - Calculations from other state
// - Filtered/sorted/mapped data
// - Boolean flags from conditions
```

**Check:**
- [ ] Same state in multiple places (store + component)?
- [ ] Derived data using `ref` instead of `computed`?
- [ ] Manual `watch` to sync state?
- [ ] Clear distinction between source and derived?
- [ ] Confusion about store vs component state?
- [ ] Bugs from out-of-sync state?

---

## 4. Props Mutation

**Bad:**
```vue
<script setup lang="ts">
const props = defineProps<{ user: User }>()

const updateName = () => {
  props.user.name = 'New Name'  // Mutating prop!
}
</script>
```

**Better:**
```typescript
// Emit to parent
const emit = defineEmits<{
  'update:user': [user: User]
}>()

const updateName = (newName: string) => {
  emit('update:user', { ...props.user, name: newName })
}

// Or use v-model
const props = defineProps<{
  modelValue: string
}>()
const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()
```

**Check:**
- [ ] Props mutated directly?
- [ ] Events limited to parent-child?
- [ ] `defineExpose` used sparingly for public API?
- [ ] Event names descriptive and follow conventions?
- [ ] Clear component communication pattern?
- [ ] Global concerns in stores not events?
