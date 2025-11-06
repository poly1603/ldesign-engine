/**
 * Svelte 引擎应用创建函数
 */

import type { ComponentType } from 'svelte'
import type {
  CoreEngine,
  CoreEngineConfig,
  Plugin,
  Middleware,
} from '@ldesign/engine-core'
import { createCoreEngine } from '@ldesign/engine-core'
import { createSvelteAdapter } from './adapter'

export interface RouterConfig {
  mode?: 'history' | 'hash' | 'memory'
  base?: string
  routes: any[]
  preset?: 'spa' | 'mpa' | 'mobile' | 'desktop' | 'admin' | 'blog'
}

export interface SvelteEngineAppOptions {
  rootComponent: ComponentType
  mountElement: string | Element
  config?: CoreEngineConfig
  plugins?: Plugin[]
  middleware?: Middleware[]
  router?: RouterConfig
  rootProps?: Record<string, any>
  onReady?: (engine: SvelteEngineApp) => void | Promise<void>
  onMounted?: (engine: SvelteEngineApp) => void | Promise<void>
  onError?: (error: Error, context: string) => void
}

export interface SvelteEngineApp extends CoreEngine {
  app: any
  adapter: ReturnType<typeof createSvelteAdapter>
}

export async function createEngineApp(
  options: SvelteEngineAppOptions
): Promise<SvelteEngineApp> {
  const {
    rootComponent,
    mountElement,
    config = {},
    plugins = [],
    middleware = [],
    router: routerConfig,
    rootProps = {},
    onReady,
    onMounted,
    onError,
  } = options

  try {
    const adapter = createSvelteAdapter()
    const coreEngine = createCoreEngine(config)
    await coreEngine.init()

    for (const mw of middleware) {
      coreEngine.middleware.use(mw)
    }

    if (routerConfig) {
      try {
        const { createRouterEnginePlugin } = await import('@ldesign/router-svelte')
        const routerPlugin = createRouterEnginePlugin({
          name: 'router',
          version: '1.0.0',
          ...routerConfig,
        })
        plugins.unshift(routerPlugin)

        if (config.debug) {
          console.log('[Engine] Router plugin created successfully')
        }
      } catch (error) {
        console.warn(
          'Failed to load @ldesign/router-svelte. Router functionality will not be available.',
          error
        )
      }
    }

    for (const plugin of plugins) {
      await coreEngine.use(plugin)
    }

    const app = adapter.createApp(rootComponent, rootProps)
    adapter.registerEngine(app, coreEngine)

    const engineApp: SvelteEngineApp = {
      ...coreEngine,
      app,
      adapter,
    }

    if (onReady) {
      await onReady(engineApp)
    }

    await coreEngine.lifecycle.trigger('beforeMount')
    await adapter.mount(app, mountElement)
    await coreEngine.lifecycle.trigger('mounted')

    if (onMounted) {
      await onMounted(engineApp)
    }

    console.log(' Svelte 应用已启动')
    return engineApp
  } catch (error) {
    if (onError) {
      onError(error as Error, 'createEngineApp')
    }
    throw error
  }
}

export interface SvelteEngineAppConfig {
  rootComponent: ComponentType
  mountElement: string | Element
  config?: CoreEngineConfig
  plugins?: Plugin[]
  middleware?: Middleware[]
  props?: Record<string, any>
  onReady?: (engine: CoreEngine) => void | Promise<void>
  onMounted?: (engine: CoreEngine) => void | Promise<void>
  onError?: (error: Error, context: any) => void
}

export function createEngineAppSync(config: SvelteEngineAppConfig): CoreEngine {
  const adapter = createSvelteAdapter()
  const engine = createCoreEngine({
    name: config.config?.name || 'Svelte Engine App',
    version: config.config?.version || '1.0.0',
    debug: config.config?.debug ?? false,
    adapter,
  })

  ;(async () => {
    try {
      for (const plugin of config.plugins || []) {
        await engine.use(plugin)
      }

      for (const mw of config.middleware || []) {
        engine.middleware.use(mw)
      }

      await engine.init()

      if (config.onReady) {
        await config.onReady(engine)
      }

      const app = adapter.createApp(config.rootComponent, { props: config.props })
      adapter.registerEngine(app, engine)
      await adapter.mount(app, config.mountElement)

      if (config.onMounted) {
        await config.onMounted(engine)
      }

      await engine.lifecycle.trigger('mounted')
    } catch (error) {
      if (config.onError) {
        config.onError(error as Error, { config })
      } else {
        console.error('Failed to initialize Svelte engine app:', error)
      }
    }
  })()

  return engine
}
