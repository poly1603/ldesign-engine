/**
 * Lit 引擎应用创建函数
 */

import { CoreEngineImpl } from '@ldesign/engine-core'
import type { LitEngine, LitEngineAppOptions } from './types'

/**
 * Lit 引擎实现
 */
export class LitEngineImpl extends CoreEngineImpl implements LitEngine {
  private mounted = false
  private customElements = new Set<string>()

  /**
   * 挂载应用
   * 
   * 注意: Lit 组件通过自定义元素自动挂载
   * 这里主要执行生命周期和初始化逻辑
   */
  async mount(mountElement?: string | Element): Promise<void> {
    if (this.mounted) {
      throw new Error('App already mounted')
    }

    // 执行 beforeMount 生命周期
    await this.lifecycle.execute('beforeMount', this)

    try {
      // Lit 的挂载是通过自定义元素完成的
      this.mounted = true

      // 执行 mount 生命周期
      await this.lifecycle.execute('mount', this)

      // 执行 afterMount 生命周期
      await this.lifecycle.execute('afterMount', this)

      this.logger.info('Lit app mounted')
    } catch (error) {
      this.logger.error('Failed to mount Lit app:', error)
      await this.lifecycle.execute('error', this, { error })
      throw error
    }
  }

  /**
   * 卸载应用
   */
  async unmount(): Promise<void> {
    if (!this.mounted) {
      this.logger.warn('No Lit app to unmount')
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

      this.logger.info('Lit app unmounted')
    } catch (error) {
      this.logger.error('Failed to unmount Lit app:', error)
      throw error
    }
  }

  /**
   * 注册自定义元素
   */
  registerElement(tagName: string, elementClass: CustomElementConstructor): void {
    if (this.customElements.has(tagName)) {
      this.logger.warn(`Custom element "${tagName}" already registered`)
      return
    }

    try {
      customElements.define(tagName, elementClass)
      this.customElements.add(tagName)
      this.logger.debug(`Custom element "${tagName}" registered`)
    } catch (error) {
      this.logger.error(`Failed to register custom element "${tagName}":`, error)
      throw error
    }
  }

  /**
   * 获取已注册的自定义元素列表
   */
  getRegisteredElements(): string[] {
    return Array.from(this.customElements)
  }
}

/**
 * 创建 Lit 引擎应用
 */
export async function createEngineApp(
  options: LitEngineAppOptions
): Promise<LitEngine> {
  const {
    mountElement,
    config = {},
    plugins = [],
    middleware = [],
    features = {},
    customElements: elements = [],
    onReady,
    onMounted,
    onError = (error, context) => console.error(`[LitEngine] Error in ${context}:`, error),
  } = options

  try {
    // 创建引擎实例
    const engine = new LitEngineImpl(config)

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

    // 注册自定义元素
    for (const element of elements) {
      try {
        engine.registerElement(element.tagName, element.elementClass)
      } catch (error) {
        onError(error as Error, `custom element registration: ${element.tagName}`)
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

