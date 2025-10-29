/**
 * Qwik 引擎应用创建函数
 */

import { CoreEngineImpl } from '@ldesign/engine-core'
import type { QwikEngine, QwikEngineAppOptions } from './types'

/**
 * Qwik 引擎实现
 */
export class QwikEngineImpl extends CoreEngineImpl implements QwikEngine {
  private mounted = false

  /**
   * 挂载应用
   * 
   * 注意: Qwik 使用声明式挂载，通常不需要手动挂载
   * 组件通过 JSX 自动渲染
   */
  async mount(mountElement?: string | Element): Promise<void> {
    if (this.mounted) {
      throw new Error('App already mounted')
    }

    // 执行 beforeMount 生命周期
    await this.lifecycle.execute('beforeMount', this)

    try {
      // Qwik 的挂载是声明式的，这里主要执行生命周期
      this.mounted = true

      // 执行 mount 生命周期
      await this.lifecycle.execute('mount', this)

      // 执行 afterMount 生命周期
      await this.lifecycle.execute('afterMount', this)

      this.logger.info('Qwik app mounted')
    } catch (error) {
      this.logger.error('Failed to mount Qwik app:', error)
      await this.lifecycle.execute('error', this, { error })
      throw error
    }
  }

  /**
   * 卸载应用
   */
  async unmount(): Promise<void> {
    if (!this.mounted) {
      this.logger.warn('No Qwik app to unmount')
      return
    }

    // 执行 beforeUnmount 生命周期
    await this.lifecycle.execute('beforeUnmount', this)

    try {
      this.mounted = false

      // 执行 unmount 生命周期
      await this.lifecycle.execute('unmount', this)

      // 执行 afterUnmount 生命周期
      await this.lifecycle.execute('afterUnmount', this)

      this.logger.info('Qwik app unmounted')
    } catch (error) {
      this.logger.error('Failed to unmount Qwik app:', error)
      throw error
    }
  }

  /**
   * 序列化状态 (用于 SSR)
   */
  serializeState(): string {
    try {
      const state = this.state.getState()
      return JSON.stringify(state)
    } catch (error) {
      this.logger.error('Failed to serialize state:', error)
      return '{}'
    }
  }

  /**
   * 反序列化状态 (用于水合)
   */
  deserializeState(serialized: string): void {
    try {
      const state = JSON.parse(serialized)
      Object.entries(state).forEach(([key, value]) => {
        this.state.set(key, value)
      })
      this.logger.debug('State deserialized successfully')
    } catch (error) {
      this.logger.error('Failed to deserialize state:', error)
    }
  }
}

/**
 * 创建 Qwik 引擎应用
 */
export async function createEngineApp(
  options: QwikEngineAppOptions
): Promise<QwikEngine> {
  const {
    mountElement,
    config = {},
    plugins = [],
    middleware = [],
    features = {},
    onReady,
    onMounted,
    onError = (error, context) => console.error(`[QwikEngine] Error in ${context}:`, error),
  } = options

  try {
    // 创建引擎实例
    const engine = new QwikEngineImpl(config)

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
    if (mountElement !== undefined) {
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

