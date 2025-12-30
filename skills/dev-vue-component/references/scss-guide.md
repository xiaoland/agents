# `compName.scss` Guide

## Purpose

Define component-specific styles using design tokens and modern CSS features. Use SCSS only for complex component styles; prefer UnoCSS for simple layout and utilities.

## When to Use

- Use **UnoCSS** for: layout, spacing, simple colors, typography
- Use **SCSS** for: complex component-specific styles, state variations, animations

## Template

See [assets/compName.scss](../assets/compName.scss) for the starter template.

## Design Token System

### Simple Tokens with `sys-var()`

Access design tokens using the `sys-var()` function (auto-injected, no import needed).

**Token path format**: `sys-var(category, subcategory, variant)`

### Composite Tokens with Mixins

Use these mixins for composite design tokens:

#### Typography

```scss
.comp-name__title {
  @include apply-font(heading-large);
}

.comp-name__body {
  @include apply-font(body-medium);
}
```

Available font sizes: `display-large`, `heading-large`, `heading-medium`, `heading-small`, `body-large`, `body-medium`, `body-small`, `label-large`, `label-medium`, `label-small`

#### Icons

```scss
.comp-name__icon {
  @include apply-icon(md);
  // or with centering
  @include apply-icon(lg, true);
}
```

Available icon sizes: `xs`, `sm`, `md`, `lg`, `xl`

#### Elevation (Shadows)

```scss
.comp-name {
  @include apply-elevation(1);
}

.comp-name:hover {
  @include apply-elevation(2);
}
```

Elevation levels: `0` through `5`

### ⚠️ Never Use Reference Tokens Directly

Reference tokens are internal. Always use system tokens via `sys-var()` or mixins.

See full token list at `/tokens/tokens.md`

## BEM Naming Convention

Use BEM (Block Element Modifier) with SCSS nesting. See [assets/compName.scss](../assets/compName.scss) for an example.

### Nesting Guidelines

- Maximum 3 levels of nesting
- If deeper nesting needed, start a new block
- Use `&` for modifiers and pseudo-classes/elements

```scss
// ✅ Good
.card {
  &__content {
    &-title {
      font-weight: bold;
    }
  }
}

// ❌ Avoid - too deep, start new block
.card {
  &__content {
    &__wrapper {
      &__item {
        &__text { }
      }
    }
  }
}
```

## Modern CSS Features

### Parent Selector (`:has()`)

```scss
.card {
  background: sys-var(color, surface, base);
  
  // When card contains a checked input
  &:has(input:checked) {
    background: sys-var(color, primary, surface);
  }
  
  // When card has a disabled button
  &:has(button:disabled) {
    opacity: 0.6;
  }
}
```

### Entry/Exit Animations

```scss
.dialog {
  opacity: 1;
  scale: 1;
  transition: opacity 0.3s, scale 0.3s;
  transition-behavior: allow-discrete;
  
  @starting-style {
    opacity: 0;
    scale: 0.9;
  }
  
  &--hidden {
    opacity: 0;
    scale: 0.9;
  }
}
```

### Container Queries

```scss
.component {
  container-type: inline-size;
  
  &__item {
    display: block;
    
    @container (min-width: 400px) {
      display: flex;
    }
  }
}
```

## Using Icons

### UnoCSS Icons

Add icon classes directly in template: `i-mdi-<icon-name>`

```vue
<template>
  <span class="i-mdi-account text-xl" />
  <span class="i-mdi-check-circle text-2xl text-green" />
</template>
```

**Important**: When adding new icons, update the UnoCSS safelist in `uno.config.ts` and document in `README.md`

### Styling Icons in SCSS

```scss
.comp-name__icon {
  @include apply-icon(md);
  color: sys-var(color, text, secondary);
  
  &--large {
    @include apply-icon(lg, true); // centered
  }
}
```

## Common Patterns

### State Variations

```scss
.button {
  background: sys-var(color, primary, base);
  
  &:hover:not(&--disabled) {
    background: sys-var(color, primary, hover);
  }
  
  &:active:not(&--disabled) {
    background: sys-var(color, primary, pressed);
  }
  
  &--disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  &--loading {
    pointer-events: none;
    opacity: 0.8;
  }
}
```

### Responsive Design

```scss
.comp-name {
  display: block;
  
  @media (min-width: 768px) {
    display: flex;
  }
  
  &__item {
    width: 100%;
    
    @media (min-width: 768px) {
      width: 50%;
    }
  }
}
```

### Transitions

```scss
.comp-name {
  transition: all 0.2s ease;
  
  &--fast {
    transition-duration: 0.1s;
  }
  
  &--slow {
    transition-duration: 0.4s;
  }
}
```

### Focus States

```scss
.interactive {
  outline: 2px solid transparent;
  outline-offset: 2px;
  
  &:focus-visible {
    outline-color: sys-var(color, primary, base);
  }
}
```

## Best Practices

- ✅ Use design tokens for all values (no magic numbers)
- ✅ Use UnoCSS for simple styles
- ✅ Follow BEM naming consistently
- ✅ Leverage modern CSS features
- ✅ Keep selectors shallow (max 3 levels)
- ✅ Use meaningful modifier names
- ❌ Don't use reference tokens directly
- ❌ Don't hardcode colors, spacing, or sizes
- ❌ Don't nest too deeply
- ❌ Don't repeat styles (extract to tokens if needed)
