# TypeScript Type Design

## 1. Extensibility

**Bad:**
```typescript
// Hard to extend
interface ApiResponse {
  data: {
    users: User[]
    posts: Post[]
  }
  meta: { total: number }
}

// New endpoint = new type
interface UserResponse { /* ... */ }
interface PostResponse { /* ... */ }
```

**Better:**
```typescript
// Extensible with generics
interface ApiResponse<T> {
  data: T
  meta: ResponseMeta
}

type ListResponse<T> = ApiResponse<{ items: T[]; total: number }>
type SingleResponse<T> = ApiResponse<T>

// Easy to add endpoints
type UserListResponse = ListResponse<User>
type PostResponse = SingleResponse<Post>
```

**Check:**
- [ ] Generics used for reusability?
- [ ] New scenarios require modifying existing types?
- [ ] Union types used for mutually exclusive cases?
- [ ] New variants added without breaking code?
- [ ] Discriminated unions for polymorphic data?

---

## 2. Cognitive Complexity

**Bad:**
```typescript
// Too complex
type DeepPartial<T> = T extends object
  ? { [P in keyof T]?: DeepPartial<T[P]> }
  : T

type ComplexUtility<T> = {
  [K in keyof T as K extends `get${infer R}`
    ? `set${R}`
    : never]: T[K] extends () => infer R
      ? (value: R) => void
      : never
}
```

**Better:**
```typescript
// Simple and clear
type UserUpdate = Partial<User>
type UserCreation = Omit<User, 'id' | 'createdAt'>

// If complex, document well
/**
 * Extracts function properties
 * Example: ExtractFunctions<{ foo: () => void, bar: string }> = { foo: () => void }
 */
type ExtractFunctions<T> = Pick<T, {
  [K in keyof T]: T[K] extends Function ? K : never
}[keyof T]>
```

**Check:**
- [ ] Types need >3 nesting levels to understand?
- [ ] Advanced features used for "showing off"?
- [ ] New members understand core types in 5 min?
- [ ] Complex utilities documented?
- [ ] Simpler types achieve same goal?
- [ ] Type errors understandable?

---

## 3. Type-Runtime Disconnect

**Bad:**
```typescript
// Types lie
interface Config {
  apiUrl: string  // Says required
  apiKey: string
}

// Runtime might return partial
const config: Config = loadConfig() // Actually {}

// No validation
fetch('/api/user')
  .then(res => res.json())
  .then((data: UserResponse) => {
    // Type assertion without validation!
  })
```

**Better:**
```typescript
// Runtime validation with schema
import { z } from 'zod'

const ConfigSchema = z.object({
  apiUrl: z.string().url(),
  apiKey: z.string().optional(),
  timeout: z.number().default(5000),
})

type Config = z.infer<typeof ConfigSchema>
const config = ConfigSchema.parse(loadConfig()) // Validated!

// Validate API responses
const UserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
})

type UserResponse = z.infer<typeof UserSchema>

fetch('/api/user')
  .then(res => res.json())
  .then(data => {
    const user = UserSchema.parse(data) // Safe!
    return user
  })
```

**Check:**
- [ ] API types generated from specs (openapi-typescript)?
- [ ] Runtime validation synced with types (zod)?
- [ ] Optional fields match reality?
- [ ] Type assertions without validation?
- [ ] Types account for null/undefined?
- [ ] Mechanism to catch type-runtime mismatches?

---

## 4. Type Testing

**Good practices:**
```typescript
// Test complex utility types
type TestUser = User
const validUser: TestUser = {
  id: '123',
  role: 'admin',
  createdAt: 123456
}

// Test invalid types are rejected
// @ts-expect-error - invalid role
const invalidUser: TestUser = {
  id: '123',
  role: 'invalid',
  createdAt: 123456
}

// Test type inference
const inferred = createUser({ name: 'Alice' })
type InferredType = typeof inferred
// Assert InferredType is what you expect
```

**Check:**
- [ ] Complex types have tests?
- [ ] Invalid types tested with @ts-expect-error?
- [ ] Type inference works as expected?
