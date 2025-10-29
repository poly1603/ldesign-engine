# @ldesign/engine-vue3

Vue 3 adapter for @ldesign/engine-core - Build powerful Vue3 applications with plugin system, middleware, and lifecycle management.

## Features

- 🔌 **Plugin System** - Powerful plugin architecture with dependency management
- 🔄 **Middleware System** - Flexible middleware pipeline
- ⏱️ **Lifecycle Management** - Complete lifecycle hooks
- 📡 **Event System** - Robust event system
- 💾 **State Management** - Vue3 reactive state integration
- 🎨 **Composables** - Vue3 composition API support
- 📦 **Directives** - Built-in and custom directives

## Installation

```bash
pnpm add @ldesign/engine-vue3
```

## Basic Usage

```typescript
import { createEngineApp } from '@ldesign/engine-vue3'
import App from './App.vue'

// Create and mount application
const engine = await createEngineApp({
  rootComponent: App,
  mountElement: '#app',
  config: {
    name: 'My App',
    debug: true
  }
})
```

## Using Composables

```vue
<script setup lang="ts">
import { useEngine, useEvents, useState } from '@ldesign/engine-vue3/composables'

const engine = useEngine()
const events = useEvents()
const state = useState()

// Use engine features
engine.logger.info('Component mounted')

// Listen to events
events.on('user:login', (user) => {
  console.log('User logged in:', user)
})

// Manage state
state.set('user', { name: 'John' })
const user = state.get('user')
</script>
```

## Plugin Development

```typescript
import type { Plugin } from '@ldesign/engine-core'

const myPlugin: Plugin = {
  name: 'my-plugin',
  version: '1.0.0',
  install(context) {
    const { engine, logger } = context
    logger.info('Plugin installed!')
    
    // Add functionality
    engine.events.on('app:ready', () => {
      console.log('App is ready!')
    })
  }
}

// Register plugin
engine.use(myPlugin)
```

## Documentation

For detailed documentation, visit [our documentation site](https://ldesign.github.io/engine/).

## License

MIT © ldesign

