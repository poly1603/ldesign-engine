/**
 * Svelte 框架适配器实现
 * 
 * 将引擎核心功能适配到 Svelte 生态系统
 * 
 * @module adapter/svelte-adapter
 */

import type {
  FrameworkAdapter,
  FrameworkInfo,
  LifecycleHookMap,
  StateAdapter,
  EventAdapter,
  CoreEngine,
} from '@ldesign/engine-core'
import { SvelteStateAdapter } from './svelte-state-adapter'
import { SvelteEventAdapter } from './svelte-event-adapter'

/**
 * Svelte 应用类型
 */
export interface SvelteApp {
  /** 挂载应用 */
  mount(target: Element | string): void
  /** 卸载应用 */
  unmount(): void
  /** 引擎实例 */
  engine?: CoreEngine
}

/**
 * Svelte 组件类型
 */
export interface SvelteComponent {
  new (options: { target: Element; props?: any }): {
    $destroy(): void
    $set(props: any): void
  }
}

/**
 * Svelte 框架适配器
 * 
 * 实现 FrameworkAdapter 接口,提供 Svelte 特定的集成功能
 */
export class SvelteFrameworkAdapter implements FrameworkAdapter<SvelteApp, SvelteComponent, Element> {
  readonly info: FrameworkInfo = {
    name: 'svelte',
    version: '4.0.0',
    features: {
      reactive: true,
      components: true,
      directives: false,
      slots: true,
    },
  }

  /**
   * 创建 Svelte 应用
   * 
   * @param rootComponent - 根组件
   * @param options - 创建选项
   * @returns SvelteApp 实例
   */
  createApp(rootComponent: SvelteComponent, options?: any): SvelteApp {
    let instance: any = null
    let engine: CoreEngine | undefined = undefined

    const app: SvelteApp = {
      mount(target: Element | string) {
        const element = typeof target === 'string' 
          ? document.querySelector(target)
          : target

        if (!element) {
          throw new Error(`Mount target not found: ${target}`)
        }

        instance = new rootComponent({
          target: element,
          props: {
            ...options,
            engine,
          },
        })
      },

      unmount() {
        if (instance) {
          instance.$destroy()
          instance = null
        }
      },

      get engine() {
        return engine
      },

      set engine(value: CoreEngine | undefined) {
        engine = value
        if (instance) {
          instance.$set({ engine: value })
        }
      },
    }

    return app
  }

  /**
   * 挂载应用
   * 
   * @param app - SvelteApp 实例
   * @param mountElement - 挂载元素
   */
  async mount(app: SvelteApp, mountElement: string | Element): Promise<void> {
    app.mount(mountElement)
  }

  /**
   * 卸载应用
   * 
   * @param app - SvelteApp 实例
   */
  async unmount(app: SvelteApp): Promise<void> {
    app.unmount()
  }

  /**
   * 注册引擎到应用
   * 
   * 使用 Svelte 的 context API
   * 
   * @param app - SvelteApp 实例
   * @param engine - 引擎实例
   */
  registerEngine(app: SvelteApp, engine: CoreEngine): void {
    app.engine = engine
  }

  /**
   * 创建状态适配器
   * 
   * @returns Svelte 状态适配器
   */
  createStateAdapter(): StateAdapter {
    return new SvelteStateAdapter()
  }

  /**
   * 创建事件适配器
   * 
   * @returns Svelte 事件适配器
   */
  createEventAdapter(): EventAdapter {
    return new SvelteEventAdapter()
  }

  /**
   * 映射生命周期钩子
   * 
   * @returns 生命周期钩子映射
   */
  mapLifecycleHooks(): LifecycleHookMap {
    return {
      beforeMount: 'onMount',
      mounted: 'onMount',
      beforeUpdate: 'beforeUpdate',
      updated: 'afterUpdate',
      beforeUnmount: 'onDestroy',
      unmounted: 'onDestroy',
    }
  }

  /**
   * 获取应用实例
   * 
   * @param app - SvelteApp 实例
   * @returns SvelteApp 实例本身
   */
  getAppInstance(app: SvelteApp): SvelteApp {
    return app
  }
}

/**
 * 创建 Svelte 框架适配器
 * 
 * @returns Svelte 适配器实例
 */
export function createSvelteAdapter(): SvelteFrameworkAdapter {
  return new SvelteFrameworkAdapter()
}

