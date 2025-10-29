# @ldesign/engine-core

Framework-agnostic core engine for building modern applications with plugin system, middleware, lifecycle management, and more.

## Features

- 🔌 **Plugin System** - Powerful plugin architecture with dependency management
- 🔄 **Middleware System** - Flexible middleware pipeline for request/response handling
- ⏱️ **Lifecycle Management** - Complete lifecycle hooks for fine-grained control
- 📡 **Event System** - Robust event system with priority and namespaces
- 💾 **State Management** - Framework-agnostic state management foundation
- 🗄️ **Cache Management** - Intelligent caching with multiple strategies
- 📊 **Performance Monitoring** - Built-in performance tracking and optimization
- 🛡️ **Error Handling** - Comprehensive error management and recovery
- 🔒 **Security** - Built-in security features and best practices
- 📝 **Logger** - Flexible logging system with multiple levels
- ⚙️ **Configuration** - Type-safe configuration management
- 💉 **Dependency Injection** - IoC container for better code organization

## Installation

```bash
pnpm add @ldesign/engine-core
```

## Basic Usage

```typescript
import { createCoreEngine } from '@ldesign/engine-core'

// Create engine instance
const engine = createCoreEngine({
  config: {
    debug: true,
    name: 'My App'
  }
})

// Register plugins
await engine.use({
  name: 'my-plugin',
  install: (context) => {
    console.log('Plugin installed!', context)
  }
})

// Initialize engine
await engine.init()

// Use lifecycle hooks
engine.lifecycle.on('afterInit', () => {
  console.log('Engine initialized!')
})

// Emit events
engine.events.emit('app:ready', { timestamp: Date.now() })

// Manage state
engine.state.set('user', { name: 'John', role: 'admin' })
const user = engine.state.get('user')

// Cache data
engine.cache.set('config', configData, 3600000) // 1 hour TTL
const cachedConfig = engine.cache.get('config')
```

## Framework Adapters

This core package is framework-agnostic. Use framework-specific adapters:

- **Vue 3**: `@ldesign/engine-vue3`
- **React**: `@ldesign/engine-react`

## Documentation

For detailed documentation, visit [our documentation site](https://ldesign.github.io/engine/).

## License

MIT © ldesign

