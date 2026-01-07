# Object-Orientation Abusers

Cases where the solution is a partial or incorrect application of OO programming principles. The goal is to **Use Polymorphism** and proper design patterns.

---

## Switch Statements

Complex switch operators or sequences of if statements that check the same type/condition. Often duplicated across multiple places in the codebase.

### Refactoring: Replace Conditional with Polymorphism

**Bad:**

```typescript
interface Notification {
  type: 'email' | 'sms' | 'push' | 'slack'
  recipient: string
  message: string
}

function sendNotification(notification: Notification) {
  switch (notification.type) {
    case 'email':
      validateEmail(notification.recipient)
      connectToSmtp()
      sendEmail(notification.recipient, notification.message)
      logEmailSent(notification.recipient)
      break
    case 'sms':
      validatePhone(notification.recipient)
      connectToTwilio()
      sendSms(notification.recipient, notification.message)
      logSmsSent(notification.recipient)
      break
    case 'push':
      validateDeviceToken(notification.recipient)
      connectToFirebase()
      sendPush(notification.recipient, notification.message)
      logPushSent(notification.recipient)
      break
    case 'slack':
      validateSlackChannel(notification.recipient)
      connectToSlack()
      sendSlackMessage(notification.recipient, notification.message)
      logSlackSent(notification.recipient)
      break
  }
}

// Same switch appears in other functions
function getDeliveryStatus(notification: Notification) {
  switch (notification.type) {
    case 'email': return checkEmailStatus(notification.recipient)
    case 'sms': return checkSmsStatus(notification.recipient)
    case 'push': return checkPushStatus(notification.recipient)
    case 'slack': return checkSlackStatus(notification.recipient)
  }
}
```

**Better:**

```typescript
interface NotificationChannel {
  validate(recipient: string): void
  connect(): void
  send(recipient: string, message: string): void
  getStatus(recipient: string): DeliveryStatus
}

class EmailChannel implements NotificationChannel {
  validate(recipient: string) { validateEmail(recipient) }
  connect() { connectToSmtp() }
  send(recipient: string, message: string) {
    sendEmail(recipient, message)
    logEmailSent(recipient)
  }
  getStatus(recipient: string) { return checkEmailStatus(recipient) }
}

class SmsChannel implements NotificationChannel {
  validate(recipient: string) { validatePhone(recipient) }
  connect() { connectToTwilio() }
  send(recipient: string, message: string) {
    sendSms(recipient, message)
    logSmsSent(recipient)
  }
  getStatus(recipient: string) { return checkSmsStatus(recipient) }
}

class NotificationService {
  private channels: Map<string, NotificationChannel> = new Map([
    ['email', new EmailChannel()],
    ['sms', new SmsChannel()],
    ['push', new PushChannel()],
    ['slack', new SlackChannel()],
  ])

  send(type: string, recipient: string, message: string) {
    const channel = this.channels.get(type)
    if (!channel) throw new Error(`Unknown channel: ${type}`)
    channel.validate(recipient)
    channel.connect()
    channel.send(recipient, message)
  }
}
```

### Checklist

- [ ] Switch/if-else chain checks the same type or discriminator value
- [ ] Same switch appears in multiple places in the codebase
- [ ] Adding a new type requires modifying multiple switch statements
- [ ] Switch cases have similar structure but different implementations
- [ ] Type field is used to determine behavior rather than polymorphism

---

## Temporary Field

Fields that get values only under certain circumstances and are empty or null the rest of the time. Often created to pass data between methods instead of using parameters.

### Refactoring: Extract Class, Introduce Null Object

**Bad:**

```typescript
class ReportGenerator {
  // These fields are only set during generateComplexReport()
  private tempData: ReportData | null = null
  private tempFilters: FilterConfig | null = null
  private tempAggregations: AggregationResult | null = null
  
  generateComplexReport(data: ReportData, filters: FilterConfig) {
    // Store temporarily to pass between private methods
    this.tempData = data
    this.tempFilters = filters
    
    this.applyFilters()
    this.calculateAggregations()
    const result = this.formatOutput()
    
    // Clean up
    this.tempData = null
    this.tempFilters = null
    this.tempAggregations = null
    
    return result
  }
  
  private applyFilters() {
    // Uses this.tempData and this.tempFilters
    this.tempData = filterData(this.tempData!, this.tempFilters!)
  }
  
  private calculateAggregations() {
    // Uses this.tempData, sets this.tempAggregations
    this.tempAggregations = aggregate(this.tempData!)
  }
  
  private formatOutput() {
    // Uses all temp fields
    return format(this.tempData!, this.tempAggregations!)
  }
}
```

**Better:**

```typescript
class ReportGenerator {
  generateComplexReport(data: ReportData, filters: FilterConfig): FormattedReport {
    const context = new ReportContext(data, filters)
    return context.generate()
  }
}

// Extract to a dedicated class that holds the state
class ReportContext {
  private filteredData: ReportData
  private aggregations: AggregationResult | null = null
  
  constructor(
    private data: ReportData,
    private filters: FilterConfig
  ) {
    this.filteredData = this.data
  }
  
  generate(): FormattedReport {
    this.applyFilters()
    this.calculateAggregations()
    return this.formatOutput()
  }
  
  private applyFilters() {
    this.filteredData = filterData(this.data, this.filters)
  }
  
  private calculateAggregations() {
    this.aggregations = aggregate(this.filteredData)
  }
  
  private formatOutput(): FormattedReport {
    return format(this.filteredData, this.aggregations!)
  }
}
```

### Checklist

- [ ] Fields are null or undefined most of the time
- [ ] Fields are only set before calling certain methods
- [ ] Fields are cleaned up / reset after method execution
- [ ] Methods rely on fields that may or may not be initialized
- [ ] Null checks are scattered throughout the class for these fields

---

## Refused Bequest

A subclass uses only a few of the methods and properties inherited from its parents. The unwanted methods may go unused or be overridden to throw exceptions.

### Refactoring: Replace Inheritance with Delegation

**Bad:**

```typescript
class Animal {
  name: string
  age: number
  
  constructor(name: string, age: number) {
    this.name = name
    this.age = age
  }
  
  walk() { console.log(`${this.name} is walking`) }
  run() { console.log(`${this.name} is running`) }
  swim() { console.log(`${this.name} is swimming`) }
  fly() { console.log(`${this.name} is flying`) }
  makeSound() { console.log(`${this.name} makes a sound`) }
}

// Dog inherits fly() and swim() but shouldn't use them
class Dog extends Animal {
  bark() { console.log('Woof!') }
  
  // Override to prevent misuse - code smell!
  fly() { throw new Error('Dogs cannot fly') }
  swim() { /* Some dogs can swim, but not all */ }
}

// Fish inherits walk(), run(), fly() but can't use any
class Fish extends Animal {
  walk() { throw new Error('Fish cannot walk') }
  run() { throw new Error('Fish cannot run') }
  fly() { throw new Error('Fish cannot fly') }
}
```

**Better:**

```typescript
// Define focused interfaces
interface Walkable {
  walk(): void
  run(): void
}

interface Swimmable {
  swim(): void
}

interface Flyable {
  fly(): void
}

// Base class with only common properties
class Animal {
  constructor(
    public name: string,
    public age: number
  ) {}
  
  makeSound() { console.log(`${this.name} makes a sound`) }
}

// Compose behaviors using interfaces
class Dog extends Animal implements Walkable {
  walk() { console.log(`${this.name} is walking`) }
  run() { console.log(`${this.name} is running`) }
  bark() { console.log('Woof!') }
}

class Fish extends Animal implements Swimmable {
  swim() { console.log(`${this.name} is swimming`) }
}

class Bird extends Animal implements Walkable, Flyable {
  walk() { console.log(`${this.name} is walking`) }
  run() { console.log(`${this.name} is running`) }
  fly() { console.log(`${this.name} is flying`) }
}
```

### Checklist

- [ ] Subclass overrides parent methods to throw exceptions or do nothing
- [ ] Subclass only uses a small fraction of inherited methods
- [ ] Subclass inherits methods that don't make sense for its type
- [ ] Parent class is too generic, trying to cover all possible cases
- [ ] "is-a" relationship doesn't truly hold between parent and child

---

## Alternative Classes with Different Interfaces

Two or more classes perform identical or very similar functions but have different method names, making them non-interchangeable.

### Refactoring: Rename Method, Extract Superclass

**Bad:**

```typescript
// Two notification services that do the same thing differently
class EmailNotifier {
  sendEmail(to: string, subject: string, body: string) {
    // Send email logic
  }
  
  checkEmailStatus(messageId: string): boolean {
    // Check if email was delivered
    return true
  }
}

class SlackNotifier {
  postMessage(channel: string, title: string, content: string) {
    // Send Slack message logic
  }
  
  isMessageDelivered(id: string): boolean {
    // Check if Slack message was delivered
    return true
  }
}

// Usage requires knowing each class's specific interface
function notifyUser(useSlack: boolean, recipient: string, title: string, message: string) {
  if (useSlack) {
    const slack = new SlackNotifier()
    slack.postMessage(recipient, title, message)
  } else {
    const email = new EmailNotifier()
    email.sendEmail(recipient, title, message)
  }
}
```

**Better:**

```typescript
// Common interface for all notifiers
interface Notifier {
  send(recipient: string, subject: string, body: string): void
  checkStatus(messageId: string): boolean
}

class EmailNotifier implements Notifier {
  send(recipient: string, subject: string, body: string) {
    // Send email logic
  }
  
  checkStatus(messageId: string): boolean {
    // Check if email was delivered
    return true
  }
}

class SlackNotifier implements Notifier {
  send(recipient: string, subject: string, body: string) {
    // Send Slack message logic
  }
  
  checkStatus(messageId: string): boolean {
    // Check if Slack message was delivered
    return true
  }
}

// Usage is now polymorphic
function notifyUser(notifier: Notifier, recipient: string, title: string, message: string) {
  notifier.send(recipient, title, message)
}

// Can easily add new notifiers
class SmsNotifier implements Notifier {
  send(recipient: string, subject: string, body: string) {
    // Send SMS logic
  }
  
  checkStatus(messageId: string): boolean {
    return true
  }
}
```

### Checklist

- [ ] Multiple classes have methods that do the same thing with different names
- [ ] Cannot swap one class for another without changing calling code
- [ ] Similar classes evolved independently without coordination
- [ ] Code has conditionals to handle different class interfaces
- [ ] Adding a new similar class requires learning its unique interface
