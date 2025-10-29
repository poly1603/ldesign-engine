/**
 * Svelte 引擎应用创建函数
 */

import { CoreEngineImpl } from '@ldesign/engine-core'
import type { SvelteComponent } from 'svelte'
import { setContext } from 'svelte'
import type { SvelteEngine, SvelteEngineAppOptions, SvelteComponentConstructor } from './types'

// 引擎上下文键
export const ENGINE_CONTEXT_KEY = 'engine'

/**
 * Svelte 引擎实现
 */
export class SvelteEngineImpl extends CoreEngineImpl implements SvelteEngine {
  rootComponent?: SvelteComponentConstructor
  private componentInstance?: SvelteComponent

  /**
   * 挂载应用
   */
  async mount(mountElement: string | Element): Promise<void> {
    if (!this.rootComponent) {
      throw new Error('Root component not set')
    }

    if (this.componentInstance) {
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

      // 创建 Svelte 组件实例，传入 engine 作为 prop
      this.componentInstance = new this.rootComponent({
        target: element,
        props: {
          engine: this
        }
      })

      // 执行 mount 生命周期
      await this.lifecycle.execute('mount', this)

      // 执行 afterMount 生命周期
      await this.lifecycle.execute('afterMount', this)

      this.logger.info('Svelte app mounted')
    } catch (error) {
      this.logger.error('Failed to mount Svelte app:', error)
      await this.lifecycle.execute('error', this, { error })
      throw error
    }
  }

  /**
   * 卸载应用
   */
  async unmount(): Promise<void> {
    if (!this.componentInstance) {
      this.logger.warn('No Svelte app to unmount')
      return
    }

    // 执行 beforeUnmount 生命周期
    await this.lifecycle.execute('beforeUnmount', this)

    try {
      this.componentInstance.$destroy()

      // 执行 unmount 生命周期
      await this.lifecycle.execute('unmount', this)

      // 执行 afterUnmount 生命周期
      await this.lifecycle.execute('afterUnmount', this)

      this.componentInstance = undefined
      this.rootComponent = undefined
      this.logger.info('Svelte app unmounted')
    } catch (error) {
      this.logger.error('Failed to unmount Svelte app:', error)
      throw error
    }
  }
}

/**
 * 创建 Svelte 引擎应用
 */
export async function createEngineApp(
  options: SvelteEngineAppOptions
): Promise<SvelteEngine> {
  const {
    rootComponent,
    mountElement,
    config = {},
    plugins = [],
    middleware = [],
    features = {},
    onReady,
    onMounted,
    onError = (error, context) => console.error(`[SvelteEngine] Error in ${context}:`, error),
  } = options

  try {
    // 创建引擎实例
    const engine = new SvelteEngineImpl(config)
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


