/**
 * Solid 引擎应用创建函数
 */

import { CoreEngineImpl } from '@ldesign/engine-core'
import type { Component } from 'solid-js'
import { render } from 'solid-js/web'
import { EngineProvider } from './components/EngineProvider'
import type { SolidEngine, SolidEngineAppOptions } from './types'

/**
 * Solid 引擎实现
 */
export class SolidEngineImpl extends CoreEngineImpl implements SolidEngine {
  rootComponent?: Component
  private disposer?: () => void

  /**
   * 挂载应用
   */
  async mount(mountElement: string | Element): Promise<void> {
    if (!this.rootComponent) {
      throw new Error('Root component not set')
    }

    if (this.disposer) {
      throw new Error('App already mounted')
    }

    // 执行 beforeMount 生命周期
    await this.lifecycle.execute('beforeMount', this)

    try {
      const element =
        typeof mountElement === 'string'
          ? document.querySelector(mountElement)
          : mountElement

      if (!element) {
        throw new Error(`Mount element not found: ${mountElement}`)
      }

      // 用 EngineProvider 包装根组件
      const App = () => EngineProvider({
        engine: this,
        children: this.rootComponent!({})
      })

      this.disposer = render(App, element)

      // 执行 mount 生命周期
      await this.lifecycle.execute('mount', this)

      // 执行 afterMount 生命周期
      await this.lifecycle.execute('afterMount', this)

      this.logger.info('Solid app mounted')
    } catch (error) {
      this.logger.error('Failed to mount Solid app:', error)
      await this.lifecycle.execute('error', this, { error })
      throw error
    }
  }

  /**
   * 卸载应用
   */
  async unmount(): Promise<void> {
    if (!this.disposer) {
      this.logger.warn('No Solid app to unmount')
      return
    }

    // 执行 beforeUnmount 生命周期
    await this.lifecycle.execute('beforeUnmount', this)

    try {
      this.disposer()

      // 执行 unmount 生命周期
      await this.lifecycle.execute('unmount', this)

      // 执行 afterUnmount 生命周期
      await this.lifecycle.execute('afterUnmount', this)

      this.disposer = undefined
      this.rootComponent = undefined
      this.logger.info('Solid app unmounted')
    } catch (error) {
      this.logger.error('Failed to unmount Solid app:', error)
      throw error
    }
  }
}

/**
 * 创建 Solid 引擎应用
 */
export async function createEngineApp(
  options: SolidEngineAppOptions
): Promise<SolidEngine> {
  const {
    rootComponent,
    mountElement,
    config = {},
    plugins = [],
    middleware = [],
    features = {},
    onReady,
    onMounted,
    onError = (error, context) => console.error(`[SolidEngine] Error in ${context}:`, error),
  } = options

  try {
    // 创建引擎实例
    const engine = new SolidEngineImpl(config)
    engine.rootComponent = rootComponent

    // 初始化引擎
    await engine.init()

    // 注册中间件
    for (const m of middleware) {
      try {
        engine.middleware.use(m)
      } catch (error) {
        onError(error as Error, `middleware registration: ${m.name}`)
      }
    }

    // 注册插件
    for (const plugin of plugins) {
      try {
        await engine.use(plugin)
      } catch (error) {
        onError(error as Error, `plugin installation: ${plugin.name}`)
      }
    }

    // 触发就绪回调
    if (onReady) {
      try {
        await onReady(engine)
      } catch (error) {
        onError(error as Error, 'onReady callback')
      }
    }

    // 自动挂载（如果提供了挂载元素）
    if (mountElement) {
      await engine.mount(mountElement)

      // 触发挂载完成回调
      if (onMounted) {
        try {
          await onMounted(engine)
        } catch (error) {
          onError(error as Error, 'onMounted callback')
        }
      }
    }

    return engine
  } catch (error) {
    onError(error as Error, 'engine initialization')
    throw error
  }
}


