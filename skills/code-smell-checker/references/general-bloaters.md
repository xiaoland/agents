# Bloaters

Code, methods, and classes that have increased to such proportions that they are hard to work with. The goal is to **Extract Method / Class** to reduce size and complexity.

---

## Long Method

A method contains too many lines of code (>20-25 lines). Generally, any method longer than 20-25 lines should make you suspicious.

### Refactoring: Extract Method

**Bad:**

```typescript
async function processUserOrder(userId: string, items: CartItem[]) {
  // Validate user
  const user = await fetchUser(userId)
  if (!user) throw new Error('User not found')
  if (!user.isActive) throw new Error('User is inactive')
  if (user.isBanned) throw new Error('User is banned')
  
  // Calculate totals
  let subtotal = 0
  for (const item of items) {
    const product = await fetchProduct(item.productId)
    if (!product) throw new Error(`Product ${item.productId} not found`)
    if (product.stock < item.quantity) throw new Error('Insufficient stock')
    subtotal += product.price * item.quantity
  }
  
  // Apply discounts
  let discount = 0
  if (user.membershipLevel === 'gold') discount = subtotal * 0.1
  else if (user.membershipLevel === 'silver') discount = subtotal * 0.05
  if (items.length > 5) discount += subtotal * 0.02
  
  // Calculate tax
  const taxRate = user.region === 'EU' ? 0.2 : 0.1
  const tax = (subtotal - discount) * taxRate
  
  // Create order
  const order = await createOrder({
    userId,
    items,
    subtotal,
    discount,
    tax,
    total: subtotal - discount + tax
  })
  
  // Send notifications
  await sendEmail(user.email, 'Order Confirmation', `Order ${order.id}`)
  await sendPushNotification(userId, 'Order placed successfully')
  
  return order
}
```

**Better:**

```typescript
async function processUserOrder(userId: string, items: CartItem[]) {
  const user = await validateUser(userId)
  const subtotal = await calculateSubtotal(items)
  const discount = calculateDiscount(user, items, subtotal)
  const tax = calculateTax(user, subtotal - discount)
  
  const order = await createOrder({
    userId,
    items,
    subtotal,
    discount,
    tax,
    total: subtotal - discount + tax
  })
  
  await sendOrderNotifications(user, order)
  return order
}

async function validateUser(userId: string): Promise<User> {
  const user = await fetchUser(userId)
  if (!user) throw new Error('User not found')
  if (!user.isActive) throw new Error('User is inactive')
  if (user.isBanned) throw new Error('User is banned')
  return user
}

function calculateDiscount(user: User, items: CartItem[], subtotal: number): number {
  let discount = 0
  if (user.membershipLevel === 'gold') discount = subtotal * 0.1
  else if (user.membershipLevel === 'silver') discount = subtotal * 0.05
  if (items.length > 5) discount += subtotal * 0.02
  return discount
}
```

### Checklist

- [ ] Method exceeds 20-25 lines of code
- [ ] Method has multiple levels of abstraction
- [ ] Method contains comments separating "sections" of logic
- [ ] Method name requires "and" to describe what it does
- [ ] Method has deeply nested conditionals or loops

---

## Large Class

A class trying to do too much, containing too many fields, methods, or responsibilities. Often called a "God Class" or "Blob".

### Refactoring: Extract Class

**Bad:**

```typescript
class UserManager {
  // User data
  private users: Map<string, User> = new Map()
  
  // Authentication
  private tokens: Map<string, string> = new Map()
  private refreshTokens: Map<string, string> = new Map()
  
  // Email
  private emailQueue: Email[] = []
  private smtpConfig: SmtpConfig
  
  // Analytics
  private loginAttempts: Map<string, number> = new Map()
  private pageViews: Map<string, number> = new Map()
  
  // User CRUD
  createUser(data: UserData): User { /* ... */ }
  updateUser(id: string, data: Partial<UserData>): User { /* ... */ }
  deleteUser(id: string): void { /* ... */ }
  
  // Authentication
  login(email: string, password: string): string { /* ... */ }
  logout(token: string): void { /* ... */ }
  refreshToken(refreshToken: string): string { /* ... */ }
  validateToken(token: string): boolean { /* ... */ }
  
  // Email
  sendWelcomeEmail(userId: string): void { /* ... */ }
  sendPasswordReset(userId: string): void { /* ... */ }
  processEmailQueue(): void { /* ... */ }
  
  // Analytics
  trackLogin(userId: string): void { /* ... */ }
  trackPageView(userId: string, page: string): void { /* ... */ }
  generateReport(): AnalyticsReport { /* ... */ }
}
```

**Better:**

```typescript
class UserRepository {
  private users: Map<string, User> = new Map()
  
  create(data: UserData): User { /* ... */ }
  update(id: string, data: Partial<UserData>): User { /* ... */ }
  delete(id: string): void { /* ... */ }
  findById(id: string): User | undefined { /* ... */ }
}

class AuthService {
  private tokens: Map<string, string> = new Map()
  private refreshTokens: Map<string, string> = new Map()
  
  constructor(private userRepository: UserRepository) {}
  
  login(email: string, password: string): string { /* ... */ }
  logout(token: string): void { /* ... */ }
  refreshToken(refreshToken: string): string { /* ... */ }
  validateToken(token: string): boolean { /* ... */ }
}

class EmailService {
  private queue: Email[] = []
  
  constructor(private config: SmtpConfig) {}
  
  sendWelcomeEmail(user: User): void { /* ... */ }
  sendPasswordReset(user: User): void { /* ... */ }
  processQueue(): void { /* ... */ }
}

class AnalyticsService {
  private loginAttempts: Map<string, number> = new Map()
  private pageViews: Map<string, number> = new Map()
  
  trackLogin(userId: string): void { /* ... */ }
  trackPageView(userId: string, page: string): void { /* ... */ }
  generateReport(): AnalyticsReport { /* ... */ }
}
```

### Checklist

- [ ] Class has more than 10-15 methods
- [ ] Class has more than 5-7 fields
- [ ] Class name is too generic (Manager, Handler, Processor, Helper)
- [ ] Class has methods that don't use most of the class fields
- [ ] Class requires "and" to describe its single responsibility

---

## Primitive Obsession

Using primitive types instead of small objects for simple tasks. Examples: using string for phone number, email, or currency; using number for temperature or coordinates.

### Refactoring: Replace Primitive with Object

**Bad:**

```typescript
interface User {
  name: string
  email: string           // Just a string, no validation
  phone: string           // Could be any format
  birthDate: string       // ISO string? Locale string?
}

function sendNotification(userId: string, email: string, phone: string) {
  // No type safety - could pass phone as email
  if (email.includes('@')) {
    sendEmail(email)
  }
  if (phone.match(/^\+?[\d\s-]+$/)) {
    sendSms(phone)
  }
}

// Currency as number loses precision and unit info
function calculateTotal(prices: number[]): number {
  return prices.reduce((sum, price) => sum + price, 0)
}
```

**Better:**

```typescript
class Email {
  private readonly value: string
  
  constructor(value: string) {
    if (!this.isValid(value)) {
      throw new Error(`Invalid email: ${value}`)
    }
    this.value = value.toLowerCase()
  }
  
  private isValid(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  }
  
  toString(): string {
    return this.value
  }
  
  getDomain(): string {
    return this.value.split('@')[1]
  }
}

class PhoneNumber {
  private readonly value: string
  
  constructor(value: string, private readonly countryCode: string = '+1') {
    this.value = this.normalize(value)
  }
  
  private normalize(phone: string): string {
    return phone.replace(/[\s-()]/g, '')
  }
  
  format(): string {
    return `${this.countryCode} ${this.value}`
  }
}

class Money {
  constructor(
    private readonly amount: number,
    private readonly currency: string = 'USD'
  ) {}
  
  add(other: Money): Money {
    if (this.currency !== other.currency) {
      throw new Error('Currency mismatch')
    }
    return new Money(this.amount + other.amount, this.currency)
  }
  
  format(): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: this.currency
    }).format(this.amount)
  }
}

interface User {
  name: string
  email: Email
  phone: PhoneNumber
  birthDate: Date
}
```

### Checklist

- [ ] Using string for structured data (email, phone, URL, ID)
- [ ] Using number for values with units (currency, temperature, distance)
- [ ] Validation logic repeated in multiple places
- [ ] Formatting logic duplicated across codebase
- [ ] Type confusion possible (passing phone where email expected)

---

## Long Parameter List

More than 3-4 parameters for a single method. Hard to understand, easy to mix up order, and indicates the method may be doing too much.

### Refactoring: Introduce Parameter Object

**Bad:**

```typescript
function createUser(
  firstName: string,
  lastName: string,
  email: string,
  password: string,
  phone: string,
  address: string,
  city: string,
  country: string,
  postalCode: string,
  role: string,
  department: string
): User {
  // Easy to mix up parameter order
  return { /* ... */ }
}

// Calling code is confusing
const user = createUser(
  'John',
  'Doe',
  'john@example.com',
  'password123',
  '+1234567890',
  '123 Main St',
  'New York',
  'USA',
  '10001',
  'admin',
  'engineering'
)

// Vue composable with too many params
function useDataTable(
  data: Ref<any[]>,
  sortField: Ref<string>,
  sortOrder: Ref<'asc' | 'desc'>,
  page: Ref<number>,
  pageSize: Ref<number>,
  filters: Ref<Record<string, any>>,
  searchQuery: Ref<string>,
  selectedRows: Ref<any[]>
) {
  // ...
}
```

**Better:**

```typescript
interface CreateUserParams {
  firstName: string
  lastName: string
  email: string
  password: string
  phone?: string
  address?: AddressParams
  role?: string
  department?: string
}

interface AddressParams {
  street: string
  city: string
  country: string
  postalCode: string
}

function createUser(params: CreateUserParams): User {
  const { firstName, lastName, email, password, phone, address, role, department } = params
  return { /* ... */ }
}

// Clear and self-documenting
const user = createUser({
  firstName: 'John',
  lastName: 'Doe',
  email: 'john@example.com',
  password: 'password123',
  address: {
    street: '123 Main St',
    city: 'New York',
    country: 'USA',
    postalCode: '10001'
  },
  role: 'admin',
  department: 'engineering'
})

// Vue composable with options object
interface DataTableOptions<T> {
  data: Ref<T[]>
  sorting?: {
    field: Ref<keyof T>
    order: Ref<'asc' | 'desc'>
  }
  pagination?: {
    page: Ref<number>
    pageSize: Ref<number>
  }
  filters?: Ref<Record<string, any>>
  searchQuery?: Ref<string>
}

function useDataTable<T>(options: DataTableOptions<T>) {
  const { data, sorting, pagination, filters, searchQuery } = options
  // ...
}
```

### Checklist

- [ ] Method has more than 3-4 parameters
- [ ] Parameters are often passed in wrong order
- [ ] Several parameters are related (e.g., x, y, width, height)
- [ ] Boolean parameters that toggle behavior
- [ ] Same group of parameters passed to multiple methods

---

## Data Clumps

Same group of variables appearing together in multiple places. Often seen as repeated parameters, fields that are always used together, or data that travels as a group.

### Refactoring: Extract Class

**Bad:**

```typescript
// Same data repeated in multiple interfaces
interface Order {
  // Order data
  orderId: string
  items: OrderItem[]
  
  // Address clump - appears everywhere
  shippingStreet: string
  shippingCity: string
  shippingCountry: string
  shippingPostalCode: string
  
  billingStreet: string
  billingCity: string
  billingCountry: string
  billingPostalCode: string
}

interface Customer {
  name: string
  
  // Same address clump
  street: string
  city: string
  country: string
  postalCode: string
}

// Functions with same parameter groups
function calculateShipping(
  street: string,
  city: string,
  country: string,
  postalCode: string
): number {
  // ...
}

function validateAddress(
  street: string,
  city: string,
  country: string,
  postalCode: string
): boolean {
  // ...
}

// Vue component with repeated props
defineProps<{
  startYear: number
  startMonth: number
  startDay: number
  endYear: number
  endMonth: number
  endDay: number
}>()
```

**Better:**

```typescript
// Extract the clump into its own class/interface
interface Address {
  street: string
  city: string
  country: string
  postalCode: string
}

interface Order {
  orderId: string
  items: OrderItem[]
  shippingAddress: Address
  billingAddress: Address
}

interface Customer {
  name: string
  address: Address
}

// Functions now take the object
function calculateShipping(address: Address): number {
  // Can now add methods to Address class if needed
}

function validateAddress(address: Address): boolean {
  // Validation logic in one place
}

// Class with behavior
class Address {
  constructor(
    public street: string,
    public city: string,
    public country: string,
    public postalCode: string
  ) {}
  
  format(): string {
    return `${this.street}, ${this.city}, ${this.country} ${this.postalCode}`
  }
  
  isInternational(homeCountry: string): boolean {
    return this.country !== homeCountry
  }
}

// Vue component with clean props
interface DateRange {
  start: Date
  end: Date
}

defineProps<{
  dateRange: DateRange
}>()
```

### Checklist

- [ ] Same 3+ variables appear together in multiple places
- [ ] Fields in a class are always used together
- [ ] Same parameters passed to multiple functions
- [ ] Changing one variable requires changing others
- [ ] Data has no dedicated type/class to represent it
