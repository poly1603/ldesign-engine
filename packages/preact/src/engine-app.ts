/**
 * Preact 引擎应用创建函数
 */

import { CoreEngineImpl } from '@ldesign/engine-core'
import type { ComponentType } from 'preact'
import { render } from 'preact'
import type { PreactEngine, PreactEngineAppOptions } from './types'

/**
 * Preact 引擎实现
 */
export class PreactEngineImpl extends CoreEngineImpl implements PreactEngine {
  rootComponent?: ComponentType
  private containerElement?: Element

  /**
   * 挂载应用
   */
  async mount(mountElement: string | Element): Promise<void> {
    if (!this.rootComponent) {
      throw new Error('Root component not set')
    }

    if (this.containerElement) {
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

      this.containerElement = element

      // 渲染 Preact 组件
      render(this.rootComponent({}), element)

      // 执行 mount 生命周期
      await this.lifecycle.execute('mount', this)

      // 执行 afterMount 生命周期
      await this.lifecycle.execute('afterMount', this)

      this.logger.info('Preact app mounted')
    } catch (error) {
      this.logger.error('Failed to mount Preact app:', error)
      await this.lifecycle.execute('error', this, { error })
      throw error
    }
  }

  /**
   * 卸载应用
   */
  async unmount(): Promise<void> {
    if (!this.containerElement) {
      this.logger.warn('No Preact app to unmount')
      return
    }

    // 执行 beforeUnmount 生命周期
    await this.lifecycle.execute('beforeUnmount', this)

    try {
      // Preact 的 render(null) 用于卸载
      render(null, this.containerElement)

      // 执行 unmount 生命周期
      await this.lifecycle.execute('unmount', this)

      // 执行 afterUnmount 生命周期
      await this.lifecycle.execute('afterUnmount', this)

      this.containerElement = undefined
      this.rootComponent = undefined
      this.logger.info('Preact app unmounted')
    } catch (error) {
      this.logger.error('Failed to unmount Preact app:', error)
      throw error
    }
  }
}

/**
 * 创建 Preact 引擎应用
 */
export async function createEngineApp(
  options: PreactEngineAppOptions
): Promise<PreactEngine> {
  const {
    rootComponent,
    mountElement,
    config = {},
    plugins = [],
    middleware = [],
    features = {},
    onReady,
    onMounted,
    onError = (error, context) => console.error(`[PreactEngine] Error in ${context}:`, error),
  } = options

  try {
    // 创建引擎实例
    const engine = new PreactEngineImpl(config)
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

