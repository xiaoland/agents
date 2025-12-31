# TypeScript Type Organization

## 1. Scattered Type Definitions

**Bad:**
```typescript
// UserProfile.vue
interface User { id: string; name: string }
interface Post { userId: string; title: string }

// UserList.vue
interface User { id: string; name: string } // Duplicate!
```

**Better:**
```typescript
// types/models/user.ts
export interface User { id: string; name: string }
// types/models/post.ts
export interface Post { userId: string; title: string }
```

**Structure:**
- `types/models/` - Domain models
- `types/api/` - API contracts
- `types/ui/` - UI state

**Check:**
- [ ] Same concept defined in multiple places?
- [ ] Types organized by domain/layer not file location?
- [ ] Architecture boundaries clear from structure?
- [ ] Clear convention for new types?

---

## 2. Weak Semantic Types

**Bad:**
```typescript
interface Article {
  id: string;        // What kind of ID?
  status: string;    // What values?
  createdAt: number; // Timestamp?
}

function getArticle(id: string): Article
function getUser(id: string): User
// Can mix up IDs!
```

**Better:**
```typescript
type ArticleId = string & { readonly __brand: 'ArticleId' }
type UserId = string & { readonly __brand: 'UserId' }
type ArticleStatus = 'draft' | 'published' | 'archived'
type Timestamp = number & { readonly __brand: 'Timestamp' }

interface Article {
  id: ArticleId
  status: ArticleStatus
  createdAt: Timestamp
}

function getArticle(id: ArticleId): Article
function getUser(id: UserId): User
// Type-safe!
```

**Check:**
- [ ] Over-using `string`/`number` instead of literal unions?
- [ ] Key concepts have explicit type aliases?
- [ ] Type names express meaning and constraints?
- [ ] Branded types prevent mixing incompatible values?
- [ ] Magic strings replaced with unions?

---

## 3. Type Coupling

**Bad:**
```typescript
// Tight coupling
interface UserViewModel {
  user: User
  posts: Post[]
  comments: Comment[]
  followers: Follower[]
  // Depends on all entities
}

// Circular dependencies
interface User {
  posts: Post[]
}
interface Post {
  author: User // Circular!
}
```

**Better:**
```typescript
// Loose coupling
interface UserViewModel {
  userId: UserId
  displayName: string
  postCount: number
  // Only necessary data
}

// Break circles with IDs
interface User {
  id: UserId
  postIds: PostId[]
}
interface Post {
  id: PostId
  authorId: UserId
}
```

**Check:**
- [ ] Circular type dependencies?
- [ ] One type change cascades to many others?
- [ ] "God types" with too many fields?
- [ ] Types modifiable independently?
- [ ] Cross-domain dependencies minimized?

---

## 4. Documentation

**Good practices:**
```typescript
/**
 * User in the system
 * @property id - UUID v4 format
 * @property role - Determines permissions
 * @property createdAt - Unix timestamp (ms)
 */
interface User {
  id: UserId
  role: UserRole
  createdAt: Timestamp
}
```

**Check:**
- [ ] Complex types documented?
- [ ] Business rules explained?
- [ ] Usage examples for generics?
- [ ] Design choices documented?

---

## 5. Naming Conventions

**Rules:**
- `PascalCase` for types/interfaces
- Suffix with purpose: `UserViewModel`, `UserDTO`, `UserEntity`
- Descriptive: `ArticleStatus` not `Status`
- Avoid generic: `Data`, `Info`, `Item`

**Examples:**
```typescript
// ✅ Good
type ArticleStatus = 'draft' | 'published'
interface UserViewModel { }
interface CreateUserDTO { }

// ❌ Bad
type Status = string
interface Data { }
interface Info { }
```
