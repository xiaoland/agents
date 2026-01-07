# Dispensables

Pointless and unneeded items whose absence would make the code cleaner and more readable. The goal is to **Remove / Simplify** unnecessary complexity.

---

## Comments

A method is so complex that it requires comments to explain what it's doing. Well-written code should be self-explanatory through clear naming and proper structure.

### Refactoring: Extract Method, Rename Method

**Bad:**

```typescript
function processOrder(order: Order) {
  // Check if order is valid
  // Order must have items, valid customer, and not be expired
  if (
    order.items.length > 0 &&
    order.customerId &&
    new Date(order.createdAt).getTime() > Date.now() - 86400000
  ) {
    // Calculate the total price including discounts
    // First sum all items, then apply percentage discount
    // Finally apply fixed discount if total exceeds threshold
    let total = 0
    for (const item of order.items) {
      total += item.price * item.quantity
    }
    if (order.discountPercent) {
      total = total * (1 - order.discountPercent / 100)
    }
    if (total > 100 && order.fixedDiscount) {
      total -= order.fixedDiscount
    }
    
    // Update inventory counts for each item
    // Reduce stock by quantity ordered
    for (const item of order.items) {
      const product = findProduct(item.productId)
      product.stock -= item.quantity
      saveProduct(product)
    }
  }
}
```

**Better:**

```typescript
function processOrder(order: Order) {
  if (!isValidOrder(order)) return
  
  const total = calculateTotalWithDiscounts(order)
  updateInventory(order.items)
}

function isValidOrder(order: Order): boolean {
  const maxAgeMs = 24 * 60 * 60 * 1000
  const orderAge = Date.now() - new Date(order.createdAt).getTime()
  
  return (
    order.items.length > 0 &&
    Boolean(order.customerId) &&
    orderAge < maxAgeMs
  )
}

function calculateTotalWithDiscounts(order: Order): number {
  const subtotal = order.items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  )
  
  const afterPercent = order.discountPercent
    ? subtotal * (1 - order.discountPercent / 100)
    : subtotal
    
  const qualifiesForFixed = afterPercent > 100 && order.fixedDiscount
  return qualifiesForFixed ? afterPercent - order.fixedDiscount : afterPercent
}

function updateInventory(items: OrderItem[]) {
  for (const item of items) {
    const product = findProduct(item.productId)
    product.stock -= item.quantity
    saveProduct(product)
  }
}
```

### Checklist

- [ ] Comments explain "what" the code does rather than "why"
- [ ] Comments describe logic that could be extracted into a well-named function
- [ ] Comments act as section dividers within a method
- [ ] Variable/function names are unclear, requiring comments to explain them
- [ ] Comments are outdated or inconsistent with the actual code

---

## Duplicate Code

Two or more code fragments that look almost identical. Duplication means that every change needs to be made in multiple places, increasing the risk of inconsistencies and bugs.

### Refactoring: Extract Method, Extract Class, Pull Up Method

**Bad:**

```typescript
// In UserList.vue
function formatUserForDisplay(user: User) {
  return {
    fullName: `${user.firstName} ${user.lastName}`,
    displayEmail: user.email.toLowerCase(),
    joinDate: new Date(user.createdAt).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }),
    status: user.isActive ? 'Active' : 'Inactive'
  }
}

// In UserProfile.vue - almost identical!
function formatUserData(user: User) {
  return {
    fullName: `${user.firstName} ${user.lastName}`,
    displayEmail: user.email.toLowerCase(),
    joinDate: new Date(user.createdAt).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }),
    status: user.isActive ? 'Active' : 'Inactive'
  }
}

// In AdminPanel.vue - same logic again!
function getUserDisplayInfo(user: User) {
  return {
    fullName: `${user.firstName} ${user.lastName}`,
    displayEmail: user.email.toLowerCase(),
    joinDate: new Date(user.createdAt).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }),
    status: user.isActive ? 'Active' : 'Inactive'
  }
}
```

**Better:**

```typescript
// In utils/userFormatters.ts - single source of truth
export interface FormattedUser {
  fullName: string
  displayEmail: string
  joinDate: string
  status: 'Active' | 'Inactive'
}

export function formatUserForDisplay(user: User): FormattedUser {
  return {
    fullName: `${user.firstName} ${user.lastName}`,
    displayEmail: user.email.toLowerCase(),
    joinDate: formatDate(user.createdAt),
    status: user.isActive ? 'Active' : 'Inactive'
  }
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

// In all components - import and use
import { formatUserForDisplay } from '@/utils/userFormatters'
```

### Checklist

- [ ] Same logic appears in multiple files or components
- [ ] Copy-pasted code with minor variations (different variable names)
- [ ] Similar conditional structures repeated across the codebase
- [ ] Multiple components with nearly identical computed properties or methods
- [ ] Same validation logic duplicated in different places

---

## Lazy Class

A class that isn't doing enough to justify its existence. Each class costs time to understand and maintain. If a class doesn't do enough, it should be merged into another class.

### Refactoring: Inline Class, Collapse Hierarchy

**Bad:**

```typescript
// A class that barely does anything
class UserNameFormatter {
  format(firstName: string, lastName: string): string {
    return `${firstName} ${lastName}`
  }
}

// A thin wrapper with no added value
class ApiResponseWrapper<T> {
  constructor(public data: T) {}
  
  getData(): T {
    return this.data
  }
}

// An over-abstracted base class
abstract class BaseValidator {
  abstract validate(value: unknown): boolean
}

class EmailValidator extends BaseValidator {
  validate(value: unknown): boolean {
    return typeof value === 'string' && value.includes('@')
  }
}

// Usage becomes unnecessarily complex
const formatter = new UserNameFormatter()
const fullName = formatter.format(user.firstName, user.lastName)

const wrapper = new ApiResponseWrapper(response)
const data = wrapper.getData()
```

**Better:**

```typescript
// Simple utility function instead of a class
function formatUserName(firstName: string, lastName: string): string {
  return `${firstName} ${lastName}`
}

// Use the data directly, no wrapper needed
const data = response

// Simple function instead of class hierarchy
function isValidEmail(value: unknown): boolean {
  return typeof value === 'string' && value.includes('@')
}

// Or if you need multiple validators, use a simple object
const validators = {
  email: (value: string) => value.includes('@'),
  phone: (value: string) => /^\+?[\d\s-]+$/.test(value),
  required: (value: unknown) => value != null && value !== ''
}

// Usage is straightforward
const fullName = formatUserName(user.firstName, user.lastName)
const isValid = validators.email(email)
```

### Checklist

- [ ] Class has only one or two trivial methods
- [ ] Class is a thin wrapper with no additional logic
- [ ] Class exists only to hold a single piece of data
- [ ] Subclass doesn't add any behavior to parent class
- [ ] Class was created for "future extensibility" but never extended

---

## Dead Code

A variable, parameter, field, method, or class that is no longer used anywhere in the codebase. Dead code adds noise, increases cognitive load, and can mislead developers.

### Refactoring: Delete Unused Code

**Bad:**

```typescript
interface UserConfig {
  theme: 'light' | 'dark'
  language: string
  legacyMode: boolean      // No longer used since v2.0
  experimentalFeatures: boolean  // Feature was either shipped or abandoned
}

function processUser(
  user: User,
  options: ProcessOptions,
  callback?: () => void   // Callbacks replaced with async/await, never passed
) {
  // Old implementation kept "just in case"
  // if (options.useLegacyProcess) {
  //   return legacyProcessUser(user)
  // }
  
  const result = transformUser(user, options)
  
  // This was for debugging, forgot to remove
  console.log('Processing user:', user.id)
  
  return result
}

// Function that nothing calls anymore
function legacyProcessUser(user: User): ProcessedUser {
  // ... old implementation
}

// Unused utility that seemed useful when written
function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj))
}

// Component that was replaced but never deleted
// export const OldUserCard = defineComponent({ ... })
```

**Better:**

```typescript
interface UserConfig {
  theme: 'light' | 'dark'
  language: string
}

function processUser(user: User, options: ProcessOptions) {
  return transformUser(user, options)
}

// Delete legacyProcessUser entirely
// Delete deepClone if unused
// Delete OldUserCard component file
// Remove commented-out code blocks
```

### Checklist

- [ ] Variables or parameters that are assigned but never read
- [ ] Functions or methods that are never called
- [ ] Imports that are not used
- [ ] Commented-out code blocks left "for reference"
- [ ] Feature flags or config options for removed features
- [ ] TODO comments for tasks that were completed differently
- [ ] Console.log statements from debugging sessions

---

## Speculative Generality

Code written to handle cases that never actually occur, created because someone thought "we might need this someday." This adds complexity without providing value.

### Refactoring: Collapse Hierarchy, Inline Class, Remove Parameter

**Bad:**

```typescript
// Abstract factory for a single implementation
interface DataSourceFactory {
  createDataSource(type: string): DataSource
}

abstract class DataSource {
  abstract connect(): Promise<void>
  abstract query(sql: string): Promise<unknown[]>
  abstract disconnect(): Promise<void>
}

class PostgresDataSource extends DataSource {
  // The only implementation that exists
  async connect() { /* ... */ }
  async query(sql: string) { /* ... */ }
  async disconnect() { /* ... */ }
}

// Unused parameters "for future flexibility"
function fetchUsers(
  filters: UserFilters,
  pagination: Pagination,
  sorting?: SortOptions,      // Never used
  cacheStrategy?: CacheStrategy,  // Never used
  abortSignal?: AbortSignal   // Never used
) {
  return api.get('/users', { params: { ...filters, ...pagination } })
}

// Over-engineered component for simple use case
interface ButtonProps {
  variant: 'primary' | 'secondary' | 'tertiary' | 'ghost' | 'link'
  size: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  loading?: boolean
  disabled?: boolean
  leftIcon?: Component
  rightIcon?: Component
  loadingText?: string
  spinnerPlacement?: 'start' | 'end'
  // ... 15 more props that are rarely used
}
```

**Better:**

```typescript
// Direct implementation, no unnecessary abstraction
class PostgresDataSource {
  async connect(): Promise<void> { /* ... */ }
  async query(sql: string): Promise<unknown[]> { /* ... */ }
  async disconnect(): Promise<void> { /* ... */ }
}

// Only parameters that are actually used
function fetchUsers(filters: UserFilters, pagination: Pagination) {
  return api.get('/users', { params: { ...filters, ...pagination } })
}

// Simpler component that covers real use cases
interface ButtonProps {
  variant?: 'primary' | 'secondary'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  disabled?: boolean
}

// Add complexity when you actually need it:
// - Add 'tertiary' variant when a design requires it
// - Add 'leftIcon' when you have a button that needs one
// - Add 'cacheStrategy' when you implement caching
```

### Checklist

- [ ] Abstract classes or interfaces with only one implementation
- [ ] Parameters that are always passed the same value or never used
- [ ] Unused hook parameters or lifecycle methods
- [ ] Configuration options that are never changed from defaults
- [ ] Generic type parameters that are always the same type
- [ ] Elaborate plugin/extension systems with no plugins
- [ ] "Framework-like" code in an application codebase
