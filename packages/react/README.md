# @ldesign/engine-react

React adapter for @ldesign/engine-core - Build powerful React applications with plugin system, middleware, and lifecycle management.

## Features

- 🔌 **Plugin System** - Powerful plugin architecture with dependency management
- 🔄 **Middleware System** - Flexible middleware pipeline
- ⏱️ **Lifecycle Management** - Complete lifecycle hooks
- 📡 **Event System** - Robust event system
- 💾 **State Management** - React state integration
- 🎣 **Hooks** - React hooks support
- 📦 **Components** - Built-in components (EngineProvider, ErrorBoundary)

## Installation

```bash
pnpm add @ldesign/engine-react
```

## Basic Usage

```typescript
import { createEngineApp } from '@ldesign/engine-react'
import { createRoot } from 'react-dom/client'
import App from './App'

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

## Using with EngineProvider

```tsx
import { EngineProvider, useEngine, useEvents, useState } from '@ldesign/engine-react'
import { createCoreEngine } from '@ldesign/engine-core'

// Create engine
const engine = createCoreEngine({ debug: true })

// App with provider
function App() {
  return (
    <EngineProvider engine={engine}>
      <MyComponent />
    </EngineProvider>
  )
}

// Use hooks in components
function MyComponent() {
  const engine = useEngine()
  const events = useEvents()
  const state = useState()

  // Use engine features
  React.useEffect(() => {
    engine.logger.info('Component mounted')
    
    // Listen to events
    const unsubscribe = events.on('user:login', (user) => {
      console.log('User logged in:', user)
    })
    
    return () => unsubscribe()
  }, [])

  // Manage state
  const user = state.get('user')

  return <div>User: {user?.name}</div>
}
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

