# Couplers

All the smells in this group contribute to excessive coupling between classes. The goal is to **Encapsulate / Move** to reduce dependencies.

---

## Feature Envy

A method accesses the data of another object more than its own data. The method seems more interested in a class other than the one it actually belongs to.

### Refactoring: Move Method, Extract Method

**Bad:**

```typescript
class OrderPrinter {
  printOrder(order: Order): string {
    // This method is "envious" of Order's data
    const subtotal = order.items.reduce(
      (sum, item) => sum + item.price * item.quantity, 
      0
    )
    const discount = order.customer.membershipLevel === 'gold' 
      ? subtotal * 0.1 
      : order.customer.membershipLevel === 'silver'
        ? subtotal * 0.05
        : 0
    const tax = subtotal * order.taxRate
    const total = subtotal - discount + tax
    
    return `
      Order #${order.id}
      Customer: ${order.customer.name}
      Items: ${order.items.length}
      Subtotal: $${subtotal.toFixed(2)}
      Discount: -$${discount.toFixed(2)}
      Tax: $${tax.toFixed(2)}
      Total: $${total.toFixed(2)}
    `
  }
}
```

**Better:**

```typescript
class Order {
  id: string
  items: OrderItem[]
  customer: Customer
  taxRate: number
  
  getSubtotal(): number {
    return this.items.reduce(
      (sum, item) => sum + item.price * item.quantity, 
      0
    )
  }
  
  getDiscount(): number {
    return this.customer.getDiscountRate() * this.getSubtotal()
  }
  
  getTax(): number {
    return this.getSubtotal() * this.taxRate
  }
  
  getTotal(): number {
    return this.getSubtotal() - this.getDiscount() + this.getTax()
  }
}

class Customer {
  membershipLevel: 'gold' | 'silver' | 'bronze'
  
  getDiscountRate(): number {
    const rates = { gold: 0.1, silver: 0.05, bronze: 0 }
    return rates[this.membershipLevel] ?? 0
  }
}

class OrderPrinter {
  printOrder(order: Order): string {
    return `
      Order #${order.id}
      Customer: ${order.customer.name}
      Items: ${order.items.length}
      Subtotal: $${order.getSubtotal().toFixed(2)}
      Discount: -$${order.getDiscount().toFixed(2)}
      Tax: $${order.getTax().toFixed(2)}
      Total: $${order.getTotal().toFixed(2)}
    `
  }
}
```

### Checklist

- [ ] Method uses more fields/methods from another class than its own
- [ ] Method receives an object and immediately destructures most of its properties
- [ ] Method could logically belong to the class whose data it manipulates
- [ ] Method contains calculations that only use external object's data

---

## Inappropriate Intimacy

One class uses internal fields and methods of another class excessively. Classes become too tightly coupled, knowing too much about each other's internals.

### Refactoring: Move Method, Move Field, Extract Class

**Bad:**

```typescript
class UserProfile {
  private _email: string
  private _preferences: Map<string, string>
  private _notificationSettings: NotificationSettings
  
  // Exposing internal state
  get preferences() { return this._preferences }
  get notificationSettings() { return this._notificationSettings }
}

class NotificationService {
  sendNotification(profile: UserProfile, message: string) {
    // Reaching deep into UserProfile's internals
    const settings = profile.notificationSettings
    
    if (settings.emailEnabled) {
      // Accessing private-ish data through getters
      const frequency = profile.preferences.get('emailFrequency')
      if (frequency === 'immediate') {
        this.sendEmail(profile._email, message) // Direct field access!
      }
    }
    
    if (settings.pushEnabled && profile.preferences.get('pushSound') === 'on') {
      this.sendPush(message, { sound: true })
    }
  }
}

// Vue component with inappropriate intimacy
const useUserStore = defineStore('user', () => {
  const state = reactive({
    _internalCache: new Map(),
    _pendingRequests: [],
    user: null as User | null
  })
  
  return { state }
})

// Component reaching into store internals
const store = useUserStore()
store.state._internalCache.clear() // Accessing internal implementation!
```

**Better:**

```typescript
class UserProfile {
  private email: string
  private preferences: Map<string, string>
  private notificationSettings: NotificationSettings
  
  // Expose behavior, not data
  shouldSendImmediateEmail(): boolean {
    return this.notificationSettings.emailEnabled 
      && this.preferences.get('emailFrequency') === 'immediate'
  }
  
  shouldSendPushWithSound(): boolean {
    return this.notificationSettings.pushEnabled 
      && this.preferences.get('pushSound') === 'on'
  }
  
  getEmailForNotification(): string {
    return this.email
  }
}

class NotificationService {
  sendNotification(profile: UserProfile, message: string) {
    // Using well-defined public interface
    if (profile.shouldSendImmediateEmail()) {
      this.sendEmail(profile.getEmailForNotification(), message)
    }
    
    if (profile.shouldSendPushWithSound()) {
      this.sendPush(message, { sound: true })
    }
  }
}

// Vue store with proper encapsulation
const useUserStore = defineStore('user', () => {
  const user = ref<User | null>(null)
  
  // Internal state stays internal
  const internalCache = new Map()
  const pendingRequests: Promise<void>[] = []
  
  // Expose actions, not internals
  function clearCache() {
    internalCache.clear()
  }
  
  return { user, clearCache }
})
```

### Checklist

- [ ] Class accesses private or internal fields of another class
- [ ] Class knows about the internal data structure of another class
- [ ] Changes in one class frequently require changes in the other
- [ ] Two classes have bidirectional dependencies on each other's internals
- [ ] Class exposes getters that return mutable internal collections

---

## Message Chains

A client requests another object, then that object requests yet another one, and so on. The chain means the client is coupled to the entire structure of the navigation.

### Refactoring: Hide Delegate, Extract Method

**Bad:**

```typescript
// Long chain of method calls
function getManagerEmail(employee: Employee): string {
  return employee
    .getDepartment()
    .getTeam()
    .getManager()
    .getContactInfo()
    .getEmail()
}

// Vue component with message chains
const userCity = computed(() => {
  return props.order
    ?.customer
    ?.address
    ?.city
    ?.name ?? 'Unknown'
})

// Pinia store message chain
const currentUserPermissions = computed(() => {
  return authStore
    .getCurrentSession()
    .getUser()
    .getRole()
    .getPermissions()
    .filter(p => p.isActive)
})

// API response navigation
async function getProductReviews(orderId: string) {
  const response = await api.getOrder(orderId)
  return response
    .data
    .order
    .items[0]
    .product
    .reviews
    .filter(r => r.rating > 3)
}
```

**Better:**

```typescript
// Hide the delegation chain
class Employee {
  private department: Department
  
  getManagerEmail(): string {
    return this.department.getManagerEmail()
  }
}

class Department {
  private team: Team
  
  getManagerEmail(): string {
    return this.team.getManagerEmail()
  }
}

class Team {
  private manager: Employee
  
  getManagerEmail(): string {
    return this.manager.getEmail()
  }
}

// Usage is now simple
function getManagerEmail(employee: Employee): string {
  return employee.getManagerEmail()
}

// Vue component - extract to composable with null-safe helper
function useOrderAddress(order: Ref<Order | undefined>) {
  const cityName = computed(() => order.value?.customer?.address?.city?.name ?? 'Unknown')
  const fullAddress = computed(() => formatAddress(order.value?.customer?.address))
  
  return { cityName, fullAddress }
}

// Pinia store - encapsulate in getter
const useAuthStore = defineStore('auth', () => {
  const session = ref<Session | null>(null)
  
  const activePermissions = computed(() => {
    return session.value?.user?.role?.permissions?.filter(p => p.isActive) ?? []
  })
  
  function hasPermission(name: string): boolean {
    return activePermissions.value.some(p => p.name === name)
  }
  
  return { session, activePermissions, hasPermission }
})

// API response - transform at the service layer
class OrderService {
  async getHighRatedReviews(orderId: string): Promise<Review[]> {
    const order = await this.api.getOrder(orderId)
    return this.extractHighRatedReviews(order)
  }
  
  private extractHighRatedReviews(order: Order): Review[] {
    const firstProduct = order.items[0]?.product
    return firstProduct?.reviews?.filter(r => r.rating > 3) ?? []
  }
}
```

### Checklist

- [ ] Code contains chains of 3+ method calls or property accesses
- [ ] Client code needs to understand the entire object graph
- [ ] Changes to intermediate classes break distant client code
- [ ] Optional chaining (`?.`) is used excessively to navigate deep structures
- [ ] Same navigation chain appears in multiple places

---

## Middle Man

A class performs only one action, delegating work to another class. When a class delegates most of its work, it becomes unnecessary indirection.

### Refactoring: Remove Middle Man, Inline Method

**Bad:**

```typescript
// Unnecessary wrapper class
class UserService {
  private userRepository: UserRepository
  
  constructor(userRepository: UserRepository) {
    this.userRepository = userRepository
  }
  
  // All methods just delegate to repository
  getUser(id: string): User | undefined {
    return this.userRepository.getUser(id)
  }
  
  saveUser(user: User): void {
    this.userRepository.saveUser(user)
  }
  
  deleteUser(id: string): void {
    this.userRepository.deleteUser(id)
  }
  
  findUsersByEmail(email: string): User[] {
    return this.userRepository.findUsersByEmail(email)
  }
}

// Vue composable that just wraps a store
function useUser() {
  const store = useUserStore()
  
  // Just forwarding everything - no added value
  const user = computed(() => store.user)
  const isLoggedIn = computed(() => store.isLoggedIn)
  const login = (email: string, password: string) => store.login(email, password)
  const logout = () => store.logout()
  
  return { user, isLoggedIn, login, logout }
}

// Component that just renders a child
const ModalWrapper = defineComponent({
  props: ['isOpen', 'title', 'content'],
  setup(props) {
    return () => h(Modal, {
      isOpen: props.isOpen,
      title: props.title,
      content: props.content
    })
  }
})
```

**Better:**

```typescript
// Option 1: Remove the middle man, use repository directly
class OrderController {
  constructor(private userRepository: UserRepository) {}
  
  async createOrder(userId: string, items: CartItem[]) {
    // Use repository directly instead of going through UserService
    const user = this.userRepository.getUser(userId)
    if (!user) throw new Error('User not found')
    // ... rest of order logic
  }
}

// Option 2: If service adds value, make it do real work
class UserService {
  constructor(
    private userRepository: UserRepository,
    private emailService: EmailService,
    private cacheService: CacheService
  ) {}
  
  async getUser(id: string): Promise<User | undefined> {
    // Now adds caching logic
    const cached = await this.cacheService.get(`user:${id}`)
    if (cached) return cached
    
    const user = await this.userRepository.getUser(id)
    if (user) await this.cacheService.set(`user:${id}`, user)
    return user
  }
  
  async createUser(data: CreateUserDto): Promise<User> {
    // Now adds business logic
    const user = await this.userRepository.saveUser(data)
    await this.emailService.sendWelcomeEmail(user)
    return user
  }
}

// Use the store directly if composable adds no value
const UserDashboard = defineComponent({
  setup() {
    const store = useUserStore()
    
    return () => (
      <div>
        <h1>Welcome, {store.user?.name}</h1>
        <button onClick={() => store.logout()}>Logout</button>
      </div>
    )
  }
})

// Or make the composable add real value
function useUserWithValidation() {
  const store = useUserStore()
  const router = useRouter()
  
  // Adds validation and side effects
  const login = async (email: string, password: string) => {
    if (!isValidEmail(email)) {
      throw new Error('Invalid email format')
    }
    await store.login(email, password)
    router.push('/dashboard')
  }
  
  // Adds cleanup logic
  const logout = async () => {
    await store.logout()
    localStorage.removeItem('preferences')
    router.push('/login')
  }
  
  return { user: store.user, isLoggedIn: store.isLoggedIn, login, logout }
}
```

### Checklist

- [ ] Class has methods that only delegate to another object
- [ ] Removing the class would not affect the system's behavior
- [ ] Class adds no additional logic, validation, or error handling
- [ ] Class exists "just in case" for future flexibility that never comes
- [ ] Composable or wrapper provides no additional functionality beyond forwarding
