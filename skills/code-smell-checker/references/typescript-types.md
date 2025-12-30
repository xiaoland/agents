# TypeScript Type Design - Maintainability Code Smells

This reference document provides detailed checklists for identifying maintainability issues in TypeScript type design.

---

## 1. Type Organization & Responsibility Division

### Code Smell: Type Definitions Scattered Everywhere, Lacking Unified Management

**Bad Example:**

```typescript
// ❌ Defining business types in component files
// UserProfile.vue
interface User { id: string; name: string }
interface Post { userId: string; title: string }

// UserList.vue
interface User { id: string; name: string } // Duplicate definition
```

**Better Approach:**

- Establish clear type file structure (e.g., `types/models/`, `types/api/`, `types/utils/`)
- Distinguish domain model types, API contract types, and UI state types
- Centralize shared types in a single source of truth

**Checklist:**

- [ ] Are types for the same business concept defined in multiple places?
- [ ] Are types organized by domain/layer rather than by file location?
- [ ] Can you understand the system's architectural boundaries from the type file structure?
- [ ] Is there a clear convention for where to place new types?
- [ ] Are import paths for types predictable and consistent?

---

## 2. Type Semantic Expressiveness

### Code Smell: Using Primitive Types Instead of Semantic Types

**Bad Example:**

```typescript
// ❌ Weak semantics
interface Article {
  id: string;        // What kind of ID?
  status: string;    // What are the possible values?
  createdAt: number; // Timestamp or something else?
}

// ❌ No validation or type safety
function getArticle(id: string): Article { /* ... */ }
function getUser(id: string): User { /* ... */ }
// Can accidentally pass userId to getArticle
```

**Better Approach:**

```typescript
// ✅ Strong semantics
type ArticleId = string & { readonly __brand: 'ArticleId' };
type UserId = string & { readonly __brand: 'UserId' };
type ArticleStatus = 'draft' | 'published' | 'archived';
type Timestamp = number & { readonly __brand: 'Timestamp' };

interface Article {
  id: ArticleId;
  status: ArticleStatus;
  createdAt: Timestamp;
}

// Type-safe - can't mix up different IDs
function getArticle(id: ArticleId): Article { /* ... */ }
function getUser(id: UserId): User { /* ... */ }
```

**Checklist:**

- [ ] Are you over-relying on `string`/`number` instead of literal union types?
- [ ] Do business-critical concepts have explicit type aliases?
- [ ] Do type names clearly express their meaning and constraints?
- [ ] Are branded types used to prevent mixing incompatible primitive values?
- [ ] Are magic strings replaced with string literal unions?
- [ ] Do enum-like values use `const` assertions or proper enums?

---

## 3. Type Dependencies & Coupling

### Code Smell: Strong Coupling Between Type Definitions

**Bad Example:**

```typescript
// ❌ Tight coupling
interface UserViewModel {
  user: User;
  posts: Post[];
  comments: Comment[];
  followers: Follower[];
  settings: Settings[];
  // ViewModel directly depends on all entity types
}

// ❌ Circular dependencies
interface User {
  posts: Post[];
}
interface Post {
  author: User; // Circular!
}
```

**Better Approach:**

```typescript
// ✅ Loose coupling
interface UserViewModel {
  userId: UserId;
  displayName: string;
  postCount: number;
  commentCount: number;
  // Depends only on necessary data, not complete entities
}

// ✅ Break circular dependencies with IDs
interface User {
  id: UserId;
  postIds: PostId[];
}
interface Post {
  id: PostId;
  authorId: UserId;
}
```

**Checklist:**

- [ ] Are there circular type dependencies?
- [ ] Does modifying one type cascade changes to many other types?
- [ ] Are there "god types" (containing too many fields/responsibilities)?
- [ ] Can types be modified independently without breaking others?
- [ ] Are cross-domain dependencies minimized?
- [ ] Do types depend on interfaces rather than concrete implementations?

---

## 4. Type Extensibility Design

### Code Smell: Hardcoded Type Structures, Difficult to Extend

**Bad Example:**

```typescript
// ❌ Hard to extend
interface ApiResponse {
  data: {
    users: User[];
    posts: Post[];
  };
  meta: { total: number };
}

// ❌ Need to modify type for each new endpoint
interface UserResponse { /* ... */ }
interface PostResponse { /* ... */ }
interface CommentResponse { /* ... */ }
```

**Better Approach:**

```typescript
// ✅ Extensible with generics
interface ApiResponse<T> {
  data: T;
  meta: ResponseMeta;
}

interface ResponseMeta {
  total?: number;
  page?: number;
  perPage?: number;
}

type ListResponse<T> = ApiResponse<{ items: T[]; total: number }>;
type SingleResponse<T> = ApiResponse<T>;

// Easy to add new endpoints
type UserListResponse = ListResponse<User>;
type PostResponse = SingleResponse<Post>;
```

**Checklist:**

- [ ] Are generics used appropriately to improve reusability?
- [ ] Do new business scenarios require modifying existing type definitions?
- [ ] Are union types used instead of optional fields for mutually exclusive cases?
- [ ] Can new variants be added without breaking existing code?
- [ ] Are discriminated unions used for polymorphic data?
- [ ] Do types support the Open/Closed Principle?

---

## 5. Type Cognitive Complexity

### Code Smell: Overly Complex Type Gymnastics

**Bad Example:**

```typescript
// ❌ Hard to understand
type DeepPartial<T> = T extends object
  ? { [P in keyof T]?: DeepPartial<T[P]> }
  : T;

type ExtractFunctions<T> = {
  [K in keyof T as T[K] extends Function ? K : never]: T[K]
};

type ComplexUtility<T> = {
  [K in keyof T as K extends `get${infer R}`
    ? `set${R}`
    : never]: T[K] extends () => infer R
      ? (value: R) => void
      : never
};

// Using complex utility types extensively in business code
```

**Better Approach:**

```typescript
// ✅ Simple and clear
type UserUpdate = Partial<User>;
type UserCreation = Omit<User, 'id' | 'createdAt'>;

// If you need complex types, document them well
/**
 * Extracts function properties from type T
 * Example: ExtractFunctions<{ foo: () => void, bar: string }> = { foo: () => void }
 */
type ExtractFunctions<T> = Pick<T, {
  [K in keyof T]: T[K] extends Function ? K : never
}[keyof T]>;
```

**Checklist:**

- [ ] Do type definitions require more than 3 levels of nesting to understand?
- [ ] Are advanced type features used for "showing off" rather than solving problems?
- [ ] Can new team members understand core type definitions within 5 minutes?
- [ ] Are complex utility types documented with examples?
- [ ] Could simpler types achieve the same goal?
- [ ] Are type errors understandable when they occur?

---

## 6. Type-Runtime Disconnect

### Code Smell: Type Definitions Don't Match Actual Data Structures

**Bad Example:**

```typescript
// ❌ Types lie
interface Config {
  apiUrl: string;  // Type says required
  apiKey: string;  // Type says required
}

// But runtime might return partial data
const config: Config = loadConfig(); // Actually returns {} or partial object

// ❌ No runtime validation
interface UserResponse {
  id: string;
  name: string;
  email: string;
}

fetch('/api/user')
  .then(res => res.json())
  .then((data: UserResponse) => {
    // Type assertion without validation - data might not match type!
  })
```

**Better Approach:**

```typescript
// ✅ Use runtime validation with schema libraries
import { z } from 'zod';

const ConfigSchema = z.object({
  apiUrl: z.string().url(),
  apiKey: z.string().optional(),
  timeout: z.number().default(5000),
});

type Config = z.infer<typeof ConfigSchema>;

const config = ConfigSchema.parse(loadConfig()); // Validated at runtime

// ✅ Generate types from API spec
// Use tools like openapi-typescript to generate types from OpenAPI specs
// This ensures types match actual API responses

// ✅ Validate API responses
const UserResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
});

type UserResponse = z.infer<typeof UserResponseSchema>;

fetch('/api/user')
  .then(res => res.json())
  .then(data => {
    const user = UserResponseSchema.parse(data); // Runtime validation
    return user;
  })
```

**Checklist:**

- [ ] Are API response types generated from actual API specs (e.g., using openapi-typescript)?
- [ ] Is there runtime validation synchronized with type definitions (e.g., using zod, io-ts)?
- [ ] Do optional fields accurately reflect business reality?
- [ ] Are there type assertions without runtime validation?
- [ ] Do types account for possible null/undefined values in practice?
- [ ] Is there a mechanism to catch type-runtime mismatches early?

---

## Additional Best Practices

### Type Documentation

**Good practices:**
- Use JSDoc comments for complex types
- Document business rules and constraints
- Provide usage examples for generic types
- Explain why specific design choices were made

```typescript
/**
 * Represents a user in the system
 * @property id - Unique identifier, format: UUID v4
 * @property role - User role, determines permissions
 * @property createdAt - Unix timestamp in milliseconds
 */
interface User {
  id: UserId;
  role: UserRole;
  createdAt: Timestamp;
}
```

### Type Naming Conventions

**Good practices:**
- Use `PascalCase` for types and interfaces
- Suffix types with their purpose: `UserViewModel`, `UserDTO`, `UserEntity`
- Use descriptive names: `ArticleStatus` not `Status`
- Avoid generic names like `Data`, `Info`, `Item`

### Type Testing

**Good practices:**
- Write type tests for complex utility types
- Use `@ts-expect-error` to test that invalid types are rejected
- Test type inference works as expected

```typescript
// Type tests
type TestUser = User;
const validUser: TestUser = { id: '123', role: 'admin', createdAt: 123456 };

// @ts-expect-error - should reject invalid role
const invalidUser: TestUser = { id: '123', role: 'invalid', createdAt: 123456 };
```

---

**Document Version**: v1.0
**Last Updated**: 2024-12
