/**
 * Angular 引擎应用创建函数
 */

import { CoreEngineImpl } from '@ldesign/engine-core'
import type { AngularEngine, AngularEngineAppOptions } from './types'

/**
 * Angular 引擎实现
 */
export class AngularEngineImpl extends CoreEngineImpl implements AngularEngine {
  private mounted = false

  /**
   * 挂载应用
   * 
   * 注意: Angular 应用通过 bootstrapApplication 或 platformBrowserDynamic 启动
   * 这里主要执行生命周期逻辑
   */
  async mount(mountElement?: string | Element): Promise<void> {
    if (this.mounted) {
      throw new Error('App already mounted')
    }

    // 执行 beforeMount 生命周期
    await this.lifecycle.execute('beforeMount', this)

    try {
      // Angular 的挂载由框架自身处理
      this.mounted = true

      // 执行 mount 生命周期
      await this.lifecycle.execute('mount', this)

      // 执行 afterMount 生命周期
      await this.lifecycle.execute('afterMount', this)

      this.logger.info('Angular app mounted')
    } catch (error) {
      this.logger.error('Failed to mount Angular app:', error)
      await this.lifecycle.execute('error', this, { error })
      throw error
    }
  }

  /**
   * 卸载应用
   */
  async unmount(): Promise<void> {
    if (!this.mounted) {
      this.logger.warn('No Angular app to unmount')
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

      this.logger.info('Angular app unmounted')
    } catch (error) {
      this.logger.error('Failed to unmount Angular app:', error)
      throw error
    }
  }
}

/**
 * 创建 Angular 引擎应用
 * 
 * 注意: Angular 应用通常通过 EngineService 在依赖注入系统中使用
 * 这个函数提供了一个统一的创建方式，但在 Angular 中推荐使用 EngineService
 */
export async function createEngineApp(
  options: AngularEngineAppOptions
): Promise<AngularEngine> {
  const {
    mountElement,
    config = {},
    plugins = [],
    middleware = [],
    features = {},
    onReady,
    onMounted,
    onError = (error, context) => console.error(`[AngularEngine] Error in ${context}:`, error),
  } = options

  try {
    // 创建引擎实例
    const engine = new AngularEngineImpl(config)

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

