/**
 * AlpineJS 引擎应用创建函数
 */

import { CoreEngineImpl } from '@ldesign/engine-core'
import type { AlpineJSEngine, AlpineJSEngineAppOptions } from './types'

/**
 * AlpineJS 引擎实现
 */
export class AlpineJSEngineImpl extends CoreEngineImpl implements AlpineJSEngine {
  private mounted = false
  private alpineInstance?: any

  /**
   * 挂载应用
   * 
   * 注意: AlpineJS 通过 x-data 等指令声明式挂载
   * 这里主要执行生命周期和注册 magic properties
   */
  async mount(mountElement?: string | Element): Promise<void> {
    if (this.mounted) {
      throw new Error('App already mounted')
    }

    // 执行 beforeMount 生命周期
    await this.lifecycle.execute('beforeMount', this)

    try {
      // 获取 Alpine 实例
      if (typeof window !== 'undefined' && (window as any).Alpine) {
        this.alpineInstance = (window as any).Alpine
        this.registerMagicProperties()
      }

      this.mounted = true

      // 执行 mount 生命周期
      await this.lifecycle.execute('mount', this)

      // 执行 afterMount 生命周期
      await this.lifecycle.execute('afterMount', this)

      this.logger.info('AlpineJS app mounted')
    } catch (error) {
      this.logger.error('Failed to mount AlpineJS app:', error)
      await this.lifecycle.execute('error', this, { error })
      throw error
    }
  }

  /**
   * 卸载应用
   */
  async unmount(): Promise<void> {
    if (!this.mounted) {
      this.logger.warn('No AlpineJS app to unmount')
      return
    }

    // 执行 beforeUnmount 生命周期
    await this.lifecycle.execute('beforeUnmount', this)

    try {
      this.mounted = false
      this.alpineInstance = undefined

      // 执行 unmount 生命周期
      await this.lifecycle.execute('unmount', this)

      // 执行 afterUnmount 生命周期
      await this.lifecycle.execute('afterUnmount', this)

      this.logger.info('AlpineJS app unmounted')
    } catch (error) {
      this.logger.error('Failed to unmount AlpineJS app:', error)
      throw error
    }
  }

  /**
   * 注册 Alpine magic properties
   */
  private registerMagicProperties(): void {
    if (!this.alpineInstance) {
      return
    }

    const Alpine = this.alpineInstance
    const engine = this

    // $engine magic property
    Alpine.magic('engine', () => engine)

    // $engineState magic property
    Alpine.magic('engineState', () => (path: string) => engine.state.get(path))

    // $engineEmit magic property
    Alpine.magic('engineEmit', () => (event: string, data?: any) => engine.events.emit(event, data))

    // $engineOn magic property
    Alpine.magic('engineOn', () => (event: string, handler: (data: any) => void) => 
      engine.events.on(event, handler)
    )

    this.logger.debug('Alpine magic properties registered')
  }

  /**
   * 获取 Alpine 实例
   */
  getAlpineInstance(): any {
    return this.alpineInstance
  }
}

/**
 * 创建 AlpineJS 引擎应用
 */
export async function createEngineApp(
  options: AlpineJSEngineAppOptions
): Promise<AlpineJSEngine> {
  const {
    mountElement,
    config = {},
    plugins = [],
    middleware = [],
    features = {},
    onReady,
    onMounted,
    onError = (error, context) => console.error(`[AlpineJSEngine] Error in ${context}:`, error),
  } = options

  try {
    // 创建引擎实例
    const engine = new AlpineJSEngineImpl(config)

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

