/**
 * Vue3 引擎应用创建函数
 */

import { CoreEngineImpl } from '@ldesign/engine-core'
import type { App, Component } from 'vue'
import { createApp } from 'vue'
import type { Vue3Engine, Vue3EngineAppOptions } from './types'

/**
 * Vue3 引擎实现
 */
export class Vue3EngineImpl extends CoreEngineImpl implements Vue3Engine {
  app?: App

  /**
   * 创建 Vue 应用
   */
  createApp(rootComponent: Component): App {
    if (this.app) {
      throw new Error('Vue app already created')
    }

    this.app = createApp(rootComponent)

    // 注册引擎到 Vue 应用
    this.app.provide('engine', this)

    // 注册全局属性
    this.app.config.globalProperties.$engine = this

    this.logger.debug('Vue app created')
    return this.app
  }

  /**
   * 挂载应用
   */
  async mount(mountElement: string | Element): Promise<void> {
    if (!this.app) {
      throw new Error('Vue app not created')
    }

    // 执行 beforeMount 生命周期
    await this.lifecycle.execute('beforeMount', this)

    try {
      this.app.mount(mountElement)

      // 执行 mount 生命周期
      await this.lifecycle.execute('mount', this)

      // 执行 afterMount 生命周期
      await this.lifecycle.execute('afterMount', this)

      this.logger.info('Vue app mounted')
    } catch (error) {
      this.logger.error('Failed to mount Vue app:', error)
      await this.lifecycle.execute('error', this, { error })
      throw error
    }
  }

  /**
   * 卸载应用
   */
  async unmount(): Promise<void> {
    if (!this.app) {
      this.logger.warn('No Vue app to unmount')
      return
    }

    // 执行 beforeUnmount 生命周期
    await this.lifecycle.execute('beforeUnmount', this)

    try {
      this.app.unmount()

      // 执行 unmount 生命周期
      await this.lifecycle.execute('unmount', this)

      // 执行 afterUnmount 生命周期
      await this.lifecycle.execute('afterUnmount', this)

      this.app = undefined
      this.logger.info('Vue app unmounted')
    } catch (error) {
      this.logger.error('Failed to unmount Vue app:', error)
      throw error
    }
  }
}

/**
 * 创建 Vue3 引擎应用
 */
export async function createEngineApp(
  options: Vue3EngineAppOptions
): Promise<Vue3Engine> {
  const {
    rootComponent,
    mountElement,
    config = {},
    plugins = [],
    middleware = [],
    features = {},
    onReady,
    onMounted,
    onError = (error, context) => console.error(`[Vue3Engine] Error in ${context}:`, error),
  } = options

  try {
    // 创建引擎实例
    const engine = new Vue3EngineImpl(config)

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

    // 创建 Vue 应用
    const app = engine.createApp(rootComponent)

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

