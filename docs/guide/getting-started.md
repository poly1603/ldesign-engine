# Getting Started

## Installation

```bash
# For Vue 3
pnpm add @ldesign/engine-vue3

# For core only (framework-agnostic)
pnpm add @ldesign/engine-core
```

## Quick Start

### Vue 3

```typescript
import { createVueEngine, definePlugin } from '@ldesign/engine-vue3'
import App from './App.vue'

// Define a plugin
const myPlugin = definePlugin({
  name: 'my-plugin',
  version: '1.0.0',
  install(context) {
    context.engine.state.set('count', 0)
    context.engine.events.on('count:increment', () => {
      const count = context.engine.state.get<number>('count') ?? 0
      context.engine.state.set('count', count + 1)
    })
  }
})

// Create and mount the engine
const engine = createVueEngine({
  name: 'My App',
  debug: true,
  app: {
    rootComponent: App
  },
  plugins: [myPlugin]
})

await engine.mount('#app')
```

### Framework Agnostic (Core)

```typescript
import { createCoreEngine, definePlugin } from '@ldesign/engine-core'

const engine = createCoreEngine({
  name: 'My App',
  debug: true
})

// Initialize
await engine.init()

// Use plugins
await engine.use(myPlugin)

// Work with state
engine.state.set('user', { name: 'Alice' })

// Listen to events
engine.events.on('user:login', (user) => {
  console.log('User logged in:', user)
})

// Destroy when done
await engine.destroy()
```

## Core Concepts

### Plugins

Plugins are the primary way to extend the engine. Each plugin has:
- A unique name
- An optional version
- An install function
- An optional uninstall function for cleanup

```typescript
const plugin = definePlugin({
  name: 'logger',
  version: '1.0.0',
  dependencies: [], // Other plugins this depends on
  install(context) {
    // Setup logic
  },
  uninstall(context) {
    // Cleanup logic
  }
})
```

### State Management

The state manager provides reactive state storage:

```typescript
// Set state
engine.state.set('count', 0)

// Get state
const count = engine.state.get<number>('count')

// Watch changes
const unwatch = engine.state.watch('count', (newValue, oldValue) => {
  console.log(`Count changed: ${oldValue} -> ${newValue}`)
})

// Batch updates for performance
engine.state.batch(() => {
  engine.state.set('a', 1)
  engine.state.set('b', 2)
  engine.state.set('c', 3)
})
```

### Events

The event system supports publish-subscribe pattern with wildcards:

```typescript
// Listen to specific event
engine.events.on('user:login', (user) => { ... })

// Listen to all user events
engine.events.on('user:*', (data) => { ... })

// Listen once
engine.events.once('app:ready', () => { ... })

// Emit events
engine.events.emit('user:login', { id: 1, name: 'Alice' })
```

### Middleware

Middleware provides an onion-model execution chain:

```typescript
engine.middleware.use('request', async (ctx, next) => {
  console.log('Before request')
  await next()
  console.log('After request')
})
```

### Lifecycle

Lifecycle hooks allow you to tap into engine lifecycle events:

```typescript
engine.lifecycle.on('beforeInit', () => { ... })
engine.lifecycle.on('init', () => { ... })
engine.lifecycle.on('afterInit', () => { ... })
engine.lifecycle.on('beforeDestroy', () => { ... })
engine.lifecycle.on('destroyed', () => { ... })
```

## Next Steps

- [Plugin Development Guide](./plugin-development.md)
- [State Management Guide](./state-management.md)
- [Event System Guide](./event-system.md)
- [API Reference](../api/README.md)
