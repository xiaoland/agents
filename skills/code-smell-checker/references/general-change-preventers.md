# Change Preventers

These smells mean that if you need to change something in one place, you have to make many changes in other places too. The goal is to **Decouple / Organize** responsibilities properly.

---

## Divergent Change

When you have to change many unrelated methods in a single class for different reasons. This is a violation of the Single Responsibility Principle (SRP) - one class should have only one reason to change.

### Refactoring: Extract Class

**Bad:**

```typescript
class UserService {
  // Changes when user data structure changes
  createUser(data: UserData): User {
    return {
      id: generateId(),
      ...data,
      createdAt: new Date()
    }
  }
  
  updateUser(id: string, data: Partial<UserData>): User {
    const user = this.findById(id)
    return { ...user, ...data, updatedAt: new Date() }
  }
  
  // Changes when authentication logic changes
  hashPassword(password: string): string {
    return bcrypt.hashSync(password, 10)
  }
  
  verifyPassword(password: string, hash: string): boolean {
    return bcrypt.compareSync(password, hash)
  }
  
  generateToken(user: User): string {
    return jwt.sign({ userId: user.id }, SECRET, { expiresIn: '1h' })
  }
  
  // Changes when notification requirements change
  sendWelcomeEmail(user: User): void {
    this.mailer.send(user.email, 'Welcome!', welcomeTemplate(user))
  }
  
  sendPasswordResetEmail(user: User, token: string): void {
    this.mailer.send(user.email, 'Reset Password', resetTemplate(token))
  }
  
  // Changes when validation rules change
  validateEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  }
  
  validatePassword(password: string): string[] {
    const errors: string[] = []
    if (password.length < 8) errors.push('Too short')
    if (!/[A-Z]/.test(password)) errors.push('Needs uppercase')
    return errors
  }
}
```

**Better:**

```typescript
// Each class has a single reason to change
class UserRepository {
  create(data: UserData): User {
    return {
      id: generateId(),
      ...data,
      createdAt: new Date()
    }
  }
  
  update(id: string, data: Partial<UserData>): User {
    const user = this.findById(id)
    return { ...user, ...data, updatedAt: new Date() }
  }
}

class PasswordService {
  hash(password: string): string {
    return bcrypt.hashSync(password, 10)
  }
  
  verify(password: string, hash: string): boolean {
    return bcrypt.compareSync(password, hash)
  }
}

class TokenService {
  generate(user: User): string {
    return jwt.sign({ userId: user.id }, SECRET, { expiresIn: '1h' })
  }
  
  verify(token: string): TokenPayload {
    return jwt.verify(token, SECRET) as TokenPayload
  }
}

class UserNotificationService {
  constructor(private mailer: Mailer) {}
  
  sendWelcome(user: User): void {
    this.mailer.send(user.email, 'Welcome!', welcomeTemplate(user))
  }
  
  sendPasswordReset(user: User, token: string): void {
    this.mailer.send(user.email, 'Reset Password', resetTemplate(token))
  }
}

class UserValidator {
  validateEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  }
  
  validatePassword(password: string): string[] {
    const errors: string[] = []
    if (password.length < 8) errors.push('Too short')
    if (!/[A-Z]/.test(password)) errors.push('Needs uppercase')
    return errors
  }
}
```

### Checklist

- [ ] Class changes for multiple unrelated reasons (auth, validation, persistence, notifications)
- [ ] Different methods in the class use completely different dependencies
- [ ] Class has multiple "sections" of functionality separated by comments
- [ ] Changes to one business rule affect methods unrelated to that rule
- [ ] Class name is generic (Service, Manager, Handler) hiding multiple responsibilities

---

## Shotgun Surgery

The opposite of Divergent Change: making any single modification requires making many small changes to many different classes. You have to "shoot" changes across the entire codebase.

### Refactoring: Move Method, Move Field, Inline Class

**Bad:**

```typescript
// User ID format is scattered across many files
// Changing from UUID to nanoid requires changes everywhere

// In UserController.ts
function validateUserId(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)
}

// In OrderService.ts
function extractUserFromOrder(order: Order): string {
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  if (!uuidPattern.test(order.userId)) throw new Error('Invalid user ID')
  return order.userId
}

// In AnalyticsTracker.ts
function trackUserEvent(userId: string, event: string): void {
  if (userId.length !== 36) {
    console.warn('Invalid user ID format')
    return
  }
  // track event...
}

// In UserRepository.ts
function generateUserId(): string {
  return crypto.randomUUID()
}

// In api/validators.ts
const userIdSchema = z.string().uuid()

// In tests/helpers.ts
function createMockUserId(): string {
  return '00000000-0000-4000-8000-000000000000'
}
```

**Better:**

```typescript
// Centralize user ID logic in one place
class UserId {
  private static readonly PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  
  private constructor(private readonly value: string) {}
  
  static generate(): UserId {
    return new UserId(crypto.randomUUID())
  }
  
  static fromString(value: string): UserId {
    if (!UserId.isValid(value)) {
      throw new Error(`Invalid user ID: ${value}`)
    }
    return new UserId(value)
  }
  
  static isValid(value: string): boolean {
    return UserId.PATTERN.test(value)
  }
  
  static mock(): UserId {
    return new UserId('00000000-0000-4000-8000-000000000000')
  }
  
  toString(): string {
    return this.value
  }
  
  equals(other: UserId): boolean {
    return this.value === other.value
  }
}

// Now all usages reference the single source of truth
// In UserController.ts
function validateUserId(id: string): boolean {
  return UserId.isValid(id)
}

// In OrderService.ts
function extractUserFromOrder(order: Order): UserId {
  return UserId.fromString(order.userId)
}

// In AnalyticsTracker.ts
function trackUserEvent(userId: UserId, event: string): void {
  // Type system ensures valid ID
  analytics.track(userId.toString(), event)
}
```

### Checklist

- [ ] Same validation logic duplicated across multiple files
- [ ] Changing a data format requires updating many classes
- [ ] Business rules are scattered instead of centralized
- [ ] Configuration values are hardcoded in multiple places
- [ ] String constants (error messages, field names) appear in many files

---

## Parallel Inheritance Hierarchies

When you create a subclass for one class, you find yourself needing to create a subclass for another class. This creates a maintenance burden where hierarchies must evolve together.

### Refactoring: Move Method, Move Field

**Bad:**

```typescript
// Every time we add a new document type, we need to add:
// 1. A new Document subclass
// 2. A new Renderer subclass
// 3. A new Validator subclass

abstract class Document {
  abstract getContent(): string
}

class PdfDocument extends Document {
  getContent(): string { return 'PDF content' }
}

class WordDocument extends Document {
  getContent(): string { return 'Word content' }
}

class MarkdownDocument extends Document {
  getContent(): string { return 'Markdown content' }
}

// Parallel hierarchy for rendering
abstract class DocumentRenderer {
  abstract render(doc: Document): void
}

class PdfRenderer extends DocumentRenderer {
  render(doc: PdfDocument): void { /* PDF rendering logic */ }
}

class WordRenderer extends DocumentRenderer {
  render(doc: WordDocument): void { /* Word rendering logic */ }
}

class MarkdownRenderer extends DocumentRenderer {
  render(doc: MarkdownDocument): void { /* Markdown rendering logic */ }
}

// Another parallel hierarchy for validation
abstract class DocumentValidator {
  abstract validate(doc: Document): ValidationResult
}

class PdfValidator extends DocumentValidator {
  validate(doc: PdfDocument): ValidationResult { /* ... */ }
}

class WordValidator extends DocumentValidator {
  validate(doc: WordDocument): ValidationResult { /* ... */ }
}

class MarkdownValidator extends DocumentValidator {
  validate(doc: MarkdownDocument): ValidationResult { /* ... */ }
}
```

**Better:**

```typescript
// Option 1: Move rendering and validation into the document itself
abstract class Document {
  abstract getContent(): string
  abstract render(): void
  abstract validate(): ValidationResult
}

class PdfDocument extends Document {
  getContent(): string { return 'PDF content' }
  
  render(): void {
    // PDF-specific rendering
  }
  
  validate(): ValidationResult {
    // PDF-specific validation
  }
}

class WordDocument extends Document {
  getContent(): string { return 'Word content' }
  
  render(): void {
    // Word-specific rendering
  }
  
  validate(): ValidationResult {
    // Word-specific validation
  }
}

// Option 2: Use composition with strategy pattern
interface RenderStrategy {
  render(content: string): void
}

interface ValidateStrategy {
  validate(content: string): ValidationResult
}

class Document {
  constructor(
    private content: string,
    private renderer: RenderStrategy,
    private validator: ValidateStrategy
  ) {}
  
  render(): void {
    this.renderer.render(this.content)
  }
  
  validate(): ValidationResult {
    return this.validator.validate(this.content)
  }
}

// Reusable strategies - no parallel hierarchies needed
const pdfRenderer: RenderStrategy = { render: (c) => { /* PDF logic */ } }
const pdfValidator: ValidateStrategy = { validate: (c) => { /* PDF logic */ } }

const pdfDoc = new Document(content, pdfRenderer, pdfValidator)
```

### Checklist

- [ ] Adding a subclass always requires adding subclasses to other hierarchies
- [ ] Class names have matching prefixes across different hierarchies (PdfDocument, PdfRenderer, PdfValidator)
- [ ] One hierarchy exists solely to handle behavior for another hierarchy
- [ ] Deleting a class requires deleting corresponding classes elsewhere
- [ ] Inheritance is used where composition would be more flexible
